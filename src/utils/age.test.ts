import { describe, expect, it } from 'vitest';

import { getAge } from './age';

// Months count from 0 in the Date constructor, so 2 is March.
const birthDate = new Date(2007, 2, 1);

describe('getAge', () => {
	it('does not count the birthday until the day itself', () => {
		expect(getAge(birthDate, new Date(2026, 1, 28))).toBe(18);
	});

	it('counts the birthday on the day itself', () => {
		expect(getAge(birthDate, new Date(2026, 2, 1))).toBe(19);
	});

	it('counts the birthday for the rest of the year', () => {
		expect(getAge(birthDate, new Date(2026, 11, 31))).toBe(19);
	});

	it('does not count the birthday earlier in the same month', () => {
		const midMonthBirthday = new Date(2000, 5, 15);

		expect(getAge(midMonthBirthday, new Date(2026, 5, 14))).toBe(25);
		expect(getAge(midMonthBirthday, new Date(2026, 5, 15))).toBe(26);
	});

	it('treats a 29 February birthday as 1 March in non-leap years', () => {
		const leapDayBirthday = new Date(2004, 1, 29);

		expect(getAge(leapDayBirthday, new Date(2026, 1, 28))).toBe(21);
		expect(getAge(leapDayBirthday, new Date(2026, 2, 1))).toBe(22);
		expect(getAge(leapDayBirthday, new Date(2028, 1, 29))).toBe(24);
	});
});
