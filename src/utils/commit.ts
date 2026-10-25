/**
 * The commit this server was deployed from. ECS sets COMMIT_SHA at deploy time; anywhere
 * else (local dev, a plain `docker run`) it isn't set, so it reports 'unknown'.
 */
export function getCommit(env: Record<string, string | undefined> = process.env): string {
	return env.COMMIT_SHA || 'unknown';
}
