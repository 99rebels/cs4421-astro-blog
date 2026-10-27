import type { Sql } from 'postgres';

export interface Post {
	slug: string;
	title: string;
	description: string;
	body: string;
	tags: string[];
	publishedAt: Date;
}

// Each function takes the connection as a parameter, so the integration tests can pass
// one pointing at a test database. Values inside ${} are sent separately from the SQL
// text, so they can never be run as SQL (no SQL injection).

/** Every post, newest first. */
export async function listPosts(sql: Sql): Promise<Post[]> {
	return sql<Post[]>`
		SELECT slug, title, description, body, tags, published_at AS "publishedAt"
		FROM posts
		ORDER BY published_at DESC
	`;
}

/** The post with this slug, or undefined if there isn't one. */
export async function getPost(sql: Sql, slug: string): Promise<Post | undefined> {
	const [post] = await sql<Post[]>`
		SELECT slug, title, description, body, tags, published_at AS "publishedAt"
		FROM posts
		WHERE slug = ${slug}
	`;
	return post;
}

/** True if a post with this slug exists. Lets the generator skip a day that's already done. */
export async function postExists(sql: Sql, slug: string): Promise<boolean> {
	const [row] = await sql`SELECT 1 FROM posts WHERE slug = ${slug}`;
	return row !== undefined;
}

/** The bodies of posts published since `since`, so the generator can avoid repeating itself. */
export async function recentBodies(sql: Sql, since: Date): Promise<string[]> {
	const rows = await sql<{ body: string }[]>`SELECT body FROM posts WHERE published_at >= ${since}`;
	return rows.map((row) => row.body);
}

export async function insertPost(sql: Sql, post: Post): Promise<void> {
	await sql`
		INSERT INTO posts (slug, title, description, body, tags, published_at)
		VALUES (${post.slug}, ${post.title}, ${post.description}, ${post.body}, ${post.tags}, ${post.publishedAt})
	`;
}

/** Rejects if the database can't be reached. Used by the readiness check. */
export async function checkDatabase(sql: Sql): Promise<void> {
	await sql`SELECT 1`;
}
