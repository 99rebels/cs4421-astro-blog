type Level = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
	timestamp: string;
	level: Level;
	route: string;
	method: string;
	statusCode: number;
	latencyMs: number;
}

/**
 * 5xx means the server failed, 4xx means the request was wrong (e.g. a mistyped URL),
 * anything else is normal traffic.
 */
export function logLevel(statusCode: number): Level {
	if (statusCode >= 500) {
		return 'ERROR';
	}
	if (statusCode >= 400) {
		return 'WARN';
	}
	return 'INFO';
}

/**
 * Builds one structured log entry for a finished request. `now` is a parameter so tests
 * can pin the timestamp. The timestamp is UTC (toISOString), so it reads the same
 * whatever timezone the server runs in.
 */
export function buildLogEntry(
	method: string,
	route: string,
	statusCode: number,
	latencyMs: number,
	now: Date = new Date(),
): LogEntry {
	return {
		timestamp: now.toISOString(),
		level: logLevel(statusCode),
		route,
		method,
		statusCode,
		latencyMs,
	};
}

/**
 * The hosting platform polls the health checks every few seconds, so logging every
 * successful one would bury the lines that matter. Failed health checks are always logged.
 */
export function shouldLog(route: string, statusCode: number): boolean {
	// Matching on a path boundary, so a route like /api/healthy isn't mistaken for one.
	const isHealthCheck = route === '/api/health' || route.startsWith('/api/health/');
	return !(isHealthCheck && statusCode < 400);
}
