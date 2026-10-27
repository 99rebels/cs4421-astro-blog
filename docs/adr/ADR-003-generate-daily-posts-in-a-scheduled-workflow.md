# ADR-003: Generate Daily Posts in a Scheduled GitHub Actions Workflow

## Status

Accepted (Date: 2026-10-27)

## Context

ADR-002 moved posts into a Postgres database so that new posts appear without a redeploy.
Something now has to write those posts. The site should publish a daily brief: the day's
news on AI, tech, markets and space from public news feeds, new episodes from the podcasts
I follow, and three podcast recommendations, written up by an LLM.

The job runs once a day, and needs two secrets: an LLM API key and
the database connection string.
## Decision

We will run the generator as a **scheduled GitHub Actions workflow**
(`generate-post.yml`), daily at 07:00 am and also runnable by hand. It saves the post
straight to Supabase, and the site shows it on the next page load.

- The LLM is **Google Gemini on the free tier** (`gemini-3.8-flash`), called over plain
  HTTPS with no SDK. The model name lives in the config file.
- The feeds, podcasts, recommendation search terms and model all live in a config file, `src/generator/config.json`.
- The slug comes from the date (`daily-brief-2026-10-27`), and the run first checks whether
  that post exists. Re-running a day does nothing and spends no tokens.
- Podcast recommendations come from **Apple's public podcast search**, filtered in code
  (recently active, not already followed, not recommended in the last 30
  days), so the LLM can only pick shows that really exist.
- The post page turns Markdown into HTML through a function that shows raw HTML as text and
  drops non-web links, so nothing in a post can run in a visitor's browser.
- Each run prints one JSON line: feeds fetched and failed, items found, tokens used, time
  taken, and the outcome.

## Options considered

**Where the generator runs**

- **An ECS scheduled task (EventBridge) or AWS Lambda.** Keeps everything in AWS, but needs
  new infrastructure in CDK, its own permissions, and the LLM key stored in AWS.
- **GitHub Actions (chosen).** Free for a public repo, already holds our secrets, has a
  "run now" button, keeps each run's log next to the CI and deploy runs, and emails on
  failure. Nothing new to build or pay for.

**Which LLM**

- **z.ai GLM.** The original plan. z.ai's Coding Plan is limited by its terms to supported
  coding tools, so a script would need a separate pay as you go account.
- **Google Gemini free tier (chosen).** No cost at one call a day, well within the free
  limits, and a model strong enough to follow the format.

**Where podcast transcripts come from**

- **Spotify's API.** It doesn't provide transcripts, and since February 2026 new developer
  apps are restricted.
- **The podcasts' public RSS feeds (chosen).** Almost every show publishes one. The episode
  description is enough for a short blurb, and it uses the same code as the news feeds.

## Consequences

**Positive**

- A new post every day with no manual work and no redeploy.
- No new infrastructure and no cost.
- A re-run or retry can never publish a duplicate.
- Every link in a post comes from real data, so the LLM can't invent a source or a podcast.
- One failed feed doesn't stop the run, and each run's outcome is one searchable log line.

**Negative**

- GitHub can start scheduled runs late when it's busy, and pauses schedules on a repo with
  no activity for 60 days.
- Free models get retired. When that happens the run fails with a clear error and the model
  name in the config needs changing.
- The LLM can still get a fact slightly wrong, or be steered by text in a feed (prompt
  injection).

**Limitation**

Recommendation quality depends on Apple's search results, which include many low-effort
shows. The code checks that a show is real and active; whether it's good is left to the
LLM's judgement.
