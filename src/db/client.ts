import postgres from 'postgres';

let sql: postgres.Sql | undefined;

/**
 * The app's one connection pool, created on first use. Throwing here instead of at import
 * means a missing DATABASE_URL fails the request that needs the database (and readiness
 * reports 503), rather than stopping the whole server from starting.
 */
export function getSql(): postgres.Sql {
	if (!sql) {
		const url = process.env.DATABASE_URL;
		if (!url) {
			throw new Error('DATABASE_URL is not set');
		}
		sql = postgres(url);
	}
	return sql;
}
