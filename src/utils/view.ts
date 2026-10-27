export type View = 'classic' | 'terminal';

/**
 * Picks the look to show: terminal only if the visitor has switched to it, otherwise the
 * classic design, which is what a first visit gets.
 *
 * BaseLayout copies this function's source text into an inline <head> script, so it
 * must stay self-contained: no imports, and nothing from outside its own body.
 */
export function resolveView(stored: string | null): View {
	// localStorage can hold anything, so only an exact match switches the look.
	return stored === 'terminal' ? 'terminal' : 'classic';
}
