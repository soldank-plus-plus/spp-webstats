import request from 'supertest';
import { setupTestContext } from '../utils/context';
import {
  createMap,
  createPosition,
  createStat,
  createUser,
} from '../factories';

describe('climb/positions and climb/stats', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  describe('GET /climb/positions', () => {
    it('answers an empty page when there are no positions', async () => {
      const { body } = await get('/climb/positions').expect(200);

      expect(body.data).toEqual([]);
      expect(body.meta.totalItems).toBe(0);
    });

    it('flattens the map and the user into names', async () => {
      const user = await createUser(context.dataSource, { username: 'capper' });
      const map = await createMap(context.dataSource, { mapname: 'climb_x' });
      const position = await createPosition(context.dataSource, {
        userId: user.id,
        mapId: map.id,
        medal: 2,
        type: 1,
      });

      const { body } = await get('/climb/positions').expect(200);

      expect(body.data).toEqual([
        {
          id: position.id,
          type: 1,
          medal: 2,
          positionDate: expect.any(Number),
          mapId: map.id,
          userId: user.id,
          mapname: 'climb_x',
          username: 'capper',
        },
      ]);
    });

    it('reports no name for a position that points at nothing', async () => {
      await createPosition(context.dataSource);

      const { body } = await get('/climb/positions').expect(200);

      expect(body.data[0]).toMatchObject({ mapname: null, username: null });
    });

    it('keeps the whole related map and user objects out of the response', async () => {
      const user = await createUser(context.dataSource);
      const map = await createMap(context.dataSource);

      await createPosition(context.dataSource, {
        userId: user.id,
        mapId: map.id,
      });

      const { body } = await get('/climb/positions').expect(200);

      expect(body.data[0]).not.toHaveProperty('map');
      expect(body.data[0]).not.toHaveProperty('user');
    });

    it('searches positions by the name of the map', async () => {
      const wanted = await createMap(context.dataSource, {
        mapname: 'climb_wanted',
      });
      const other = await createMap(context.dataSource, {
        mapname: 'climb_other',
      });

      await createPosition(context.dataSource, { mapId: wanted.id });
      await createPosition(context.dataSource, { mapId: other.id });

      const { body } = await get('/climb/positions?search=wanted').expect(200);

      expect(
        body.data.map((entry: { mapname: string }) => entry.mapname),
      ).toEqual(['climb_wanted']);
    });

    it('filters positions by medal', async () => {
      await createPosition(context.dataSource, { medal: 1 });
      await createPosition(context.dataSource, { medal: 3 });

      const { body } = await get('/climb/positions?filter.medal=1').expect(200);

      expect(body.data.map((entry: { medal: number }) => entry.medal)).toEqual([
        1,
      ]);
    });
  });

  describe('GET /climb/stats', () => {
    it('answers an empty page when there are no records', async () => {
      const { body } = await get('/climb/stats').expect(200);

      expect(body.data).toEqual([]);
    });

    it('flattens the map and the user into names', async () => {
      const user = await createUser(context.dataSource, { username: 'racer' });
      const map = await createMap(context.dataSource, { mapname: 'climb_y' });
      const stat = await createStat(context.dataSource, {
        userId: user.id,
        mapId: map.id,
        recordTime: 1234,
        position: 1,
      });

      const { body } = await get('/climb/stats').expect(200);

      expect(body.data).toEqual([
        {
          id: stat.id,
          position: 1,
          userId: user.id,
          username: 'racer',
          mapId: map.id,
          mapname: 'climb_y',
          recordTime: 1234,
          recordDate: expect.any(Number),
          team: 0,
          status: 1,
        },
      ]);
    });

    it('keeps the whole related map and user objects out of the response', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id });

      const { body } = await get('/climb/stats').expect(200);

      expect(body.data[0]).not.toHaveProperty('map');
      expect(body.data[0]).not.toHaveProperty('user');
    });

    it('filters records by the user who set them', async () => {
      const user = await createUser(context.dataSource);
      const other = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id });
      await createStat(context.dataSource, { userId: other.id });

      const { body } = await get(
        `/climb/stats?filter.userId=${user.id}`,
      ).expect(200);

      expect(
        body.data.map((entry: { userId: number }) => entry.userId),
      ).toEqual([user.id]);
    });

    it('sorts records by time', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordTime: 900,
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordTime: 100,
      });

      const { body } = await get('/climb/stats?sortBy=recordTime:ASC').expect(
        200,
      );

      expect(
        body.data.map((entry: { recordTime: number }) => entry.recordTime),
      ).toEqual([100, 900]);
    });
  });
});
