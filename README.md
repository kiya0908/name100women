# Name 100 Women

A server-rendered, no-sign-up game for the “Can you name 100 women?” challenge.

The MVP is intentionally narrow: one playable game, reliable server-side name verification, basic analytics, SEO landing content and the required legal/support pages.

## Stack

- React Router Framework Mode with SSR
- React and TypeScript
- Vite with the Cloudflare Vite Plugin
- Cloudflare Workers
- Cloudflare D1 and KV
- Drizzle ORM / Drizzle Kit
- Zod
- Tailwind CSS
- GA4 and Microsoft Clarity

## Implemented routes

```text
/
/how-it-works
/privacy
/terms
/contact
/sitemap.xml
/robots.txt
/api/game/start
/api/game/guess
/api/game/end
404
```

## Core behavior

- A session is created without starting the timer.
- The first server-accepted person starts the timer.
- The server is authoritative for start, end and duration.
- Each Wikidata QID can score only once per session.
- The 100th accepted QID completes the game automatically.
- Give Up ends the game and returns the final duration.
- Refreshing creates a new session; the old session is marked abandoned by a page lifecycle request when possible.
- Unknown names fall through manual overrides → KV → D1 → Wikipedia → Wikidata.
- External timeouts return `TEMPORARY_ERROR`, not a false rejection.
- The browser never calls Wikipedia or Wikidata directly.

## Local setup

Requirements:

- Node.js 22+
- A Cloudflare account for remote resources

Install packages:

```bash
npm install
```

Copy local variables:

```bash
cp .dev.vars.example .dev.vars
```

Create local D1 tables:

```bash
npm run db:migrate:local
```

Start development:

```bash
npm run dev
```

## Cloudflare resource setup

Create the database and KV namespace:

```bash
npx wrangler d1 create name100women
npx wrangler kv namespace create CACHE
npx wrangler kv namespace create CACHE --preview
```

Replace the zero placeholder IDs in `wrangler.jsonc` with the returned IDs.

Add hashing secrets:

```bash
npx wrangler secret put ANONYMOUS_HASH_SALT
npx wrangler secret put IP_HASH_SALT
```

Set `GA4_ID` and `CLARITY_ID` as Worker variables only after the corresponding properties exist. They are optional; the game works without either script.

Apply the production migration:

```bash
npm run db:migrate:remote
```

## Generate the 500–1,000 person seed

The repository does not commit a large generated SQL file. Generate it from a structured Wikidata query:

```bash
npm run db:seed:generate
```

The command writes `db/seed.sql` and fails if fewer than 500 people are returned.

Import locally or remotely:

```bash
npm run db:seed:local
npm run db:seed:remote
```

The seed contains the canonical English name and English Wikipedia title as aliases. Runtime validation continues to add redirects and submitted public aliases on demand.

## Quality checks

```bash
npm run check
```

This runs:

1. ESLint
2. React Router type generation and TypeScript
3. Vitest
4. Production build

The GitHub Actions workflow also applies the D1 migration to a local temporary database.

## Deployment

After replacing Cloudflare resource IDs and applying the migration:

```bash
npm run deploy
```

The Worker entry is `workers/app.ts`, and static client assets are emitted to `build/client`.

## Privacy boundaries

D1 stores submitted answer text to improve verification accuracy, as disclosed on `/privacy`.

GA4 game events may include progress, status and duration. The analytics helper removes parameter keys containing name, QID, input, person, IP or token terms. No answer text is intentionally sent to GA4.

The browser cookie contains a random anonymous token. D1 stores only its SHA-256 hash. IP-derived values are salted, rotated daily and stored as hashes.

## Manual corrections

Manual corrections are data entries in `validation_overrides`.

- `exact_normalized_input` overrides a specific normalized input.
- `person_qid` overrides a resolved Wikidata entity.
- Decisions are `ACCEPT`, `REJECT` or `AMBIGUOUS`.

Overrides are evaluated before cache and external validation.

## Deliberately excluded from the MVP

- Login, profiles, payments or credits
- Leaderboards and public statistics
- Daily or category modes
- Blog or person detail pages
- LLM-based real-time judging
- Admin UI
- Durable Objects, Queues or R2

See `PRD.md`, `ERD.md` and `AGENTS.md` for the product and implementation constraints.
