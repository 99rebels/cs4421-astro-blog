import { Marked, type Tokens } from 'marked';

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// Only web addresses (and relative ones, which stay on this site). This rules out
// javascript: and data: links, which run code or load content when clicked.
function isSafeUrl(href: string): boolean {
	try {
		return ['http:', 'https:'].includes(new URL(href, 'https://blog.99rebels.com').protocol);
	} catch {
		return false;
	}
}

// Post bodies come from the database, and generated ones are written from text by
// strangers (news feeds), so nothing in a post may run in a visitor's browser. Returning
// false from a renderer means "use marked's normal output".
const marked = new Marked({
	renderer: {
		// Raw HTML in the Markdown is shown as text instead of being added to the page.
		html({ text }: Tokens.HTML | Tokens.Tag) {
			return escapeHtml(text);
		},
		link(token: Tokens.Link) {
			return isSafeUrl(token.href) ? false : this.parser.parseInline(token.tokens);
		},
		image(token: Tokens.Image) {
			return isSafeUrl(token.href) ? false : escapeHtml(token.text);
		},
	},
});

/** Turns a post's Markdown into HTML that's safe to put on the page. */
export function renderMarkdown(markdown: string): string {
	return marked.parse(markdown, { async: false });
}
