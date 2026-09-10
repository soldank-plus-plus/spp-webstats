import request from 'supertest';
import { setupTestContext } from '../utils/context';
import {
  createClan,
  createMap,
  createPosition,
  createStat,
  createUser,
} from '../factories';

const DAY = (year: number, month: number, day: number) =>
  Date.UTC(year, month - 1, day, 12);

describe('climb/users', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  describe('GET /climb/users', () => {
    it('answers an empty page when there are no users', async () => {
      const { body } = await get('/climb/users').expect(200);

      expect(body.data).toEqual([]);
      expect(body.meta.totalItems).toBe(0);
    });

    it('returns the users with the share of maps they captured', async () => {
      await createMap(context.dataSource);
      await createMap(context.dataSource);
      await createUser(context.dataSource, {
        username: 'climber',
        uniqueCaps: 1,
        gold: 3,
      });

      const { body } = await get('/climb/users').expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        username: 'climber',
        uniqueCaps: 1,
        gold: 3,
        passed: 50,
      });
    });

    it('keeps the relations of a user out of the response', async () => {
      const clan = await createClan(context.dataSource);
      const user = await createUser(context.dataSource, { clanId: clan.id });

      await createStat(context.dataSource, { userId: user.id });

      const { body } = await get('/climb/users').expect(200);

      expect(body.data[0]).not.toHaveProperty('stats');
      expect(body.data[0]).not.toHaveProperty('positions');
      expect(body.data[0]).not.toHaveProperty('clan');
      expect(body.data[0]).not.toHaveProperty('createdMaps');
    });

    it('searches users by username', async () => {
      await createUser(context.dataSource, { username: 'wanted' });
      await createUser(context.dataSource, { username: 'other' });

      const { body } = await get('/climb/users?search=want').expect(200);

      expect(
        body.data.map((user: { username: string }) => user.username),
      ).toEqual(['wanted']);
    });

    it('sorts users by captures when asked to', async () => {
      await createUser(context.dataSource, { username: 'weak', uniqueCaps: 1 });
      await createUser(context.dataSource, {
        username: 'strong',
        uniqueCaps: 50,
      });

      const { body } = await get('/climb/users?sortBy=uniqueCaps:DESC').expect(
        200,
      );

      expect(
        body.data.map((user: { username: string }) => user.username),
      ).toEqual(['strong', 'weak']);
    });
  });

  describe('GET /climb/users/:id', () => {
    it('returns the user with their placement, maps left and clan', async () => {
      await createMap(context.dataSource);
      await createMap(context.dataSource);

      const clan = await createClan(context.dataSource, {
        clanname: 'Legends',
        tag: 'LGD',
      });
      const user = await createUser(context.dataSource, {
        username: 'star',
        clanId: clan.id,
        uniqueCaps: 1,
      });

      const { body } = await get(`/climb/users/${user.id}`).expect(200);

      expect(body.data).toMatchObject({
        id: user.id,
        username: 'star',
        mapsLeft: 1,
        passed: 50,
        placement: { records: 1, hardest: 1, golds: 1 },
        clan: { id: clan.id, clanname: 'Legends', tag: 'LGD' },
      });
    });

    it('exposes only the id, name and tag of the clan', async () => {
      const clan = await createClan(context.dataSource, { uniqueCaps: 99 });
      const user = await createUser(context.dataSource, { clanId: clan.id });

      const { body } = await get(`/climb/users/${user.id}`).expect(200);

      expect(Object.keys(body.data.clan).sort()).toEqual([
        'clanname',
        'id',
        'tag',
      ]);
    });

    it('reports no clan for a user who belongs to none', async () => {
      const user = await createUser(context.dataSource);

      const { body } = await get(`/climb/users/${user.id}`).expect(200);

      expect(body.data.clan).toBeNull();
    });

    it('answers 404 for a user that does not exist', async () => {
      const { body } = await get('/climb/users/999').expect(404);

      expect(body).toMatchObject({
        statusCode: 404,
        message: 'User not found',
      });
    });

    it('answers 400 for an id that is not a number', async () => {
      await get('/climb/users/abc').expect(400);
    });
  });

  describe('GET /climb/users/by-username/:username', () => {
    it('returns the user behind the exact username', async () => {
      const user = await createUser(context.dataSource, { username: 'Sniper' });

      const { body } = await get('/climb/users/by-username/Sniper').expect(200);

      expect(body.data).toMatchObject({ id: user.id, username: 'Sniper' });
    });

    it('answers 404 when the case does not match', async () => {
      await createUser(context.dataSource, { username: 'Sniper' });

      await get('/climb/users/by-username/sniper').expect(404);
    });

    it('answers 404 for a username nobody uses', async () => {
      const { body } = await get('/climb/users/by-username/ghost').expect(404);

      expect(body.message).toBe('User not found');
    });

    it('handles a username that needs url encoding', async () => {
      await createUser(context.dataSource, { username: 'a b/c' });

      const { body } = await get(
        `/climb/users/by-username/${encodeURIComponent('a b/c')}`,
      ).expect(200);

      expect(body.data.username).toBe('a b/c');
    });
  });

  describe('GET /climb/users/:userId/positions and /stats', () => {
    it('returns the positions taken by that user', async () => {
      const user = await createUser(context.dataSource, { username: 'capper' });
      const other = await createUser(context.dataSource);
      const map = await createMap(context.dataSource, { mapname: 'climb_a' });

      await createPosition(context.dataSource, {
        userId: user.id,
        mapId: map.id,
      });
      await createPosition(context.dataSource, { userId: other.id });

      const { body } = await get(`/climb/users/${user.id}/positions`).expect(
        200,
      );

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        userId: user.id,
        username: 'capper',
        mapname: 'climb_a',
      });
    });

    it('returns the records set by that user', async () => {
      const user = await createUser(context.dataSource);
      const other = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id });
      await createStat(context.dataSource, { userId: other.id });

      const { body } = await get(`/climb/users/${user.id}/stats`).expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].userId).toBe(user.id);
    });

    it.each(['positions', 'stats'])(
      'answers 404 on /%s for a user that does not exist',
      async (nested) => {
        const { body } = await get(`/climb/users/999/${nested}`).expect(404);

        expect(body.message).toBe('User not found');
      },
    );

    it('answers an empty page for a user with no records', async () => {
      const user = await createUser(context.dataSource);

      const { body } = await get(`/climb/users/${user.id}/stats`).expect(200);

      expect(body.data).toEqual([]);
    });
  });

  describe('GET /climb/users/:id/activity', () => {
    it('counts the records of the chosen year day by day', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2024, 3, 15),
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2024, 3, 15),
      });

      const { body } = await get(
        `/climb/users/${user.id}/activity?type=records&year=2024`,
      ).expect(200);

      expect(body.data).toEqual({
        year: 2024,
        years: [2024],
        days: [{ day: '2024-03-15', count: 2 }],
      });
    });

    it('counts only the golds when asked for them', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2024, 3, 15),
        position: 1,
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2024, 3, 15),
        position: 2,
      });

      const { body } = await get(
        `/climb/users/${user.id}/activity?type=golds&year=2024`,
      ).expect(200);

      expect(body.data.days).toEqual([{ day: '2024-03-15', count: 1 }]);
    });

    it('falls back to the latest year the user was active', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2021, 1, 1),
      });

      const { body } = await get(
        `/climb/users/${user.id}/activity?type=records`,
      ).expect(200);

      expect(body.data.year).toBe(2021);
    });

    it('answers 404 for a user that does not exist', async () => {
      const { body } = await get(
        '/climb/users/999/activity?type=records',
      ).expect(404);

      expect(body.message).toBe('User not found');
    });

    it('answers an empty activity for a user who set no records', async () => {
      const user = await createUser(context.dataSource);

      const { body } = await get(
        `/climb/users/${user.id}/activity?type=records`,
      ).expect(200);

      expect(body.data.years).toEqual([]);
      expect(body.data.days).toEqual([]);
    });

    it('answers 400 when the type is missing', async () => {
      const user = await createUser(context.dataSource);

      const { body } = await get(`/climb/users/${user.id}/activity`).expect(
        400,
      );

      expect(body.message).toContain(
        'type must be one of the following values',
      );
    });

    it('answers 400 for a type that is not one of the known ones', async () => {
      const user = await createUser(context.dataSource);

      await get(`/climb/users/${user.id}/activity?type=bogus`).expect(400);
    });

    it.each(['abc', '0', '-1', '2024.5', ''])(
      'answers 400 for year=%p',
      async (year) => {
        const user = await createUser(context.dataSource);

        await get(
          `/climb/users/${user.id}/activity?type=records&year=${year}`,
        ).expect(400);
      },
    );

    it('answers 400 for a query property it does not know', async () => {
      const user = await createUser(context.dataSource);

      const { body } = await get(
        `/climb/users/${user.id}/activity?type=records&month=3`,
      ).expect(400);

      expect(body.message).toBe('property month should not exist');
    });
  });
});
