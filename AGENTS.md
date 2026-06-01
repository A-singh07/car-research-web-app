<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: car-research-webapp

A car research web app deployed to a **serverless** target (e.g. Vercel / serverless functions). Everything below is project-specific and lives outside the Next.js-managed block above so it survives doc updates.

## Stack

- **Next.js 16** (App Router) + **React 19**, TypeScript `strict`
- **Tailwind CSS v4** (CSS-first config — no `tailwind.config.js`)
- **Prisma ORM** on **PostgreSQL** (data layer; see note below — not yet installed)
- **pnpm** package manager
- ESLint v9 flat config

## Commands

```bash
pnpm dev          # start dev server (Turbopack)
pnpm build        # production build — run before claiming a feature is done
pnpm start        # serve production build
pnpm lint         # eslint
# Prisma (once installed):
pnpm prisma migrate dev --name <change>   # create + apply a migration in dev
pnpm prisma generate                      # regenerate the client
pnpm prisma studio                        # inspect data
```

Use `pnpm` (not `npm`/`yarn`). Don't run `prisma migrate dev` against production — use `prisma migrate deploy` in deploy pipelines.

## Version-specific gotchas (verify against bundled docs, don't trust memory)

These are the things most likely to differ from training data. When in doubt, read `node_modules/next/dist/docs/01-app/`.

- **`params` and `searchParams` are Promises** — `await` them. `const { id } = await params`.
- **`cookies()`, `headers()`, `draftMode()` are async** — `await` them.
- **`fetch` is NOT cached by default.** Opt in with the `use cache` directive (+ `cacheLife`/`cacheTag`), or wrap uncached work in `<Suspense>` to stream it.
- **Cache Components / `use cache`**: cache at data-level (a fetch helper) or UI-level (a component). `use cache` cannot live directly in a Route Handler body — extract a helper. Use `cacheTag('x')` + `updateTag('x')`/`revalidateTag('x')` to invalidate.
- **Mutations = Server Functions** (`'use server'`). Reachable by direct POST — re-check auth/authorization inside **every** server function, never rely on UI gating.
- **After a mutation**: `refresh()` (from `next/cache`) refreshes the router; `revalidatePath`/`revalidateTag`/`updateTag` invalidate cached data; `redirect()` (from `next/navigation`) throws control-flow — code after it won't run.
- **Route Handlers** live in `route.ts`; type context with the global `RouteContext<'/users/[id]'>` helper. A `route.ts` and `page.tsx` cannot coexist in the same segment.
- **Client data fetching**: pass a promise from a Server Component and resolve it with React's `use()` inside a `<Suspense>`, or use SWR/React Query.

## Serverless data-access rules (important)

Serverless functions are short-lived and can spin up many concurrent instances — naive DB clients exhaust Postgres connections.

- **One Prisma client singleton.** Instantiate Prisma once in `lib/prisma.ts` behind a `globalThis` guard so dev hot-reload and warm lambdas reuse it. Never `new PrismaClient()` per request.
- **Pool connections.** Point Prisma at a pooled connection string (PgBouncer / Prisma Accelerate / Postgres pooler). Keep the direct URL only for migrations (`directUrl` in the datasource).
- **Query only on the server.** Prisma runs in Server Components, Server Functions, and Route Handlers — never import it into a `'use client'` component or leak query logic/credentials to the bundle.
- **Data-access layer.** Put queries in `lib/` or a `data/` layer (e.g. `getCarById`), authorize inside them, and call from server code — don't scatter raw `prisma.*` calls through pages.
- **Prisma needs the Node.js runtime** for most adapters. If a route opts into the Edge runtime, use an edge-compatible driver/adapter (e.g. Prisma + driver adapters) — otherwise keep it on Node.

## Conventions

- **Server Components by default.** Add `'use client'` only when you need state, effects, or browser APIs — and push it to the leaves.
- **TypeScript**: no `any`, respect `strict`. Use generated Prisma types rather than redefining models.
- **Tailwind v4**: configure design tokens via `@theme` in `app/globals.css` (already set up). There is no `tailwind.config.js` — don't create one unless a plugin requires it.
- **Env vars**: secrets server-only; never prefix a secret with `NEXT_PUBLIC_`. Add `DATABASE_URL`/`DIRECT_URL` to `.env`, and document required vars.
- **Path alias**: `@/*` maps to the project root (see `tsconfig.json`).

## Definition of done

A change isn't done until `pnpm lint` and `pnpm build` both pass. State plainly if either fails.
