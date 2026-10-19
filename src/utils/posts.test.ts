import { describe, expect, it } from 'vitest';

import { getPublishedPosts, readingTime } from './posts';

function post(id: string, pubDate: string, draft = false) {
	return { id, data: { pubDate: new Date(pubDate), draft } };
}

describe('getPublishedPosts', () => {
	const posts = [
		post('old', '2026-01-01'),
		post('draft', '2026-03-01', true),
		post('new', '2026-02-01'),
	];

	it('hides drafts in production', () => {
		const ids = getPublishedPosts(posts, true).map((p) => p.id);

		expect(ids).not.toContain('draft');
	});

	it('keeps drafts in development', () => {
		const ids = getPublishedPosts(posts, false).map((p) => p.id);

		expect(ids).toContain('draft');
	});

	it('lists posts newest first', () => {
		expect(getPublishedPosts(posts, true).map((p) => p.id)).toEqual(['new', 'old']);
		expect(getPublishedPosts(posts, false).map((p) => p.id)).toEqual(['draft', 'new', 'old']);
	});

	it('returns an empty list when there are no posts', () => {
		expect(getPublishedPosts([], true)).toEqual([]);
	});
});

describe('readingTime', () => {
	it('rounds a normal post up to the next whole minute', () => {
		// 450 words at 200 words per minute is 2.25 minutes.
		expect(readingTime('word '.repeat(450))).toBe(3);
	});

	it('gives a very short post 1 minute rather than 0', () => {
		expect(readingTime('Just a few words.')).toBe(1);
	});

	it('gives an empty or whitespace-only body 1 minute', () => {
		expect(readingTime('')).toBe(1);
		expect(readingTime('  \n\t  ')).toBe(1);
	});

	it('counts words split by newlines and repeated spaces', () => {
		const body = `${'word '.repeat(200)}\n\n${'word   '.repeat(200)}`;

		expect(readingTime(body)).toBe(2);
	});
});
