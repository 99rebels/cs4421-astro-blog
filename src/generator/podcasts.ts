export interface PodcastCandidate {
	id: number;
	name: string;
	author: string;
	feedUrl: string;
	/** The show's Apple Podcasts page. */
	url: string;
	episodes: number;
	lastRelease: Date;
	genre: string;
}

export interface CandidateRules {
	/** Feed addresses and names of the shows already followed, so they aren't recommended. */
	followedFeeds: string[];
	followedNames: string[];
	/** Text of recent posts: a show named in one was recommended recently. */
	recentPosts: string[];
	minEpisodes: number;
	activeSince: Date;
}

interface AppleResult {
	collectionId?: number;
	collectionName?: string;
	artistName?: string;
	feedUrl?: string;
	collectionViewUrl?: string;
	trackCount?: number;
	releaseDate?: string;
	primaryGenreName?: string;
}

/** Turns Apple's podcast search response into candidates, skipping shows with missing details. */
export function toCandidates(response: { results?: AppleResult[] }): PodcastCandidate[] {
	return (response.results ?? []).flatMap((result) => {
		const { collectionId, collectionName, feedUrl, collectionViewUrl } = result;
		if (!collectionId || !collectionName || !feedUrl || !collectionViewUrl) {
			return [];
		}
		return [
			{
				id: collectionId,
				name: collectionName,
				author: result.artistName ?? '',
				feedUrl,
				url: collectionViewUrl,
				episodes: result.trackCount ?? 0,
				lastRelease: new Date(result.releaseDate ?? ''),
				genre: result.primaryGenreName ?? '',
			},
		];
	});
}

/**
 * Keeps shows worth recommending. The directory is full of copycats and abandoned shows, so a
 * show needs a real back catalogue and a recent episode. Shows already followed, or named
 * in a recent post, are skipped so the same few don't come round every day.
 */
export function filterCandidates(candidates: PodcastCandidate[], rules: CandidateRules): PodcastCandidate[] {
	const seen = new Set<number>();
	// Matching on the name as well as the feed catches copycats that reuse a followed show's name.
	const followedNames = rules.followedNames.map((name) => name.toLowerCase());

	return candidates.filter((show) => {
		const name = show.name.toLowerCase();
		const keep =
			!seen.has(show.id) &&
			show.episodes >= rules.minEpisodes &&
			show.lastRelease >= rules.activeSince &&
			!rules.followedFeeds.includes(show.feedUrl) &&
			!followedNames.some((followed) => name.includes(followed)) &&
			!rules.recentPosts.some((post) => post.includes(show.name));
		seen.add(show.id);
		return keep;
	});
}

/** Apple's free podcast search: no key needed, and it returns each show's feed address. */
export function searchUrl(term: string): string {
	return `https://itunes.apple.com/search?media=podcast&limit=25&term=${encodeURIComponent(term)}`;
}
