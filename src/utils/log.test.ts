import { describe, expect, it } from 'vitest';

import { buildLogEntry, logLevel, shouldLog } from './log';

describe('logLevel', () => {
	it('is INFO for successful and redirect responses', () => {
		expect(logLevel(200)).toBe('INFO');
		expect(logLevel(301)).toBe('INFO');
		expect(logLevel(399)).toBe('INFO');
	});

	it('is WARN for client errors', () => {
		expect(logLevel(400)).toBe('WARN');
		expect(logLevel(404)).toBe('WARN');
		expect(logLevel(499)).toBe('WARN');
	});

	it('is ERROR for server errors', () => {
		expect(logLevel(500)).toBe('ERROR');
		expect(logLevel(503)).toBe('ERROR');
	});
});

describe('buildLogEntry', () => {
	it('has exactly the six structured fields', () => {
		const now = new Date('2026-09-28T14:32:01.120Z');

		expect(buildLogEntry('POST', '/api/feedback', 200, 42, now)).toEqual({
			timestamp: '2026-09-28T14:32:01.120Z',
			level: 'INFO',
			route: '/api/feedback',
			method: 'POST',
			statusCode: 200,
			latencyMs: 42,
		});
	});

	it('serialises to a single line of JSON', () => {
		const line = JSON.stringify(buildLogEntry('GET', '/', 200, 5));

		expect(line).not.toContain('\n');
	});
});

describe('shouldLog', () => {
	it('skips successful health checks', () => {
		expect(shouldLog('/api/health', 200)).toBe(false);
		expect(shouldLog('/api/health/live', 200)).toBe(false);
		expect(shouldLog('/api/health/ready', 200)).toBe(false);
	});

	it('always logs a failed health check', () => {
		expect(shouldLog('/api/health/ready', 503)).toBe(true);
		expect(shouldLog('/api/health', 500)).toBe(true);
	});

	it('logs every other route, whatever the status', () => {
		expect(shouldLog('/', 200)).toBe(true);
		expect(shouldLog('/blog/typo/', 404)).toBe(true);
	});

	it('does not treat a route that merely starts with "health" as a health check', () => {
		expect(shouldLog('/api/healthy', 200)).toBe(true);
	});
});
