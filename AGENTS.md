# AGENTS.md

This file provides guidance to AI tools like Claude Code or Codex when working with code in this repository.

## Project

NestJS REST API for Soldat++ webstats: game statistics for players, maps, capture/medal positions and time-attack records. PostgreSQL via TypeORM. Currently read-only (`GET /positions`, `GET /maps`, `GET /maps/:id`), consumed by a separate frontend (spp-website).

## Build

Requires Node.js and a local Postgres (via `docker-compose.yml`).

```
npm install
cp .env.example .env
docker-compose up -d
npm run migration:run
npm run start:dev
```

Swagger docs are served at `/api` when `NODE_ENV=development`. Path alias `@api/*` resolves to `src/*`.

Migrations live in `src/database/migrations/`, driven by `src/database/data-source.ts`; see `npm run migration:generate/run/revert/reload` in package.json. `npm run fixtures` seeds sample dev data from `src/database/fixtures/seed.ts` (insert-only, not idempotent): countries, clans with founders, users, maps with creators, positions, and records spread over several years so the clan and profile charts have something to draw. Use it for local runs and manual testing rather than importing a dump of the legacy dataset.

## Tests

Two Jest projects, both defined in `jest.config.js`:
- `unit`: `*.spec.ts` next to the code under `src/`, no database. `npm run test`.
- `e2e`: everything under `test/`, against the throwaway Postgres from `docker-compose.test.yml` (`npm run test:db:up`, settings in `.env.test`). `test/integration/` drives services and entities, `test/e2e/` drives the HTTP API through `configureApp`. `npm run test:e2e`, or `npm run test:integration` for the integration half.

`npm run test:cov` runs both and enforces the coverage floor. The schema is built from the migrations in `test/global-setup.ts`, every table is truncated before each test by `setupTestContext` in `test/utils/context.ts`, and rows are built with the factories in `test/factories/`. Anything destructive refuses to run unless `DB_DATABASE` ends with `_test`.

## Architecture

Feature-module pattern, one folder per resource under `src/features/` (e.g. `src/features/positions/`, `src/features/maps/`):
- `<name>.entity.ts`: TypeORM entity, camelCase properties mapped to snake_case columns via `name:`.
- `<name>.controller.ts` / `<name>.service.ts` / `<name>.module.ts`: standard Nest controller/service/module.
- `dto/response.dto.ts`: class-transformer DTO; only fields marked `@Expose()` are serialized out.
- `<name>.pagination.ts`: `nestjs-paginate` `PaginateConfig` (sortable/filterable columns, relations, limits).

Global wiring lives in `src/app.setup.ts` (`configureApp`, called from `main.ts` and by the e2e suites): `ValidationPipe` (whitelist, forbid unknown/non-whitelisted fields), `ErrorMessageInterceptor` (flattens class-validator's array of messages into one string), `SerializeInterceptor` (strips any field not marked `@Expose()` on the handler's DTO, driven by the `@Serialize`/`@SerializePaginate` decorators in `src/shared/serialization/serialize.ts`).

Rate limiting is global: `app.module.ts` registers `@nestjs/throttler`'s `ThrottlerGuard` as an `APP_GUARD` and configures it from `THROTTLER_TTL_SECONDS` / `THROTTLER_LIMIT`, so every route is limited per client IP without a decorator. Heavier routes tighten that with `@Throttle()` and the limit in `src/shared/throttling/throttling.constants.ts`. Client addresses come from `req.ip`, which depends on the `trust proxy` hop count set in `main.ts`.

Config is loaded and validated via `@nestjs/config` + Joi in `src/config/env.ts`. DB connection is `TypeOrmModule.forRootAsync`; `synchronize` is only true when `NODE_ENV=development`, so real schema changes go through migrations.

## Code style

Comments should be short and only where they add real value:
- Delete comments that just restate what the code obviously does.
- No section-divider comments (e.g. `// --- section ---`).
- No meta-commentary about the coding process ("Note: I decided to...").
- Don't reference other files, languages, or implementations that might not exist in this repo. Keep comments self-contained.
- A single-sentence comment should not end with a trailing period. Only use periods when a comment has multiple distinct sentences.
- Do keep short explanations of genuinely non-obvious behavior or the root cause of a workaround.

Never use em-dashes (—) or a hyphen as sentence punctuation (word - word), anywhere: code, comments, docs, commit messages. Use a comma, period, colon, or parentheses instead. Hyphens inside compound words and identifiers (`well-known`, `single-sentence`, `spp-webstats`) are fine.

Git commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`), short and in imperative mood. No `Co-Authored-By` trailer.
