## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)




# Rules for coding


# CLAUDE.md

Project rules for Claude Code. Read this before doing anything in this repo.

---

## What this repo is

An Astro blog built for **CS4421 DevOps** at University of Limerick (ISE, 8-week module).
The blog content is irrelevant to the grade. What is graded is the **DevOps process**
around it: tickets, branching, pull requests, tests, CI, and a live AWS deployment.

In Week 8 I sit a **1-on-1 live defense and chaos drill** — 3 to 5 minutes where I have
to explain what's in this repo and why, and diagnose something the lecturer deliberately
breaks. There is also an explicit academic-integrity rule against AI-generated blind
pastes.

**Therefore: I must be able to explain every line in this repo.** That single fact drives
every rule below. Code I can't defend is worse than no code.

---

## Your role

You **write and debug code**. That's it.

I do everything else myself, because doing it is how I learn it — and the weekly quizzes
(60% of the module) test exactly these skills with real error logs, Git conflict markers
and YAML snippets.

### You do

- Implement what the current ticket asks for, and nothing else.
- Write tests for that work.
- Explain what you wrote, in plain language, after you write it.
- Help me debug: read errors, explain what they mean, suggest what to try.
- Tell me the Git command I need and what it does — then let me run it.
- Answer questions about the codebase.

### You do not

- **No git writes.** Never run `git add`, `git commit`, `git push`, `git merge`,
  `git rebase`, `git checkout -b`, `git branch`, `git stash`, `git reset`, `git revert`,
  or anything else that changes repository or branch state. Not even if I seem to be
  asking for it in passing. If a task appears to need one, stop and tell me the command.
- **Read-only git is fine:** `git status`, `git diff`, `git log`, `git show`,
  `git branch --list`, `git remote -v`. Use these freely to understand state.
- **No GitHub operations.** Never use the `gh` CLI or any API to create, edit or close
  issues, open or merge pull requests, add labels, change branch protection, or alter
  repository settings. I create every ticket and every PR myself.
- **No merge conflict resolution.** If there's a conflict, explain what the markers mean
  and what each side is doing. I resolve it by hand.
- **Never bypass branch protection** or suggest a way around it.

---

## Scope discipline

The biggest failure mode here is doing too much. Extra code is extra surface I have to
defend under time pressure, and it makes pull requests harder for classmates to review.

- **Do exactly what the ticket's acceptance criteria say.** Nothing more.
- **Touch only the files that ticket needs.** Don't tidy, refactor, reformat or "improve"
  files you happened to open.
- **Improvements outside scope get suggested, never done.** If you spot something worth
  fixing, finish the ticket first, then list it at the end under "Out of scope — worth a
  separate ticket?". I'll decide whether to raise it.
- **Ask before adding a dependency.** Name what it's for, how big it is, and what the
  no-dependency alternative would cost. Prefer no dependency.
- **Don't invent features.** No "I also added..." — if it wasn't in the acceptance
  criteria, it doesn't belong in this change.
- **Don't get ahead of the course.** This module teaches topics in a fixed order (CI in
  Week 3, cloud/IaC in Week 4, SSR in Week 5, Docker in Week 6, CD in Week 7). Do not add
  Dockerfiles, Terraform, GitHub Actions workflows, adapters or deployment config unless
  the current ticket explicitly calls for it. If a ticket seems to need something from a
  later week, say so and stop.

---

## How to work a ticket

1. **Plan first.** Before editing anything, say what you intend to change, which files,
   and how you'll test it. Wait for my go-ahead. Use plan mode when I've started you in it.
2. **Build small.** Prefer the smallest change that satisfies the acceptance criteria.
3. **Extract testable logic.** Pull decision logic out of components into small pure
   functions so it can be unit tested (e.g. `resolveTheme(stored, systemPrefersDark)`,
   `getPublishedPosts(posts, isProduction)`).
4. **Write tests with the code**, including the edge cases named in the ticket. Tests are
   Vitest.
5. **Run the checks** and report the real output: `npm run check`, `npm run lint`,
   `npm test`. Don't claim something passes without running it.
6. **Explain the change** (see below).
7. **Stop.** Leave it uncommitted. I review the diff, commit, push and open the PR.

---

## Explaining your work — required every time

After any change, give me a short walkthrough I could repeat out loud in a defense:

- **What** you changed, file by file.
- **Why** it's done that way.
- **What else you considered** and why you didn't pick it.
- **How it breaks** — what would make this fail in production, and how I'd spot and fix
  it. (This is direct chaos-drill prep.)
- **What the tests prove**, and what they deliberately don't cover.

Keep it plain. If explaining it needs jargon, define the jargon. If I ask "why?" about any
line, answer without hedging — and if the honest answer is "convention" or "I'm not sure
it's needed", say that, so we can cut it.

---

## Code style

- Match the existing patterns in the repo. Look before you write.
- Prefer boring, readable code over clever code. I have to explain it in 3 minutes.
- Comments explain **why**, not what. Don't narrate obvious lines.
- No dead code, no commented-out blocks, no placeholder TODOs left behind.
- Never hardcode secrets, keys or tokens. If a feature needs one, stop and tell me — the
  module treats leaked secrets as a serious issue.
- Accessibility counts: semantic HTML, real alt text, keyboard reachable, visible focus.

---

## Conventions I follow (for your reference, not for you to execute)

Branch and commit prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `ci/`.
Commits are conventional, e.g. `feat(blog): add reading time to post metadata`.
Every change goes through a short-lived branch and a reviewed PR into `main`.
Bugs get a regression test — one that fails before the fix and passes after.

When you suggest a commit message or branch name, that's helpful. Just don't run it.

---

## If you're unsure

Ask. A question costs me ten seconds. Unrequested code costs me the defense.

Specifically, stop and ask when:

- the acceptance criteria are ambiguous or seem to contradict each other;
- the work seems to need a new dependency, a secret, or a tool from a later week;
- the fix touches files well outside what the ticket described;
- something in the repo looks wrong but isn't part of this ticket.
