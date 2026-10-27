import { describe, expect, it } from 'vitest';

import { getCommit } from './commit';

describe('getCommit', () => {
	it('returns the commit set at deploy time', () => {
		expect(getCommit({ COMMIT_SHA: 'abc123' })).toBe('abc123');
	});

	it('is unknown when no commit is set', () => {
		expect(getCommit({})).toBe('unknown');
		expect(getCommit({ COMMIT_SHA: '' })).toBe('unknown');
	});
});
