import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
	it('renders normal Markdown: headings, emphasis and web links', () => {
		const html = renderMarkdown('## Title\n\nSome *text* and a [link](https://example.com).');

		expect(html).toContain('<h2>Title</h2>');
		expect(html).toContain('<em>text</em>');
		expect(html).toContain('<a href="https://example.com">link</a>');
	});

	it('shows a script tag as text instead of running it', () => {
		const html = renderMarkdown('Hello <script>alert(1)</script>');

		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('neutralises a block of raw HTML with an event handler', () => {
		const html = renderMarkdown('<div onmouseover="alert(1)">hover me</div>');

		expect(html).not.toContain('<div');
		expect(html).toContain('&lt;div onmouseover=');
	});

	it('drops a javascript: link but keeps its text', () => {
		const html = renderMarkdown('[click me](javascript:alert(1))');

		expect(html).not.toContain('<a');
		expect(html).toContain('click me');
	});

	it('also catches a disguised javascript: link', () => {
		expect(renderMarkdown('[x](JaVaScRiPt:alert(1))')).not.toContain('<a');
	});

	it('drops an image that is not a web address', () => {
		const html = renderMarkdown('![pic](data:image/svg+xml,<svg onload=alert(1)>)');

		expect(html).not.toContain('<img');
	});

	it('keeps relative links, which stay on this site', () => {
		expect(renderMarkdown('[blog](/blog/)')).toContain('<a href="/blog/">blog</a>');
	});
});
