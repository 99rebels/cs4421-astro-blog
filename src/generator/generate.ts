// Writes today's daily brief and saves it to the database. Run by the generate-post
// workflow (`npm run generate`); needs GEMINI_API_KEY and DATABASE_URL.
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

import { insertPost, postExists, recentBodies } from '../db/posts.ts';
import { type Episode, type NewsItem, SYSTEM_PROMPT, buildPrompt, formatDay, parseBrief, renderBody } from './brief.ts';
import { fetchText, parseFeed, recentUnique } from './feeds.ts';
import { askGemini } from './gemini.ts';
import { type PodcastCandidate, filterCandidates, searchUrl, toCandidates } from './podcasts.ts';

interface Config {
	model: string;
	windowHours: number;
	maxItemsPerTopic: number;
	topics: { name: string; feeds: string[] }[];
	podcasts: { name: string; feed: string }[];
	recommendations: { count: number; searchTerms: string[]; minEpisodes: number; activeWithinDays: number; noRepeatDays: number };
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Enough for the LLM to choose well from (about 30 tokens each), without an unbounded prompt.
const MAX_CANDIDATES = 60;

const config: Config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'));
const start = performance.now();
const now = new Date();
const slug = `daily-brief-${now.toISOString().slice(0, 10)}`;

// Everything the run learns goes into one JSON line at the end, so each run is one
// searchable event in the Actions log, whether it succeeds or fails.
const summary: Record<string, unknown> = { slug, feedsFetched: 0, feedsFailed: [] as string[] };

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not set`);
	}
	return value;
}

// One feed failing must not stop the run, so failures are recorded and skipped.
async function readFeed(url: string) {
	try {
		const items = parseFeed(await fetchText(url));
		summary.feedsFetched = (summary.feedsFetched as number) + 1;
		return recentUnique(items, now, config.windowHours);
	} catch (error) {
		(summary.feedsFailed as string[]).push(`${url}: ${(error as Error).message}`);
		return [];
	}
}

async function fetchNews(): Promise<NewsItem[]> {
	const perTopic = await Promise.all(
		config.topics.map(async (topic) => {
			const items = recentUnique((await Promise.all(topic.feeds.map(readFeed))).flat(), now, config.windowHours);
			return items.slice(0, config.maxItemsPerTopic).map((item) => ({ ...item, topic: topic.name }));
		}),
	);
	return perTopic.flat();
}

async function fetchEpisodes(): Promise<Episode[]> {
	const perShow = await Promise.all(
		config.podcasts.map(async (podcast) => (await readFeed(podcast.feed)).map((item) => ({ ...item, show: podcast.name }))),
	);
	return perShow.flat();
}

async function findCandidates(sql: postgres.Sql): Promise<PodcastCandidate[]> {
	const rules = config.recommendations;
	const searches = await Promise.all(
		rules.searchTerms.map(async (term) => {
			try {
				return toCandidates(JSON.parse(await fetchText(searchUrl(term))));
			} catch (error) {
				(summary.feedsFailed as string[]).push(`podcast search "${term}": ${(error as Error).message}`);
				return [];
			}
		}),
	);
	const found = filterCandidates(searches.flat(), {
		followedFeeds: config.podcasts.map((podcast) => podcast.feed),
		followedNames: config.podcasts.map((podcast) => podcast.name),
		recentPosts: await recentBodies(sql, new Date(now.valueOf() - rules.noRepeatDays * DAY_MS)),
		minEpisodes: rules.minEpisodes,
		activeSince: new Date(now.valueOf() - rules.activeWithinDays * DAY_MS),
	});
	return found.slice(0, MAX_CANDIDATES);
}

async function run(sql: postgres.Sql) {
	// A second run on the same day (a manual re-run, or a retry) does nothing and spends
	// no tokens, so it can never publish a duplicate.
	if (await postExists(sql, slug)) {
		summary.status = 'skipped: already published today';
		return;
	}

	const [news, episodes, candidates] = await Promise.all([fetchNews(), fetchEpisodes(), findCandidates(sql)]);
	Object.assign(summary, { newsItems: news.length, episodes: episodes.length, candidates: candidates.length });
	if (news.length === 0) {
		throw new Error('No news items from any feed in the last day');
	}

	const count = config.recommendations.count;
	const reply = await askGemini(required('GEMINI_API_KEY'), config.model, SYSTEM_PROMPT, buildPrompt(news, episodes, candidates, count));
	Object.assign(summary, { model: config.model, inputTokens: reply.inputTokens, outputTokens: reply.outputTokens });

	const brief = parseBrief(reply.text, news.length, episodes.length, candidates.map((show) => show.id), count);
	const topics = brief.topics.filter((topic) => topic.stories.length > 0).map((topic) => topic.name.toLowerCase());

	await insertPost(sql, {
		slug,
		title: `Daily brief: ${formatDay(now)}`,
		description: brief.description,
		body: renderBody(brief, news, episodes, candidates),
		tags: [...topics, ...(episodes.length > 0 ? ['podcasts'] : []), 'news'],
		publishedAt: now,
	});
	summary.status = 'published';
}

let sql: postgres.Sql | undefined;
try {
	sql = postgres(required('DATABASE_URL'), { max: 1 });
	await run(sql);
} catch (error) {
	summary.status = 'failed';
	summary.error = (error as Error).message;
	// A non-zero exit turns the Actions run red, and GitHub emails about failed scheduled runs.
	process.exitCode = 1;
} finally {
	await sql?.end();
	summary.durationMs = Math.round(performance.now() - start);
	console.log(JSON.stringify(summary));
}
