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

/** Rejects if the database can't be reached. Used by the readiness check. */
export async function checkDatabase(sql: Sql): Promise<void> {
	await sql`SELECT 1`;
}
