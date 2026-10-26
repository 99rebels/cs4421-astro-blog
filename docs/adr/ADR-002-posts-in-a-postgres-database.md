# ADR-002: Store Posts in a Postgres Database on Supabase

## Status

Accepted (Date: 2026-10-26)

## Context

Blog posts are still Markdown files in the repo, bundled into the image when it was built. A new post still needed a commit, a PR and a redeploy.

The site is about to get an automatic post generator. It will run on a schedule in GitHub Actions, ask an LLM to write a post from news feeds, and save the result. That post needs to go somewhere the running site can read straight away.

- The container's own disk doesn't work. It's reset on every deploy.
- Committing a Markdown file per post doesn't scale. Every generated post would trigger a full build and deploy, fill the Git history with bot commits, and need a way around branch protection.

posts need to live in a store outside the container that both the site and the
generator can reach.

## Decision

I will store posts in a **Postgres database hosted on Supabase**, and connect to it as
**plain Postgres**.

- One `posts` table, defined in `db/schema.sql`. The post body is stored as Markdown and
  turned into HTML when the page is requested.
- The app connects with the `postgres` driver and a single `DATABASE_URL` connection
  string, through Supabase's session pooler with SSL. No Supabase-specific library is used.
- Locally, `docker compose` runs the app next to a plain Postgres container loaded with
  sample posts. CI runs the integration tests against a Postgres service container (on the Github CI).
- In AWS, the connection string is stored in SSM Parameter Store.

## Options considered

**Where posts are stored**

- **Markdown files in the repo (the current approach).** Rejected: every post means a
  commit and a redeploy, as described above.
- **Amazon RDS (Postgres inside AWS).** The same database engine, and it would keep
  everything in one account. Rejected for now: It containes a constantly running charge, not needed for my purposes.
- **DynamoDB.** Cheap and serverless, but it isn't SQL. It would mean learning a different
  way of querying for a single table of posts.
- **Supabase (chosen).** Hosted Postgres with a free tier, a web SQL editor for setting up
  the table, and a connection string that works from both AWS and GitHub Actions.

**How the app talks to Supabase**
- **Plain Postgres (chosen).** The same code runs against the local container, the CI
  database and Supabase. Only `DATABASE_URL` changes.

**Where the connection string is kept**

- **A GitHub secret, passed to the container as an environment variable.** Rejected: the
  value would end up in plain text in the ECS task settings, visible in the AWS console.
- **AWS Secrets Manager.** Does the job, but it's paidand it's extra features aren't needed.
- **SSM Parameter Store SecureString (chosen).** Encrypted, free, and the value never
  appears in the repo, GitHub, CloudFormation or the ECS console.

## Consequences

**Positive**

- New posts appear on the site as soon as they're saved, with no rebuild or redeploy.
- The same code and the same SQL run locally, in CI and in production.
- Integration tests run against a real Postgres, not a fake, so the SQL itself is tested.
- The database password is never in the repo.

**Negative**

- **A new runtime dependency.** If Supabase is down or unreachable, `/api/health/ready`
  returns 503 and the load balancer stops sending traffic, so visitors get errors. The
  container isn't restarted, since restarting wouldn't fix the database.
- Every page request now makes a database query, which is slower than reading files built
  into the image.
- Supabase sits outside my infrastructure as code. The project, the table and the
  connection string are set up by hand, and there is no migrations tool, so schema changes
  are applied manually. That's acceptable for one table but is click ops.
- Supabase pauses free projects after a period of inactivity. The scheduled post
  generator writes regularly, which keeps it active.
- The live blog is empty until the post generator runs.
