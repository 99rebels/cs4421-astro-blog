// Liveness: is the process up and able to answer? It deliberately checks nothing else.
// A crashed or stuck process can't answer at all, so the probe times out and the
// platform restarts the container.
export function GET() {
	return Response.json({ status: 'alive', uptime: process.uptime() });
}
