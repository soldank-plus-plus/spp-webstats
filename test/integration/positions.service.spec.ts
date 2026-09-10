import { PositionsService } from '@api/features/climb/positions/positions.service';
import { setupTestContext } from '../utils/context';
import { paginateQuery } from '../utils/paginate';
import { createMap, createPosition, createUser } from '../factories';

describe('PositionsService', () => {
  const context = setupTestContext();
  const service = () => context.app.get(PositionsService);

  describe('findAll', () => {
    it('answers an empty page on an empty database', async () => {
      const result = await service().findAll(paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('loads the map and the user behind every position', async () => {
      const user = await createUser(context.dataSource, { username: 'capper' });
      const map = await createMap(context.dataSource, { mapname: 'climb_x' });

      await createPosition(context.dataSource, {
        userId: user.id,
        mapId: map.id,
      });

      const [position] = (await service().findAll(paginateQuery())).data;

      expect(position.user).toMatchObject({ username: 'capper' });
      expect(position.map).toMatchObject({ mapname: 'climb_x' });
    });

    it('keeps a position that points at neither a map nor a user', async () => {
      await createPosition(context.dataSource);

      const [position] = (await service().findAll(paginateQuery())).data;

      expect(position.map).toBeNull();
      expect(position.user).toBeNull();
    });

    it('searches positions by map name', async () => {
      const wanted = await createMap(context.dataSource, {
        mapname: 'climb_wanted',
      });
      const other = await createMap(context.dataSource, {
        mapname: 'climb_other',
      });

      await createPosition(context.dataSource, { mapId: wanted.id });
      await createPosition(context.dataSource, { mapId: other.id });

      const result = await service().findAll(
        paginateQuery({ search: 'wanted' }),
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].map?.mapname).toBe('climb_wanted');
    });

    it('filters positions by medal', async () => {
      await createPosition(context.dataSource, { medal: 1 });
      await createPosition(context.dataSource, { medal: 2 });

      const result = await service().findAll(
        paginateQuery({ filter: { medal: '1' } }),
      );

      expect(result.data.map((position) => position.medal)).toEqual([1]);
    });

    it('sorts positions by the date they were set', async () => {
      const older = Date.UTC(2020, 0, 1);
      const newer = Date.UTC(2024, 0, 1);

      await createPosition(context.dataSource, { positionDate: older });
      await createPosition(context.dataSource, { positionDate: newer });

      const result = await service().findAll(
        paginateQuery({ sortBy: [['positionDate', 'DESC']] }),
      );

      expect(result.data.map((position) => position.positionDate)).toEqual([
        newer,
        older,
      ]);
    });
  });

  describe('findAllForMap and findAllForUser', () => {
    it('returns only the positions taken on that map', async () => {
      const map = await createMap(context.dataSource);
      const otherMap = await createMap(context.dataSource);

      await createPosition(context.dataSource, { mapId: map.id });
      await createPosition(context.dataSource, { mapId: otherMap.id });

      const result = await service().findAllForMap(map.id, paginateQuery());

      expect(result.data.map((position) => position.mapId)).toEqual([map.id]);
    });

    it('returns only the positions taken by that user', async () => {
      const user = await createUser(context.dataSource);
      const other = await createUser(context.dataSource);

      await createPosition(context.dataSource, { userId: user.id });
      await createPosition(context.dataSource, { userId: other.id });

      const result = await service().findAllForUser(user.id, paginateQuery());

      expect(result.data.map((position) => position.userId)).toEqual([user.id]);
    });

    it('answers an empty page for a map with no positions', async () => {
      const map = await createMap(context.dataSource);

      const result = await service().findAllForMap(map.id, paginateQuery());

      expect(result.data).toEqual([]);
    });

    it('answers an empty page for a map that does not exist', async () => {
      await createPosition(context.dataSource);

      const result = await service().findAllForMap(4242, paginateQuery());

      expect(result.data).toEqual([]);
    });
  });
});
