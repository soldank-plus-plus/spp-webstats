import request from 'supertest';
import { setupTestContext } from '../utils/context';
import { createMap, createStat, createUser } from '../factories';

// Values that would break out of a string if anything built sql by hand
const INJECTION_VECTORS = [
  "' OR 1=1--",
  "'; DROP TABLE users; --",
  "1' UNION SELECT null, version() --",
  '\\',
  '%00',
];

describe('security', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  describe('input that tries to reach the database', () => {
    it.each(INJECTION_VECTORS)(
      'answers safely when the search is %p',
      async (value) => {
        await createUser(context.dataSource, { username: 'real' });

        const { body } = await get(
          `/climb/users?search=${encodeURIComponent(value)}`,
        ).expect(200);

        expect(body.data).toEqual([]);
      },
    );

    it.each(INJECTION_VECTORS)(
      'answers safely when a username lookup is %p',
      async (value) => {
        await createUser(context.dataSource, { username: 'real' });

        await get(
          `/climb/users/by-username/${encodeURIComponent(value)}`,
        ).expect(404);
      },
    );

    it.each(INJECTION_VECTORS)(
      'answers safely when the creator filter is %p',
      async (value) => {
        const map = await createMap(context.dataSource);
        const author = await createUser(context.dataSource, {
          username: 'author',
        });

        await context.dataSource.query(
          'INSERT INTO map_creators (map_id, user_id) VALUES ($1, $2)',
          [map.id, author.id],
        );

        const { body } = await get(
          `/climb/maps?creator=${encodeURIComponent(value)}`,
        ).expect(200);

        expect(body.data).toEqual([]);
      },
    );

    it('leaves the tables in place after an injection attempt', async () => {
      await createUser(context.dataSource, { username: 'survivor' });

      await get(
        `/climb/users?search=${encodeURIComponent("'; DROP TABLE users; --")}`,
      ).expect(200);

      const { body } = await get('/climb/users').expect(200);

      expect(body.data).toHaveLength(1);
    });

    it('rejects a sort that names something other than a sortable column', async () => {
      await createUser(context.dataSource);

      const { body } = await get(
        `/climb/users?sortBy=${encodeURIComponent('(SELECT 1):ASC')}`,
      ).expect(200);

      expect(body.meta.sortBy).toEqual([['id', 'ASC']]);
    });

    it('does not fail on a very long query value', async () => {
      await createUser(context.dataSource);

      const { body } = await get(
        `/climb/users?search=${'a'.repeat(5000)}`,
      ).expect(200);

      expect(body.data).toEqual([]);
    });

    it('does not fail on a very long path segment', async () => {
      await get(`/climb/users/by-username/${'a'.repeat(5000)}`).expect(404);
    });
  });

  describe('what the api accepts', () => {
    it('ignores a query property a paginated listing does not know', async () => {
      await createUser(context.dataSource);

      const { body } = await get('/climb/users?admin=true&role=root').expect(
        200,
      );

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).not.toHaveProperty('admin');
      expect(body.data[0]).not.toHaveProperty('role');
    });

    it('rejects a query property a validated route does not know', async () => {
      const user = await createUser(context.dataSource);

      await get(
        `/climb/users/${user.id}/activity?type=records&isAdmin=true`,
      ).expect(400);
    });

    it('refuses to write through a read only api', async () => {
      const server = context.app.getHttpServer();

      await request(server)
        .post('/climb/users')
        .send({ username: 'x' })
        .expect(404);
      await request(server)
        .put('/climb/users/1')
        .send({ gold: 999 })
        .expect(404);
      await request(server)
        .patch('/climb/users/1')
        .send({ gold: 999 })
        .expect(404);
      await request(server).delete('/climb/users/1').expect(404);
    });

    it('does not let a body change what a listing returns', async () => {
      await createUser(context.dataSource, { username: 'real', gold: 0 });

      const { body } = await request(context.app.getHttpServer())
        .get('/climb/users')
        .send({ gold: 999 })
        .expect(200);

      expect(body.data[0].gold).toBe(0);
    });
  });

  describe('what the api sends back', () => {
    it('sets the security headers helmet is configured with', async () => {
      const { headers } = await get('/climb/users').expect(200);

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['content-security-policy']).toContain(
        "default-src 'none'",
      );
      expect(headers['referrer-policy']).toBe('no-referrer');
    });

    it('does not advertise the framework it runs on', async () => {
      const { headers } = await get('/climb/users').expect(200);

      expect(headers).not.toHaveProperty('x-powered-by');
    });

    it('tells the client how much of its rate limit is left', async () => {
      const { headers } = await get('/climb/users').expect(200);

      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('never sends a column that no dto exposes', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id });

      const listing = await get('/climb/users').expect(200);
      const detail = await get(`/climb/users/${user.id}`).expect(200);

      for (const body of [listing.body, detail.body]) {
        const serialized = JSON.stringify(body);

        expect(serialized).not.toContain('noMedalCount');
        expect(serialized).not.toContain('"stats"');
        expect(serialized).not.toContain('"positions"');
        expect(serialized).not.toContain('createdMaps');
        expect(serialized).not.toContain('createdClans');
      }
    });
  });
});
