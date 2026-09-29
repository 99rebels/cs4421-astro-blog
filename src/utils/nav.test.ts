import { describe, expect, it } from 'vitest';

import { isCurrentPage } from './nav';

describe('isCurrentPage', () => {
	it('is current when the path matches the link exactly', () => {
		expect(isCurrentPage('/blog', '/blog')).toBe(true);
	});

	it('ignores a trailing slash on either side', () => {
		expect(isCurrentPage('/blog', '/blog/')).toBe(true);
		expect(isCurrentPage('/blog/', '/blog')).toBe(true);
	});

	it('is current on a page nested beneath the link', () => {
		expect(isCurrentPage('/blog', '/blog/my-post/')).toBe(true);
	});

	it('is not current on a path that only shares a prefix with the link', () => {
		expect(isCurrentPage('/blog', '/blogroll/')).toBe(false);
	});

	it('marks Home current only on the homepage', () => {
		expect(isCurrentPage('/', '/')).toBe(true);
		expect(isCurrentPage('/', '/blog/')).toBe(false);
		expect(isCurrentPage('/', '/blog/my-post/')).toBe(false);
	});
});
