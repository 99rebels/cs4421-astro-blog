import { defineMiddleware } from 'astro:middleware';
import { buildLogEntry, shouldLog } from './utils/log';

// Runs around every request, pages and API routes alike, so each one is logged once
// without every endpoint having to remember to do it.
export const onRequest = defineMiddleware(async (context, next) => {
	// When a page returns a 404, Astro runs the same request through middleware again to
	// render its 404 page. The first pass has already logged it, so skip the second.
	if (context.routePattern === '/404') {
		return next();
	}

	const start = performance.now();
	const route = context.url.pathname;

	function log(statusCode: number) {
		if (shouldLog(route, statusCode)) {
			const latencyMs = Math.round(performance.now() - start);
			// One line per request: log tools such as CloudWatch treat each line as one event.
			console.log(JSON.stringify(buildLogEntry(context.request.method, route, statusCode, latencyMs)));
		}
	}

	try {
		const response = await next();
		log(response.status);
		return response;
	} catch (error) {
		// A page that crashes throws through here instead of returning a response, so it
		// would otherwise never be logged. Astro still turns the error into a 500 page.
		log(500);
		throw error;
	}
});
