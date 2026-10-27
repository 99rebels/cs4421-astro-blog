import { describe, expect, it } from 'vitest';

import { resolveView } from './view';

describe('resolveView', () => {
	it('shows the classic look on a first visit, when nothing is stored', () => {
		expect(resolveView(null)).toBe('classic');
	});

	it('shows the terminal look once the visitor has switched to it', () => {
		expect(resolveView('terminal')).toBe('terminal');
	});

	it('shows the classic look when the visitor switched back', () => {
		expect(resolveView('classic')).toBe('classic');
	});

	it('ignores an invalid stored value', () => {
		expect(resolveView('Terminal')).toBe('classic');
		expect(resolveView('')).toBe('classic');
	});
});
