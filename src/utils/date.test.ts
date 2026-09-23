import { describe, expect, it } from 'vitest';

import { formatDate } from './date';

describe('formatDate', () => {
	it('formats a date as "Mon D, YYYY"', () => {
		expect(formatDate(new Date(2026, 0, 15))).toBe('Jan 15, 2026');
	});

	it('does not pad single-digit days with a leading zero', () => {
		expect(formatDate(new Date(2026, 8, 5))).toBe('Sep 5, 2026');
	});

	it('abbreviates the month rather than spelling it out', () => {
		expect(formatDate(new Date(2025, 11, 31))).toBe('Dec 31, 2025');
	});

	it('formats the local calendar day, not the UTC day', () => {
		// new Date('...Z') is a UTC instant. Anywhere behind UTC that same instant
		// is still the previous day locally, so the rendered day can differ from the
		// date string you typed. getDate() is the local day, so this asserts we
		// follow the machine's timezone without hardcoding one.
		const utcMidnight = new Date('2026-01-15T00:00:00Z');

		expect(formatDate(utcMidnight)).toContain(`${utcMidnight.getDate()},`);
	});
});
