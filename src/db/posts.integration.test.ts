import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { checkDatabase, getPost, insertPost, listPosts, postExists, recentBodies } from './posts';

// A separate variable from DATABASE_URL on purpose: these tests drop the posts table, so
// they must never be able to point at Supabase by accident. Failing beats skipping, which
// would let CI pass without running them.
const url = process.env.TEST_DATABASE_URL;
if (!url) {
	throw new Error('TEST_DATABASE_URL is not set. Start a database with `docker compose up db`.');
}

// onnotice silences Postgres's "table does not exist, skipping" message from DROP.
const sql = postgres(url, { onnotice: () => {} });

// Start from the real schema and seed files every run, which also proves they're valid SQL.
beforeAll(async () => {
	await sql`DROP TABLE IF EXISTS posts`;
	await sql.file('db/schema.sql');
	await sql.file('db/seed.sql');
});

afterAll(async () => {
	await sql.end();
});

describe('listPosts', () => {
	it('returns every post, newest first', async () => {
		const slugs = (await listPosts(sql)).map((post) => post.slug);

		expect(slugs).toEqual(['sample-third-post', 'sample-second-post', 'sample-first-post']);
	});
});

describe('getPost', () => {
	it('returns the post with that slug', async () => {
		const post = await getPost(sql, 'sample-second-post');

		expect(post?.title).toBe('Sample: the second post');
		expect(post?.tags).toEqual(['sample', 'lists']);
		expect(post?.publishedAt).toBeInstanceOf(Date);
	});

	it('returns undefined for an unknown slug, so the page can 404', async () => {
		expect(await getPost(sql, 'no-such-post')).toBeUndefined();
	});
});

describe('checkDatabase', () => {
	it('succeeds when the database is reachable', async () => {
		await expect(checkDatabase(sql)).resolves.toBeUndefined();
	});

	it('fails when the database is unreachable, so readiness can return 503', async () => {
		// Nothing listens on port 1, so the connection is refused straight away.
		const unreachable = postgres('postgres://blog:blog@127.0.0.1:1/blog');

		await expect(checkDatabase(unreachable)).rejects.toThrow();
		await unreachable.end();
	});
});

// Runs last, because it adds a post that the listPosts test above doesn't expect.
describe('the generator\'s queries', () => {
	const post = {
		slug: 'daily-brief-2026-10-27',
		title: 'Daily brief: 27 October 2026',
		description: 'A test brief.',
		body: '### Founders Weekly (Jane Doe)',
		tags: ['ai', 'news'],
		publishedAt: new Date('2026-10-27T07:00:00Z'),
	};

	it('saves a post that then reads back unchanged', async () => {
		await insertPost(sql, post);

		expect(await getPost(sql, post.slug)).toEqual(post);
	});

	it('knows whether a post already exists, so a re-run skips the day', async () => {
		expect(await postExists(sql, post.slug)).toBe(true);
		expect(await postExists(sql, 'daily-brief-2026-10-28')).toBe(false);
	});

	it('refuses a second post with the same slug', async () => {
		await expect(insertPost(sql, post)).rejects.toThrow();
	});

	it('returns the bodies of posts since a date, so recommendations are not repeated', async () => {
		const bodies = await recentBodies(sql, new Date('2026-10-20T00:00:00Z'));

		expect(bodies).toEqual(['### Founders Weekly (Jane Doe)']);
	});
});
