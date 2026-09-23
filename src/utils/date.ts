/**
 * Formats a date for display on posts, e.g. "Jan 15, 2026".
 *
 * Uses the runtime's local timezone, which is the behaviour this site has always
 * had. Because the site is built statically, "local" means the timezone of the
 * machine running `astro build`, not the reader's.
 */
export function formatDate(date: Date): string {
	return date.toLocaleDateString('en-us', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}
