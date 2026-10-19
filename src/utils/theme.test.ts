import { describe, expect, it } from 'vitest';

import { resolveTheme } from './theme';

describe('resolveTheme', () => {
	it('uses a stored light choice even when the system prefers dark', () => {
		expect(resolveTheme('light', true)).toBe('light');
	});

	it('uses a stored dark choice even when the system prefers light', () => {
		expect(resolveTheme('dark', false)).toBe('dark');
	});

	it('follows the system when nothing is stored', () => {
		expect(resolveTheme(null, true)).toBe('dark');
		expect(resolveTheme(null, false)).toBe('light');
	});

	it('ignores an invalid stored value and follows the system', () => {
		expect(resolveTheme('purple', true)).toBe('dark');
		expect(resolveTheme('', false)).toBe('light');
		expect(resolveTheme('DARK', false)).toBe('light');
	});

	it('still works when copied out as source text, as BaseLayout does', () => {
		// If the function ever referenced anything outside itself, this copy would throw.
		const copy = new Function(`return ${resolveTheme.toString()}`)();

		expect(copy('dark', false)).toBe('dark');
		expect(copy(null, true)).toBe('dark');
	});
});
