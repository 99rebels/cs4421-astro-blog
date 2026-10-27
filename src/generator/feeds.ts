import { XMLParser } from 'fast-xml-parser';

export interface FeedItem {
	title: string;
	link: string;
	published: Date;
	/** Plain text, HTML removed, shortened, so the prompt stays a predictable size. */
	summary: string;
	/** The feed's own name, e.g. "Ars Technica". */
	source: string;
}

const SUMMARY_LENGTH = 600;

// Lists are always arrays, even when a feed has a single item, so the code below doesn't
// have to handle "one item" and "many items" differently.
const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
	textNodeName: 'text',
	isArray: (name) => ['item', 'entry', 'link'].includes(name),
});

// A tag's text can come back as a string, a number, or an object when the tag also has
// attributes (e.g. <title type="html">). This flattens all three to a string.
function text(value: unknown): string {
	if (typeof value === 'string' || typeof value === 'number') {
		return String(value);
	}
	if (value && typeof value === 'object' && 'text' in value) {
		return text((value as { text: unknown }).text);
	}
	return '';
}

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Text inside <![CDATA[...]]> isn't decoded by the XML parser, and feeds often put HTML
// codes there (&amp;, &#8217; for ’), so they're decoded here.
function decodeEntities(value: string): string {
	return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
		if (code[0] === '#') {
			const number = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
			return String.fromCodePoint(number);
		}
		return NAMED_ENTITIES[code.toLowerCase()] ?? match;
	});
}

function plain(html: string): string {
	const stripped = decodeEntities(html.replace(/<[^>]*>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim();
	return stripped.length > SUMMARY_LENGTH ? `${stripped.slice(0, SUMMARY_LENGTH)}…` : stripped;
}

type Node = Record<string, unknown>;

// RSS puts the address in <link>; podcast feeds often only have the audio file in
// <enclosure url="…">. Atom uses <link href="…"> and may list several links.
function itemLink(item: Node): string {
	const links = (item.link as unknown[] | undefined) ?? [];
	for (const link of links) {
		if (typeof link === 'string' && link.trim()) {
			return link.trim();
		}
		const atom = link as { href?: string; rel?: string };
		if (atom?.href && (!atom.rel || atom.rel === 'alternate')) {
			return atom.href;
		}
	}
	return (item.enclosure as { url?: string } | undefined)?.url ?? '';
}

/**
 * Reads an RSS or Atom feed. Items without a title, a link or a valid date are dropped,
 * since a post can't cite or date them.
 */
export function parseFeed(xml: string): FeedItem[] {
	const doc = parser.parse(xml) as Node;
	const rss = (doc.rss as Node | undefined)?.channel as Node | undefined;
	const atom = doc.feed as Node | undefined;
	const channel = rss ?? atom;
	if (!channel) {
		throw new Error('Not an RSS or Atom feed');
	}

	const source = text(channel.title);
	const items = ((rss ? channel.item : channel.entry) as Node[] | undefined) ?? [];

	return items
		.map((item) => ({
			title: plain(text(item.title)),
			link: itemLink(item),
			published: new Date(text(item.pubDate ?? item.published ?? item.updated)),
			summary: plain(text(item.description ?? item.summary ?? item.content)),
			source,
		}))
		.filter((item) => item.title && item.link && !Number.isNaN(item.published.valueOf()));
}

/**
 * Keeps items published in the last `hours` before `now`, drops repeats of the same link
 * (two feeds often carry the same story), and puts the newest first.
 */
export function recentUnique(items: FeedItem[], now: Date, hours: number): FeedItem[] {
	const since = now.valueOf() - hours * 60 * 60 * 1000;
	const seen = new Set<string>();

	return items
		.filter((item) => item.published.valueOf() > since && item.published <= now)
		.sort((a, b) => b.published.valueOf() - a.published.valueOf())
		.filter((item) => {
			if (seen.has(item.link)) {
				return false;
			}
			seen.add(item.link);
			return true;
		});
}

/** Fetches a URL as text. Throws on a network error, a timeout or a non-2xx status. */
export async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, {
		// Some news sites refuse requests that don't look like a browser or feed reader.
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; daily-brief/1.0; +https://blog.99rebels.com)' },
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	return response.text();
}
