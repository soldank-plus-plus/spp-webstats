# AGENTS.md

This file provides guidance to AI tools like Claude Code or Codex when working with code in this repository.

## Project

NestJS REST API for Soldat++ webstats: game statistics for players, maps, capture/medal events and time-attack records. PostgreSQL via TypeORM. Currently read-only (`GET /events`, `GET /maps`, `GET /maps/:id`), consumed by a separate frontend (spp-website).

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

Migrations live in `src/migrations/`, driven by `src/data-source.ts`; see `npm run migration:generate/run/revert/reload` in package.json. `npm run fixtures` seeds sample dev data (insert-only, not idempotent).

## Tests

Jest is configured (`npm run test`, `npm run test:e2e`, `npm run test:cov`), but no test files exist yet.

## Architecture

Feature-module pattern, one folder per resource under `src/` (e.g. `src/events/`, `src/maps/`):
- `<name>.entity.ts`: TypeORM entity, camelCase properties mapped to snake_case columns via `name:`.
- `<name>.controller.ts` / `<name>.service.ts` / `<name>.module.ts`: standard Nest controller/service/module.
- `dto/response.dto.ts`: class-transformer DTO; only fields marked `@Expose()` are serialized out.
- `<name>.pagination.ts`: `nestjs-paginate` `PaginateConfig` (sortable/filterable columns, relations, limits).

Global wiring lives in `main.ts`: `ValidationPipe` (whitelist, forbid unknown/non-whitelisted fields), `ErrorMessageInterceptor` (flattens class-validator's array of messages into one string), `SerializeInterceptor` (strips any field not marked `@Expose()` on the handler's DTO, driven by the `@Serialize`/`@SerializePaginate` decorators in `src/serialize.ts`).

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
