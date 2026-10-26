-- The only table the site reads. Run once against a new database: Postgres runs it
-- automatically in docker compose, the integration tests load it, and on Supabase it's
-- pasted into the SQL editor by hand.
CREATE TABLE posts (
	-- The post's URL is /blog/<slug>/, so it has to be unique.
	slug TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	-- Markdown; the site turns it into HTML when the page is requested.
	body TEXT NOT NULL,
	tags TEXT[] NOT NULL DEFAULT '{}',
	published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
