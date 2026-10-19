export type Theme = 'light' | 'dark';

/**
 * Picks the theme to show: the visitor's saved choice if it's a valid one,
 * otherwise their operating system's preference.
 *
 * BaseLayout copies this function's source text into an inline <head> script, so it
 * must stay self-contained: no imports, and nothing from outside its own body.
 */
export function resolveTheme(stored: string | null, systemPrefersDark: boolean): Theme {
	// localStorage can hold anything a script or the visitor put there, so only an
	// exact match counts as a choice.
	if (stored === 'light' || stored === 'dark') {
		return stored;
	}
	return systemPrefersDark ? 'dark' : 'light';
}
