const WORDS_PER_MINUTE = 200;

/**
 * Estimates reading time in whole minutes, rounding up and never below 1, so even a
 * very short post doesn't claim to take "0 min".
 */
export function readingTime(body: string): number {
	const words = body.match(/\S+/g)?.length ?? 0;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
