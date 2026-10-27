import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseFeed, recentUnique } from './feeds.ts';

// Saved sample feeds, never the live internet, so the tests give the same result every run.
const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const now = new Date('2026-10-27T12:00:00Z');

describe('parseFeed', () => {
	it('reads an RSS feed, unwrapping CDATA, entities and HTML', () => {
		const [first] = parseFeed(fixture('news.rss.xml'));

		expect(first).toEqual({
			title: "Chipmaker's shares jump & rally",
			link: 'https://news.example.com/chip-rally',
			published: new Date('2026-10-27T09:00:00Z'),
			summary: 'Shares rose 8% after the firm’s results.',
			source: 'Example News',
		});
	});

	it('drops items whose date cannot be read', () => {
		const links = parseFeed(fixture('news.rss.xml')).map((item) => item.link);

		expect(links).not.toContain('https://news.example.com/no-date');
	});

	it('reads an Atom feed, picking the main link rather than the comments link', () => {
		const [first, second] = parseFeed(fixture('news.atom.xml'));

		expect(first.link).toBe('https://atom.example.com/screen-fault');
		expect(first.source).toBe('Example Atom Site');
		expect(first.summary).toBe('The company said a fix is coming.');
		// An entry with only <updated> is still dated.
		expect(second.published).toEqual(new Date('2026-10-27T07:00:00Z'));
	});

	it('falls back to the audio file for a podcast episode with no page link', () => {
		const [episode] = parseFeed(fixture('podcast.rss.xml'));

		expect(episode.link).toBe('https://audio.example.com/ep42.mp3');
		expect(episode.published).toEqual(new Date('2026-10-27T12:00:00Z'));
	});

	it('rejects something that is not a feed', () => {
		expect(() => parseFeed('<html><body>Not found</body></html>')).toThrow('Not an RSS or Atom feed');
	});
});

describe('recentUnique', () => {
	const items = [...parseFeed(fixture('news.rss.xml')), ...parseFeed(fixture('news.atom.xml'))];

	it('keeps only the last 24 hours, newest first', () => {
		const titles = recentUnique(items, now, 24).map((item) => item.title);

		expect(titles).toEqual(["Chipmaker's shares jump & rally", 'Phone maker admits screen fault']);
	});

	it('keeps one copy of a story that two feeds both carry', () => {
		const links = recentUnique(items, now, 24).map((item) => item.link);

		expect(links.filter((link) => link === 'https://news.example.com/chip-rally')).toHaveLength(1);
	});

	it('drops items dated in the future', () => {
		const titles = recentUnique(items, new Date('2026-10-27T08:30:00Z'), 24).map((item) => item.title);

		expect(titles).not.toContain("Chipmaker's shares jump & rally");
	});
});
