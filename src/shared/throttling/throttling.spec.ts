import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';

// short enough to watch a window expire without slowing the suite down, long
// enough that a slow machine cannot expire it while a test is still filling it
const TTL = 1000;
const LIMIT = 4;
const STRICTER_LIMIT = 2;

@Controller('records')
class RecordsController {
  @Get()
  findAll(): string {
    return 'ok';
  }

  @Get('heavy')
  @Throttle({ default: { limit: STRICTER_LIMIT } })
  findHeavy(): string {
    return 'ok';
  }
}

// the wiring app.module.ts uses, with a window short enough to test
const createApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [ThrottlerModule.forRoot([{ ttl: TTL, limit: LIMIT }])],
    controllers: [RecordsController],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  }).compile();

  const app = moduleRef.createNestApplication();

  await app.init();

  return app;
};

describe('rate limiting', () => {
  let app: INestApplication;

  const get = (path: string) => request(app.getHttpServer()).get(path);

  // a fresh app per case, so one test's requests never count against another's
  beforeEach(async () => {
    app = await createApp();
  });
  afterEach(() => app.close());

  it('answers every request made under the limit', async () => {
    for (let sent = 1; sent <= LIMIT; sent++) {
      const response = await get('/records').expect(200);

      expect(response.headers['x-ratelimit-remaining']).toBe(
        String(LIMIT - sent),
      );
    }
  });

  it('answers 429 once the limit is exceeded', async () => {
    for (let sent = 0; sent < LIMIT; sent++) {
      await get('/records').expect(200);
    }

    const response = await get('/records').expect(429);

    expect(response.headers['retry-after']).toBeDefined();
  });

  it('lets the client through again once the window has passed', async () => {
    for (let sent = 0; sent < LIMIT; sent++) {
      await get('/records').expect(200);
    }

    await get('/records').expect(429);
    await new Promise((resolve) => setTimeout(resolve, TTL + 200));

    await get('/records').expect(200);
  });

  it('holds a route with its own limit to that stricter count', async () => {
    for (let sent = 0; sent < STRICTER_LIMIT; sent++) {
      await get('/records/heavy').expect(200);
    }

    await get('/records/heavy').expect(429);

    // the stricter route has its own counter, the rest of the api is untouched
    await get('/records').expect(200);
  });
});
