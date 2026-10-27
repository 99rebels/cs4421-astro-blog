import { describe, expect, it } from 'vitest';

import { type Episode, type LlmBrief, type NewsItem, formatDay, parseBrief, renderBody } from './brief.ts';
import type { PodcastCandidate } from './podcasts.ts';

const published = new Date('2026-10-27T09:00:00Z');

const news: NewsItem[] = [
	{ topic: 'AI', title: 'Lab releases model', link: 'https://a.example.com/model', published, summary: '', source: 'Site A' },
	{ topic: 'AI', title: 'Same model, second take', link: 'https://b.example.com/model', published, summary: '', source: 'Site B' },
	{ topic: 'Space', title: 'Unused story', link: 'https://c.example.com/unused', published, summary: '', source: 'Site C' },
];

const episodes: Episode[] = [
	{ show: 'Cheeky Pint', title: 'Ep 1', link: 'https://audio.example.com/1.mp3', published, summary: '', source: 'Cheeky Pint' },
];

const candidates: PodcastCandidate[] = [
	{ id: 11, name: 'Founders Weekly', author: 'Jane Doe', feedUrl: '', url: 'https://podcasts.apple.com/id11', episodes: 100, lastRelease: published, genre: '' },
	{ id: 22, name: 'Market Movers', author: 'John Roe', feedUrl: '', url: 'https://podcasts.apple.com/id22', episodes: 100, lastRelease: published, genre: '' },
];

const valid: LlmBrief = {
	description: 'A lab releases a model.',
	topics: [{ name: 'AI', stories: [{ headline: 'Lab releases model', summary: 'A summary.', sources: [0, 1] }] }],
	episodes: [{ index: 0, blurb: 'Founders talk shop.' }],
	recommendations: [{ id: 22, why: 'You follow markets.' }],
};

// The arguments that match the fixtures above: 3 news items, 1 episode, 2 candidates, 1 wanted.
const parse = (brief: unknown) => parseBrief(JSON.stringify(brief), 3, 1, [11, 22], 1);

describe('parseBrief', () => {
	it('accepts a reply in the agreed shape', () => {
		expect(parse(valid)).toEqual(valid);
	});

	it('rejects a reply that is not JSON', () => {
		expect(() => parseBrief('Sure! Here is your brief:', 3, 1, [11, 22], 1)).toThrow('not JSON');
	});

	it('rejects a story citing an item that was never sent', () => {
		const brief = { ...valid, topics: [{ name: 'AI', stories: [{ headline: 'h', summary: 's', sources: [7] }] }] };

		expect(() => parse(brief)).toThrow('malformed story');
	});

	it('rejects a recommended podcast that was not in the search results', () => {
		expect(() => parse({ ...valid, recommendations: [{ id: 999, why: 'Made up.' }] })).toThrow('invalid recommendations');
	});

	it('rejects the wrong number of recommendations', () => {
		const two = [{ id: 11, why: 'a' }, { id: 22, why: 'b' }];

		expect(() => parse({ ...valid, recommendations: two })).toThrow('invalid recommendations');
	});

	it('rejects a missing or invented episode blurb', () => {
		expect(() => parse({ ...valid, episodes: [] })).toThrow('invalid episode blurbs');
		expect(() => parse({ ...valid, episodes: [{ index: 5, blurb: 'x' }] })).toThrow('invalid episode blurbs');
	});
});

describe('renderBody', () => {
	const body = renderBody(valid, news, episodes, candidates);

	it('says the post was written by an AI', () => {
		expect(body.split('\n')[0]).toContain('written by an AI');
	});

	it('cites every source of a story with its real link', () => {
		expect(body).toContain('A summary. ([Site A](<https://a.example.com/model>), [Site B](<https://b.example.com/model>))');
	});

	it('lists only the items actually used under Sources', () => {
		const sources = body.slice(body.indexOf('## Sources'));

		expect(sources).toContain('https://a.example.com/model');
		expect(sources).not.toContain('https://c.example.com/unused');
	});

	it('adds the new episode and the recommendation with links built from real data', () => {
		expect(body).toContain('### Cheeky Pint: Ep 1');
		expect(body).toContain('[Listen](<https://audio.example.com/1.mp3>)');
		expect(body).toContain('### Market Movers (John Roe)');
		expect(body).toContain('[Apple Podcasts](<https://podcasts.apple.com/id22>)');
	});

	it('leaves out the episodes section on a day with no new episodes', () => {
		expect(renderBody({ ...valid, episodes: [] }, news, [], candidates)).not.toContain('## New podcast episodes');
	});

	it('stops the LLM turning its own text into a link or HTML', () => {
		const sneaky = {
			...valid,
			topics: [{ name: 'AI', stories: [{ headline: 'h', summary: '[click](https://evil.example) <script>', sources: [0] }] }],
		};
		const rendered = renderBody(sneaky, news, episodes, candidates);

		expect(rendered).toContain('\\[click\\]\\(https://evil.example\\) \\<script\\>');
	});
});

describe('formatDay', () => {
	it('uses the UTC date, so it matches the slug even late at night in another timezone', () => {
		expect(formatDay(new Date('2026-10-27T23:30:00Z'))).toBe('27 October 2026');
	});
});
