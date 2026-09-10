# Soldank++ Webstats

Backend for [Soldank++](https://github.com/soldank-plus-plus/soldank-plus-plus) website built with NestJS and TypeScript with Postgres database via TypeORM.
The frontend architecture can be found [here](https://github.com/soldank-plus-plus/spp-website).

## Environment Variables

Configuration is read from a `.env` file at the project root. `.env.example` is provided as a template with sensible local-dev defaults — copy it to get started:

```bash
cp .env.example .env
```

Variables:

- `NODE_ENV` - application environment (e.g. `development`, `production`)
- `DB_HOST` - Postgres host
- `DB_PORT` - Postgres port
- `DB_USER` - Postgres user, used by TypeORM and by `docker-compose.yml`
- `DB_PASSWORD` - Postgres password, used by TypeORM and by `docker-compose.yml`
- `DB_DATABASE` - Postgres database name, used by TypeORM and by `docker-compose.yml`
- `DB_LOCAL_ROOT_PASSWORD` - root/superuser password for the local dockerized Postgres instance
- `THROTTLER_TTL_SECONDS` - length of the rate limiting window in seconds, defaults to `60`
- `THROTTLER_LIMIT` - requests allowed within that window, defaults to `120` in production and `300` in development

## Dependencies

The project uses the following packages:

- [NestJS](https://nestjs.com/): Framework that handles HTTP connections, routing and dependency injection
- [TypeORM](https://typeorm.io/): ORM used to talk to Postgres and manage schema migrations
- [nestjs-paginate](https://github.com/ppetzold/nestjs-paginate): Pagination, sorting and filtering for the list endpoints
- [class-validator](https://github.com/typestack/class-validator) / [class-transformer](https://github.com/typestack/class-transformer): Request validation and response serialization (only fields marked `@Expose()` are returned)
- [Joi](https://joi.dev/): Validates environment variables on startup
- [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction): Generates the OpenAPI spec and the docs served at `/api` in development
- [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting): Rate limits every endpoint through a globally registered guard

## Rate limiting

Every endpoint is rate limited by a global `ThrottlerGuard`, registered as an `APP_GUARD` in `app.module.ts` and configured from `THROTTLER_TTL_SECONDS` and `THROTTLER_LIMIT`. No endpoint is exempt.

Counting is per client and per endpoint: each IP gets its own budget on each route, so a page that loads several different endpoints at once never spends one shared allowance. The two cross-entity listings, `GET /climb/positions` and `GET /climb/stats`, join both `map` and `user` and expose the whole dataset a page at a time, so they run on the stricter limit in `src/shared/throttling/throttling.constants.ts`.

Once a client is over its limit the API answers `429 Too Many Requests` and sets `Retry-After` to the seconds left in the window. Every other response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`, so a client can back off before being blocked.

Things to keep in mind when deploying:

- Clients are told apart by `req.ip`, which express derives from `X-Forwarded-For` according to the `trust proxy` hop count set in `main.ts`. It is `1`, matching a single reverse proxy in front of the app. Set it to the real number of proxies: too high a value lets a client forge the header, hand itself a fresh address and walk past the limiter, while too low a value collapses every visitor onto the proxy address and throttles the whole site as one client.
- The counters live in memory, so each instance limits on its own. Running several instances behind a load balancer multiplies the effective limit by the instance count. A shared store (`ThrottlerModule`'s `storage` option, for example the Redis one) is the next step there, and swapping it in touches only the module configuration.
- A client on IPv6 can rotate through the addresses of its prefix, and visitors behind one NAT share a single address. The limiter is a layer of protection, not a replacement for the rate limiting, CDN or WAF in front of the app.

## Setup

### Building
Make sure you have [Node.js](https://nodejs.org/en) v20 (or higher) and clone this repository:

```bash
git clone https://github.com/soldank-plus-plus/spp-webstats
cd spp-website
```

Then install the dependencies:

```bash
npm install
```

### Database
This project uses PostgreSQL via TypeORM. Set up the required environment variables as described above, then start a local Postgres instance with Docker Compose:

```bash
docker compose up -d
```

To stop it:

```bash
docker compose down

# also remove the postgres_data volume
docker compose down -v
```

### Migrations
Migrations live in `src/database/migrations/` and are driven by `src/database/data-source.ts`. The `migrations` table in Postgres tracks which ones have run.

Generate a migration from the diff between the entities and the current database schema (the DB from `docker compose up -d` must be running):

```bash
npm run migration:generate --name=<MigrationName>
```

Apply pending migrations:

```bash
npm run migration:run
```

Revert the last applied migration:

```bash
npm run migration:revert
```

Drop everything in the database and reapply all migrations from a clean state:

```bash
npm run migration:reload
```

### Fixtures
Populate the database with a small set of real sample `users`, `maps`,
`map_creators`, `positions`, and `stats` for local development (migrations must
already be applied):

```bash
npm run fixtures
```

This is insert-only, not idempotent: running it again against a database
that already has this data fails with a constraint error rather than
overwriting anything.

### Running
```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Development

### Testing
```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

### Type checking and linting
Both run automatically before every `git push` (via husky's `pre-push` hook), so you don't need to run them manually.