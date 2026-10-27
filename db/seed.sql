-- Sample posts for local development and the integration tests only. Never run this on
-- Supabase: the live site's posts come from the post generator.
INSERT INTO posts (slug, title, description, body, tags, published_at) VALUES
(
	'sample-first-post',
	'Sample: the first post',
	'The oldest of three sample posts.',
	E'This is sample content from `db/seed.sql`.\n\n## A heading\n\nA paragraph with a [link](https://example.com).',
	ARRAY['sample'],
	'2026-10-01 09:00:00+00'
),
(
	'sample-second-post',
	'Sample: the second post',
	'The middle of three sample posts.',
	E'Another sample post.\n\n- one\n- two\n- three',
	ARRAY['sample', 'lists'],
	'2026-10-02 09:00:00+00'
),
(
	'sample-third-post',
	'Sample: the third post',
	'The newest of three sample posts, so it is listed first.',
	'A short sample post with no tags.',
	ARRAY[]::TEXT[],
	'2026-10-03 09:00:00+00'
);
