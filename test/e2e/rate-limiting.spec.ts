import { NestExpressApplication } from '@nestjs/platform-express';
import { seconds } from '@nestjs/throttler';
import request from 'supertest';
import { HEAVY_ENDPOINT_LIMIT } from '@api/shared/throttling/throttling.constants';
import { createTestApp, getDataSource } from '../utils/app';
import { truncateAll } from '../utils/database';

const LIMIT = 5;
const TTL_SECONDS = 60;

// Every route the api serves, so a throttler that stops covering one of them
// shows up here
const EVERY_ROUTE = [
  '/gamemodes',
  '/climb/maps',
  '/climb/maps/1',
  '/climb/maps/by-user/1',
  '/climb/maps/1/positions',
  '/climb/maps/1/stats',
  '/climb/positions',
  '/climb/stats',
  '/climb/users',
  '/climb/users/1',
  '/climb/users/by-username/nobody',
  '/climb/users/1/positions',
  '/climb/users/1/stats',
  '/climb/users/1/activity?type=records',
  '/climb/clans',
  '/climb/clans/1',
  '/climb/clans/1/users',
  '/climb/clans/1/records-history?userIds=1',
  '/climb/countries',
  '/climb/countries/1/users',
];

describe('rate limiting', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp({
      throttlers: [{ ttl: seconds(TTL_SECONDS), limit: LIMIT }],
    });

    await truncateAll(getDataSource(app));
  });

  afterAll(async () => {
    await app?.close();
  });

  const get = (path: string) => request(app.getHttpServer()).get(path);
  // a fresh address per test, so one test's requests never count against another
  const asClient = (path: string, client: string) =>
    get(path).set('X-Forwarded-For', client);

  it('lets a client through while it stays under the limit', async () => {
    for (let sent = 1; sent <= LIMIT; sent++) {
      const response = await asClient('/climb/users', '10.0.0.1').expect(200);

      expect(response.headers['x-ratelimit-limit']).toBe(String(LIMIT));
      expect(response.headers['x-ratelimit-remaining']).toBe(
        String(LIMIT - sent),
      );
    }
  });

  it('answers 429 once a client goes over the limit', async () => {
    for (let sent = 0; sent < LIMIT; sent++) {
      await asClient('/climb/users', '10.0.0.2').expect(200);
    }

    const response = await asClient('/climb/users', '10.0.0.2').expect(429);

    expect(response.body).toMatchObject({ statusCode: 429 });
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('counts each client separately', async () => {
    for (let sent = 0; sent < LIMIT; sent++) {
      await asClient('/climb/users', '10.0.0.3').expect(200);
    }

    await asClient('/climb/users', '10.0.0.3').expect(429);
    await asClient('/climb/users', '10.0.0.4').expect(200);
  });

  it('counts each endpoint separately, so one page load cannot exhaust another', async () => {
    for (let sent = 0; sent < LIMIT; sent++) {
      await asClient('/climb/users', '10.0.0.5').expect(200);
    }

    await asClient('/climb/users', '10.0.0.5').expect(429);
    await asClient('/climb/maps', '10.0.0.5').expect(200);
  });

  it('holds the heavier listings to their own stricter limit', async () => {
    const { headers } = await asClient('/climb/positions', '10.0.0.6').expect(
      200,
    );

    expect(headers['x-ratelimit-limit']).toBe(String(HEAVY_ENDPOINT_LIMIT));
  });

  it('reads the client address from the last forwarded entry', async () => {
    // whatever a client prepends, the entry the proxy appended is the one that
    // counts, so a forged header cannot hand it a fresh bucket
    for (let sent = 0; sent < LIMIT; sent++) {
      await asClient('/climb/users', '203.0.113.9').expect(200);
    }

    await get('/climb/users')
      .set('X-Forwarded-For', '198.51.100.1, 203.0.113.9')
      .expect(429);
  });

  it.each(EVERY_ROUTE)('keeps %s behind the limiter', async (route) => {
    const { headers } = await get(route).set('X-Forwarded-For', '10.1.0.1');

    expect(headers['x-ratelimit-limit']).toBeDefined();
  });
});
