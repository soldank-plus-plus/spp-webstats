import request from 'supertest';
import { setupTestContext } from '../utils/context';

// the origins .env.test allows
const ALLOWED = 'https://soldankpp.app';
const ALSO_ALLOWED = 'http://localhost:5173';
const STRANGER = 'https://soldankpp.app.evil.example';

describe('cors', () => {
  const context = setupTestContext();
  const get = (path = '/gamemodes') =>
    request(context.app.getHttpServer()).get(path);
  const preflight = (path = '/gamemodes') =>
    request(context.app.getHttpServer()).options(path);

  describe('a browser on an allowed site', () => {
    it.each([ALLOWED, ALSO_ALLOWED])(
      'lets %s read a response',
      async (origin) => {
        const { headers } = await get().set('Origin', origin).expect(200);

        expect(headers['access-control-allow-origin']).toBe(origin);
      },
    );

    it('answers a preflight with the methods a read only api serves', async () => {
      const { headers } = await preflight()
        .set('Origin', ALLOWED)
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(headers['access-control-allow-origin']).toBe(ALLOWED);
      expect(headers['access-control-allow-methods']).toBe('GET,HEAD,OPTIONS');
    });

    it('does not offer a method that would write', async () => {
      const { headers } = await preflight()
        .set('Origin', ALLOWED)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(headers['access-control-allow-methods']).not.toContain('POST');
      expect(headers['access-control-allow-methods']).not.toContain('DELETE');
    });

    it('never invites the browser to send credentials', async () => {
      const { headers } = await get().set('Origin', ALLOWED).expect(200);

      expect(headers).not.toHaveProperty('access-control-allow-credentials');
    });

    it('marks the response as varying by origin, so a cache cannot mix them up', async () => {
      const { headers } = await get().set('Origin', ALLOWED).expect(200);

      expect(headers.vary).toContain('Origin');
    });
  });

  describe('a browser on any other site', () => {
    it.each([STRANGER, 'http://soldankpp.app', 'https://evil.example'])(
      'gives %s nothing to read the response with',
      async (origin) => {
        const { headers } = await get().set('Origin', origin).expect(200);

        expect(headers['access-control-allow-origin']).toBeUndefined();
      },
    );

    it('turns a preflight down as well', async () => {
      const { headers } = await preflight()
        .set('Origin', STRANGER)
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(headers['access-control-allow-origin']).toBeUndefined();
    });

    // cors decides what a browser may read, it never blocks the request
    it('still answers the request itself', async () => {
      const { body } = await get('/climb/users')
        .set('Origin', STRANGER)
        .expect(200);

      expect(body.data).toEqual([]);
    });
  });

  it('answers a caller that sends no origin at all', async () => {
    const { headers } = await get().expect(200);

    expect(headers['access-control-allow-origin']).toBeUndefined();
  });

  it('guards every route, not just one', async () => {
    for (const path of ['/gamemodes', '/climb/maps', '/climb/users']) {
      const allowed = await get(path).set('Origin', ALLOWED).expect(200);
      const stranger = await get(path).set('Origin', STRANGER).expect(200);

      expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED);
      expect(stranger.headers['access-control-allow-origin']).toBeUndefined();
    }
  });
});
