import request from 'supertest';
import { setupTestContext } from '../utils/context';
import {
  addMapCreator,
  createMap,
  createPosition,
  createStat,
  createUser,
} from '../factories';

describe('climb/maps', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  describe('GET /climb/maps', () => {
    it('answers an empty page rather than a 404 when there are no maps', async () => {
      const { body } = await get('/climb/maps').expect(200);

      expect(body.data).toEqual([]);
      expect(body.meta.totalItems).toBe(0);
    });

    it('returns the maps with their creators and record count', async () => {
      const map = await createMap(context.dataSource, {
        mapname: 'climb_tower',
        hardest: 4,
      });
      const author = await createUser(context.dataSource, {
        username: 'builder',
      });
      const runner = await createUser(context.dataSource, {
        username: 'runner',
      });

      await addMapCreator(context.dataSource, map.id, author.id);
      await createStat(context.dataSource, {
        userId: runner.id,
        mapId: map.id,
      });

      const { body } = await get('/climb/maps').expect(200);

      expect(body.data).toEqual([
        {
          id: map.id,
          mapname: 'climb_tower',
          date: expect.any(Number),
          anticoop: 0,
          jets: 0,
          m79: 0,
          nade: 0,
          switch: 0,
          coop: 0,
          m79c: 0,
          hardest: 4,
          creators: [{ id: author.id, username: 'builder' }],
          recordsCount: 1,
        },
      ]);
    });

    it('hands the creation date over in milliseconds', async () => {
      await createMap(context.dataSource, { date: 1700000000 });

      const { body } = await get('/climb/maps').expect(200);

      expect(body.data[0].date).toBe(1700000000000);
    });

    it('reports an unknown creation date as null', async () => {
      await createMap(context.dataSource, { date: 0 });

      const { body } = await get('/climb/maps').expect(200);

      expect(body.data[0].date).toBeNull();
    });

    it('keeps the positions and stats of a map out of the response', async () => {
      const map = await createMap(context.dataSource);
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        mapId: map.id,
      });

      const { body } = await get('/climb/maps').expect(200);

      expect(body.data[0]).not.toHaveProperty('positions');
      expect(body.data[0]).not.toHaveProperty('stats');
    });

    it('narrows the list to maps made by a matching creator', async () => {
      const wanted = await createMap(context.dataSource, {
        mapname: 'climb_wanted',
      });

      await createMap(context.dataSource, { mapname: 'climb_other' });

      const author = await createUser(context.dataSource, {
        username: 'Mapmaker',
      });

      await addMapCreator(context.dataSource, wanted.id, author.id);

      const { body } = await get('/climb/maps?creator=mapmak').expect(200);

      expect(body.data.map((map: { mapname: string }) => map.mapname)).toEqual([
        'climb_wanted',
      ]);
    });

    // the value goes into ILIKE as %value%, so a percent sign the caller sends
    // widens the match instead of narrowing it. The parameter is still bound,
    // so nothing escapes the pattern itself
    it('reads a percent sign in the creator filter as a wildcard', async () => {
      const map = await createMap(context.dataSource);
      const author = await createUser(context.dataSource, { username: 'anna' });

      await addMapCreator(context.dataSource, map.id, author.id);

      const { body } = await get('/climb/maps?creator=%25').expect(200);

      expect(body.data).toHaveLength(1);
    });

    it('leaves out maps whose creator does not match at all', async () => {
      const map = await createMap(context.dataSource);
      const author = await createUser(context.dataSource, { username: 'anna' });

      await addMapCreator(context.dataSource, map.id, author.id);

      const { body } = await get('/climb/maps?creator=nobody').expect(200);

      expect(body.data).toEqual([]);
    });

    it('searches maps by name', async () => {
      await createMap(context.dataSource, { mapname: 'climb_forest' });
      await createMap(context.dataSource, { mapname: 'climb_desert' });

      const { body } = await get('/climb/maps?search=forest').expect(200);

      expect(body.data.map((map: { mapname: string }) => map.mapname)).toEqual([
        'climb_forest',
      ]);
    });

    it('filters maps by a climb mode flag', async () => {
      await createMap(context.dataSource, { mapname: 'jetted', jets: 1 });
      await createMap(context.dataSource, { mapname: 'plain', jets: 0 });

      const { body } = await get('/climb/maps?filter.jets=1').expect(200);

      expect(body.data.map((map: { mapname: string }) => map.mapname)).toEqual([
        'jetted',
      ]);
    });

    it('sorts maps by difficulty when asked to', async () => {
      await createMap(context.dataSource, { mapname: 'easy', hardest: 1 });
      await createMap(context.dataSource, { mapname: 'hard', hardest: 9 });

      const { body } = await get('/climb/maps?sortBy=hardest:DESC').expect(200);

      expect(body.data.map((map: { mapname: string }) => map.mapname)).toEqual([
        'hard',
        'easy',
      ]);
    });
  });

  describe('GET /climb/maps/:id', () => {
    it('returns the map behind the id', async () => {
      const map = await createMap(context.dataSource, { mapname: 'climb_one' });

      const { body } = await get(`/climb/maps/${map.id}`).expect(200);

      expect(body.data).toMatchObject({ id: map.id, mapname: 'climb_one' });
    });

    it('answers 404 for a map that does not exist', async () => {
      const { body } = await get('/climb/maps/999').expect(404);

      expect(body).toMatchObject({ statusCode: 404, message: 'Map not found' });
    });

    it.each(['abc', '1.5', 'null'])(
      'answers 400 when the id is %p rather than a number',
      async (id) => {
        const { body } = await get(`/climb/maps/${id}`).expect(400);

        expect(body.statusCode).toBe(400);
      },
    );
  });

  describe('GET /climb/maps/by-user/:userId', () => {
    it('returns only the maps that user is credited with', async () => {
      const mine = await createMap(context.dataSource, { mapname: 'mine' });
      const author = await createUser(context.dataSource);

      await createMap(context.dataSource, { mapname: 'theirs' });
      await addMapCreator(context.dataSource, mine.id, author.id);

      const { body } = await get(`/climb/maps/by-user/${author.id}`).expect(
        200,
      );

      expect(body.data.map((map: { mapname: string }) => map.mapname)).toEqual([
        'mine',
      ]);
    });

    it('answers 404 for a user that does not exist', async () => {
      await createMap(context.dataSource);

      const { body } = await get('/climb/maps/by-user/999').expect(404);

      expect(body.message).toBe('User not found');
    });

    it('answers an empty page for a user who made no maps', async () => {
      const user = await createUser(context.dataSource);

      await createMap(context.dataSource);

      const { body } = await get(`/climb/maps/by-user/${user.id}`).expect(200);

      expect(body.data).toEqual([]);
    });

    it('answers 400 for a user id that is not a number', async () => {
      await get('/climb/maps/by-user/abc').expect(400);
    });
  });

  describe('GET /climb/maps/:mapId/positions', () => {
    it('returns the positions taken on that map', async () => {
      const map = await createMap(context.dataSource, { mapname: 'climb_pos' });
      const otherMap = await createMap(context.dataSource);
      const user = await createUser(context.dataSource, { username: 'capper' });

      await createPosition(context.dataSource, {
        mapId: map.id,
        userId: user.id,
        medal: 1,
      });
      await createPosition(context.dataSource, { mapId: otherMap.id });

      const { body } = await get(`/climb/maps/${map.id}/positions`).expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        mapId: map.id,
        userId: user.id,
        medal: 1,
        mapname: 'climb_pos',
        username: 'capper',
      });
    });

    it('answers 404 for a map that does not exist', async () => {
      const { body } = await get('/climb/maps/999/positions').expect(404);

      expect(body.message).toBe('Map not found');
    });

    it('answers an empty page for a map nobody has a position on', async () => {
      const map = await createMap(context.dataSource);

      const { body } = await get(`/climb/maps/${map.id}/positions`).expect(200);

      expect(body.data).toEqual([]);
    });

    it('answers 400 for a map id that is not a number', async () => {
      await get('/climb/maps/abc/positions').expect(400);
    });
  });

  describe('GET /climb/maps/:mapId/stats', () => {
    it('returns the records set on that map', async () => {
      const map = await createMap(context.dataSource, { mapname: 'climb_rec' });
      const user = await createUser(context.dataSource, { username: 'racer' });

      await createStat(context.dataSource, {
        userId: user.id,
        mapId: map.id,
        recordTime: 4242,
        position: 1,
      });

      const { body } = await get(`/climb/maps/${map.id}/stats`).expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        mapId: map.id,
        userId: user.id,
        recordTime: 4242,
        position: 1,
        mapname: 'climb_rec',
        username: 'racer',
      });
    });

    it('answers 404 for a map that does not exist', async () => {
      const { body } = await get('/climb/maps/999/stats').expect(404);

      expect(body.message).toBe('Map not found');
    });

    it('answers an empty page for a map nobody has a record on', async () => {
      const map = await createMap(context.dataSource);

      const { body } = await get(`/climb/maps/${map.id}/stats`).expect(200);

      expect(body.data).toEqual([]);
    });
  });
});
