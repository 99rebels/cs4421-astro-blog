import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { type CandidateRules, filterCandidates, toCandidates } from './podcasts.ts';

const search = JSON.parse(readFileSync(new URL('./fixtures/apple-search.json', import.meta.url), 'utf8'));

const rules: CandidateRules = {
	followedFeeds: ['https://feeds.example.com/movers'],
	followedNames: ['Prof G Markets'],
	recentPosts: [],
	minEpisodes: 20,
	activeSince: new Date('2026-09-27T00:00:00Z'),
};

const names = (rulesToUse: CandidateRules) =>
	filterCandidates(toCandidates(search), rulesToUse).map((show) => show.name);

describe('toCandidates', () => {
	it('skips results without a feed address', () => {
		expect(toCandidates(search).map((show) => show.name)).not.toContain('No Feed Show');
	});
});

describe('filterCandidates', () => {
	it('keeps an active show with a real back catalogue', () => {
		expect(names(rules)).toEqual(['Founders Weekly']);
	});

	it('drops a copycat that reuses the name of a followed show', () => {
		expect(names(rules)).not.toContain('Prof G Markets');
	});

	it('drops shows with very few episodes, and shows that have gone quiet', () => {
		expect(names(rules)).not.toContain('Two Episodes Only');
		expect(names(rules)).not.toContain('Gone Quiet');
	});

	it('drops a show already followed, matched by its feed', () => {
		expect(names(rules)).not.toContain('Market Movers');
	});

	it('drops a show named in a recent post, so recommendations do not repeat', () => {
		const recentPosts = ['## Podcasts you might like\n\n### Founders Weekly (Jane Doe)'];

		expect(names({ ...rules, recentPosts })).toEqual([]);
	});

	it('keeps one copy of a show that several searches returned', () => {
		const twice = { results: [...search.results, ...search.results] };

		expect(filterCandidates(toCandidates(twice), rules)).toHaveLength(1);
	});
});
