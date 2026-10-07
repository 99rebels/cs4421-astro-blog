import { getCollection } from 'astro:content';

// Readiness: can the app serve real pages? Today pages only depend on the blog content,
// so that's what this checks. A 503 tells the platform to stop sending traffic here
// without restarting it. Future dependency checks (e.g. a database) go here, not in /live.
export async function GET() {
	try {
		await getCollection('blog');
		return Response.json({ status: 'ready' });
	} catch {
		return Response.json({ status: 'not ready' }, { status: 503 });
	}
}
