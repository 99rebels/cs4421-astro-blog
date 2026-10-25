import { getCommit } from '../../utils/commit';

export function GET() {
	return Response.json({
		status: 'ok',
		commit: getCommit(),
		uptime: process.uptime(),
		timestamp: new Date(),
	});
}
