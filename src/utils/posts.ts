// Only the fields these helpers read, so tests can pass plain objects instead of
// real collection entries.
interface DatedPost {
	data: { pubDate: Date; draft: boolean };
}

/**
 * Returns the posts a reader should see, newest first.
 *
 * Drafts are dropped in production but kept in development, so a draft can be
 * previewed with `astro dev` without ever being published.
 */
export function getPublishedPosts<T extends DatedPost>(posts: T[], isProduction: boolean): T[] {
	return posts
		.filter((post) => !isProduction || !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

const WORDS_PER_MINUTE = 200;

/**
 * Estimates reading time in whole minutes, rounding up and never below 1, so even a
 * very short post doesn't claim to take "0 min".
 */
export function readingTime(body: string): number {
	const words = body.match(/\S+/g)?.length ?? 0;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
