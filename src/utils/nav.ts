/**
 * Decides whether a nav link points at the page being viewed, so the header can
 * mark it as the current page.
 *
 * A link is current on its own page and on any page nested beneath it, so Blog
 * stays current on /blog/my-post/.
 */
export function isCurrentPage(linkHref: string, currentPath: string): boolean {
	// Comparing with a trailing slash on both sides makes "/blog" and "/blog/" equal,
	// and means a match must end on a path boundary: "/blogroll/" does not start
	// with "/blog/".
	const link = withTrailingSlash(linkHref);
	const path = withTrailingSlash(currentPath);

	// Every path starts with "/", so Home must match exactly or it would be current
	// on every page.
	if (link === '/') {
		return path === '/';
	}
	return path.startsWith(link);
}

function withTrailingSlash(value: string): string {
	return value.endsWith('/') ? value : value + '/';
}
