import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { setupTestContext } from '../utils/context';
import { createMap, createStat, createUser } from '../factories';

// Anything that would tell a caller how the server is built, what it runs on or
// what it holds. A client side filter can only ever be a second line of defence,
// so nothing on this list may appear in an error body
const INTERNALS = [
  'SELECT',
  'INSERT',
  'FROM "',
  'WHERE',
  'QueryFailedError',
  'node_modules',
  '.ts:',
  '\n    at ',
  'unique_caps',
  'clan_creators',
  'pg_',
  'ECONNREFUSED',
  '5433',
];

// what the api is allowed to put in an error body, and nothing else
const ERROR_FIELDS = ['statusCode', 'message', 'error'];

const secrets = () =>
  [
    process.env.DB_PASSWORD,
    process.env.DB_USER,
    process.env.DB_HOST,
    process.env.DB_DATABASE,
  ].filter((secret): secret is string => Boolean(secret));

const expectNoLeak = (status: number, body: unknown) => {
  const serialized = JSON.stringify(body);

  expect(status).toBeGreaterThanOrEqual(400);

  for (const internal of INTERNALS) {
    expect(serialized).not.toContain(internal);
  }

  for (const secret of secrets()) {
    expect(serialized).not.toContain(secret);
  }

  expect(
    Object.keys(body as object).filter(
      (field) => !ERROR_FIELDS.includes(field),
    ),
  ).toEqual([]);
};

describe('what an error tells the caller', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  const seed = async () => {
    const user = await createUser(context.dataSource, { username: 'someone' });
    const map = await createMap(context.dataSource);

    await createStat(context.dataSource, { userId: user.id, mapId: map.id });
  };

  // every way a request can fail today, so a new sink has to be added here
  // rather than slipping out unnoticed
  const failingRequests = [
    ['a path id that is not a number', '/climb/maps/abc'],
    ['a resource that does not exist', '/climb/users/999'],
    ['a nested parent that does not exist', '/climb/maps/999/stats'],
    ['a route that does not exist', '/nothing/here'],
    ['a filter value of the wrong type', '/climb/maps?filter.hardest=abc'],
    [
      'a filter value out of range',
      '/climb/maps?filter.hardest=99999999999999',
    ],
    [
      'a number that overflows the column',
      '/climb/stats?filter.userId=99999999999999',
    ],
    ['a missing required query parameter', '/climb/users/1/activity'],
    ['an unknown query property', '/climb/users/1/activity?type=records&x=1'],
    ['an unparsable list', '/climb/clans/1/records-history?userIds=abc'],
  ] as const;

  it.each(failingRequests)('keeps internals out of %s', async (_, path) => {
    await seed();

    const { status, body } = await get(path);

    expectNoLeak(status, body);
  });

  it('answers a failed query with nothing but a generic server error', async () => {
    const { status, body } = await get(
      '/climb/maps?filter.hardest=99999999999999',
    );

    expect(status).toBe(500);
    expect(body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
  });

  // the closest thing to a broken database that a test can arrange, and the
  // driver message for it names the table
  it('never repeats a driver message, even when a table is gone', async () => {
    await seed();

    await context.dataSource.query(
      'ALTER TABLE positions RENAME TO positions_hidden',
    );

    try {
      const { status, body } = await get('/climb/positions');

      expect(status).toBe(500);
      expect(body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
      });
      expect(JSON.stringify(body)).not.toContain('positions');
    } finally {
      await context.dataSource.query(
        'ALTER TABLE positions_hidden RENAME TO positions',
      );
    }
  });

  // the only error message that carries anything the caller sent: nest names the
  // route that did not match. It says nothing about the server, and it comes
  // back as a json string under a content type no browser will run
  it('echoes nothing but the route in the message for an unknown path', async () => {
    const { body, headers } = await get('/nothing/here').expect(404);

    expect(body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Cannot GET /nothing/here',
    });
    expect(headers['content-type']).toContain('application/json');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  it('does not hand a stack trace to the caller', async () => {
    const { text } = await get('/climb/maps?filter.hardest=99999999999999');

    expect(text).not.toContain('at ');
    expect(text).not.toContain('Error:');
  });

  it('answers json even when the caller asks for html', async () => {
    const app: NestExpressApplication = context.app;
    const { headers } = await request(app.getHttpServer())
      .get('/climb/users/999')
      .set('Accept', 'text/html');

    expect(headers['content-type']).toContain('application/json');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  // the query string comes back in the pagination meta and links, so it is a
  // reflection sink even on a successful response. It stays a json string that
  // no browser will run, and the headers keep it from being read as anything else
  it('reflects a query string as inert json', async () => {
    const payload = '<script>alert(1)</script>';
    const { headers, body } = await get(
      `/climb/users?search=${encodeURIComponent(payload)}`,
    ).expect(200);

    expect(body.meta.search).toBe(payload);
    expect(headers['content-type']).toContain('application/json');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['content-security-policy']).toContain("default-src 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
  });
});
