import { getSql } from '../../../db/client';
import { checkDatabase } from '../../../db/posts';

// Readiness: can the app serve real pages? Pages need the database, so that's what this
// checks. A 503 tells the platform to stop sending traffic here without restarting it.
// Dependency checks belong here, not in /live, or a database outage would restart
// healthy containers.
export async function GET() {
	try {
		await checkDatabase(getSql());
		return Response.json({ status: 'ready' });
	} catch {
		return Response.json({ status: 'not ready' }, { status: 503 });
	}
}
