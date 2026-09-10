import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { GAMEMODE_DEFINITIONS } from '@api/features/gamemodes/gamemodes.config';
import { createTestApp } from '../utils/app';

describe('GET /gamemodes', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app?.close();
  });

  const get = () => request(app.getHttpServer()).get('/gamemodes');

  it('answers with every configured gamemode in the data envelope', async () => {
    const { body } = await get().expect(200);

    expect(body.data).toHaveLength(GAMEMODE_DEFINITIONS.length);
    expect(
      body.data.map((gamemode: { slug: string }) => gamemode.slug),
    ).toEqual(GAMEMODE_DEFINITIONS.map((gamemode) => gamemode.slug));
  });

  it('marks the mode that has a database behind it as available and default', async () => {
    const { body } = await get().expect(200);

    expect(body.data).toContainEqual({
      slug: 'climb',
      name: 'Climb',
      available: true,
      isDefault: true,
    });
  });

  it('marks a mode without a database as unavailable and not default', async () => {
    const { body } = await get().expect(200);
    const runmode = body.data.find(
      (gamemode: { slug: string }) => gamemode.slug === 'runmode',
    );

    expect(runmode).toEqual({
      slug: 'runmode',
      name: 'Runmode',
      available: false,
      isDefault: false,
    });
  });

  it('keeps the internal data source name out of the response', async () => {
    const { body } = await get().expect(200);

    expect(JSON.stringify(body)).not.toContain('dataSource');
    expect(body.data[0]).not.toHaveProperty('dataSource');
  });

  it('answers 404 for a route that does not exist', async () => {
    await request(app.getHttpServer()).get('/gamemodes/climb').expect(404);
  });
});
