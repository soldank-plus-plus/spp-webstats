import request from 'supertest';
import { setupTestContext } from '../utils/context';
import {
  addClanCreator,
  createClan,
  createStat,
  createUser,
} from '../factories';

const YEAR = (year: number) => Date.UTC(year, 5, 1, 12);

describe('climb/clans', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  describe('GET /climb/clans', () => {
    it('answers an empty page when there are no clans', async () => {
      const { body } = await get('/climb/clans').expect(200);

      expect(body.data).toEqual([]);
    });

    it('returns the clans with their founders and member count', async () => {
      const clan = await createClan(context.dataSource, {
        clanname: 'Rangers',
        tag: 'RGR',
        gold: 4,
      });
      const founder = await createUser(context.dataSource, {
        username: 'chief',
        clanId: clan.id,
      });

      await createUser(context.dataSource, {
        username: 'member',
        clanId: clan.id,
      });
      await addClanCreator(context.dataSource, clan.id, founder.id);

      const { body } = await get('/climb/clans').expect(200);

      expect(body.data).toEqual([
        {
          id: clan.id,
          clanname: 'Rangers',
          tag: 'RGR',
          gold: 4,
          silver: 0,
          bronze: 0,
          uniqueCaps: 0,
          totalCaps: 0,
          mapsCreated: 0,
          hardest: 0,
          creators: [{ id: founder.id, username: 'chief' }],
          usersCount: 2,
        },
      ]);
    });

    it('searches clans by name and by tag', async () => {
      await createClan(context.dataSource, { clanname: 'Rangers', tag: 'RGR' });
      await createClan(context.dataSource, { clanname: 'Hunters', tag: 'HNT' });

      const byName = await get('/climb/clans?search=range').expect(200);
      const byTag = await get('/climb/clans?search=HNT').expect(200);

      expect(
        byName.body.data.map((clan: { clanname: string }) => clan.clanname),
      ).toEqual(['Rangers']);
      expect(
        byTag.body.data.map((clan: { clanname: string }) => clan.clanname),
      ).toEqual(['Hunters']);
    });
  });

  describe('GET /climb/clans/:clanId', () => {
    it('returns the clan with its placement', async () => {
      const clan = await createClan(context.dataSource, {
        clanname: 'Ours',
        uniqueCaps: 5,
      });

      await createClan(context.dataSource, {
        clanname: 'Better',
        uniqueCaps: 50,
      });

      const { body } = await get(`/climb/clans/${clan.id}`).expect(200);

      expect(body.data).toMatchObject({
        id: clan.id,
        clanname: 'Ours',
        placement: { records: 2, hardest: 1, golds: 1 },
      });
    });

    it('answers 404 for a clan that does not exist', async () => {
      const { body } = await get('/climb/clans/999').expect(404);

      expect(body.message).toBe('Clan not found');
    });

    it('answers 400 for an id that is not a number', async () => {
      await get('/climb/clans/abc').expect(400);
    });
  });

  describe('GET /climb/clans/:clanId/users', () => {
    it('returns the roster with the founders leading it', async () => {
      const clan = await createClan(context.dataSource);
      const founder = await createUser(context.dataSource, {
        username: 'chief',
        clanId: clan.id,
        uniqueCaps: 1,
      });

      await createUser(context.dataSource, {
        username: 'member',
        clanId: clan.id,
        uniqueCaps: 90,
      });
      await addClanCreator(context.dataSource, clan.id, founder.id);

      const { body } = await get(`/climb/clans/${clan.id}/users`).expect(200);

      expect(
        body.data.map((user: { username: string; founder: boolean }) => [
          user.username,
          user.founder,
        ]),
      ).toEqual([
        ['chief', true],
        ['member', false],
      ]);
    });

    it('answers 404 for a clan that does not exist', async () => {
      const { body } = await get('/climb/clans/999/users').expect(404);

      expect(body.message).toBe('Clan not found');
    });

    it('answers an empty page for a clan without members', async () => {
      const clan = await createClan(context.dataSource);

      const { body } = await get(`/climb/clans/${clan.id}/users`).expect(200);

      expect(body.data).toEqual([]);
    });
  });

  describe('GET /climb/clans/:clanId/records-history', () => {
    it('returns a point per year for the members that were asked for', async () => {
      const clan = await createClan(context.dataSource);
      const member = await createUser(context.dataSource, { clanId: clan.id });

      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: YEAR(2020),
        position: 1,
      });
      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: YEAR(2021),
        position: 3,
      });

      const { body } = await get(
        `/climb/clans/${clan.id}/records-history?userIds=${member.id}`,
      ).expect(200);

      expect(body.data).toEqual([
        { label: '2020', records: 1, gold: 1, silver: 0, bronze: 0 },
        { label: '2021', records: 1, gold: 0, silver: 0, bronze: 1 },
      ]);
    });

    it('accepts several member ids separated by commas', async () => {
      const clan = await createClan(context.dataSource);
      const first = await createUser(context.dataSource, { clanId: clan.id });
      const second = await createUser(context.dataSource, { clanId: clan.id });

      await createStat(context.dataSource, {
        userId: first.id,
        recordDate: YEAR(2020),
      });
      await createStat(context.dataSource, {
        userId: second.id,
        recordDate: YEAR(2020),
      });

      const { body } = await get(
        `/climb/clans/${clan.id}/records-history?userIds=${first.id},${second.id}`,
      ).expect(200);

      expect(body.data).toEqual([
        { label: '2020', records: 2, gold: 0, silver: 0, bronze: 0 },
      ]);
    });

    it('answers with nothing when the ids belong to no member of the clan', async () => {
      const clan = await createClan(context.dataSource);
      const outsider = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: outsider.id,
        recordDate: YEAR(2020),
      });

      const { body } = await get(
        `/climb/clans/${clan.id}/records-history?userIds=${outsider.id}`,
      ).expect(200);

      expect(body.data).toEqual([]);
    });

    it('answers 404 for a clan that does not exist', async () => {
      const { body } = await get(
        '/climb/clans/999/records-history?userIds=1',
      ).expect(404);

      expect(body.message).toBe('Clan not found');
    });

    it('answers 400 when the member ids are missing', async () => {
      const clan = await createClan(context.dataSource);

      const { body } = await get(
        `/climb/clans/${clan.id}/records-history`,
      ).expect(400);

      expect(body.message).toBe('Validation failed (parsable array expected)');
    });

    it('answers 400 when the member ids are empty', async () => {
      const clan = await createClan(context.dataSource);

      await get(`/climb/clans/${clan.id}/records-history?userIds=`).expect(400);
    });

    it('answers 400 when a member id is not a number', async () => {
      const clan = await createClan(context.dataSource);

      const { body } = await get(
        `/climb/clans/${clan.id}/records-history?userIds=abc`,
      ).expect(400);

      expect(body.message).toContain('item must be a number');
    });
  });
});
