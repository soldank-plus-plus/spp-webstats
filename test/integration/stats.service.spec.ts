import { StatsService } from '@api/features/climb/stats/stats.service';
import { setupTestContext } from '../utils/context';
import { paginateQuery } from '../utils/paginate';
import { createMap, createStat, createUser } from '../factories';

const DAY = (year: number, month: number, day: number) =>
  Date.UTC(year, month - 1, day, 12);

describe('StatsService', () => {
  const context = setupTestContext();
  const service = () => context.app.get(StatsService);

  describe('findAll', () => {
    it('answers an empty page on an empty database', async () => {
      const result = await service().findAll(paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('loads the map and the user behind every record', async () => {
      const user = await createUser(context.dataSource, { username: 'runner' });
      const map = await createMap(context.dataSource, { mapname: 'climb_a' });

      await createStat(context.dataSource, { userId: user.id, mapId: map.id });

      const [stat] = (await service().findAll(paginateQuery())).data;

      expect(stat.user).toMatchObject({ username: 'runner' });
      expect(stat.map).toMatchObject({ mapname: 'climb_a' });
    });

    it('leaves the map null for a record that points at none', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id, mapId: null });

      const [stat] = (await service().findAll(paginateQuery())).data;

      expect(stat.map).toBeNull();
    });

    it('searches records by the name of the user who set them', async () => {
      const wanted = await createUser(context.dataSource, {
        username: 'wanted',
      });
      const other = await createUser(context.dataSource, { username: 'other' });

      await createStat(context.dataSource, { userId: wanted.id });
      await createStat(context.dataSource, { userId: other.id });

      const result = await service().findAll(
        paginateQuery({ search: 'wante' }),
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user.username).toBe('wanted');
    });

    it('filters records by the position that was taken', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id, position: 1 });
      await createStat(context.dataSource, { userId: user.id, position: 2 });

      const result = await service().findAll(
        paginateQuery({ filter: { position: '1' } }),
      );

      expect(result.data.map((stat) => stat.position)).toEqual([1]);
    });

    it('sorts records by time', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordTime: 5000,
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordTime: 1000,
      });

      const result = await service().findAll(
        paginateQuery({ sortBy: [['recordTime', 'ASC']] }),
      );

      expect(result.data.map((stat) => stat.recordTime)).toEqual([1000, 5000]);
    });

    it('reads record dates back as numbers', async () => {
      const user = await createUser(context.dataSource);
      const recordDate = DAY(2024, 3, 15);

      await createStat(context.dataSource, { userId: user.id, recordDate });

      const [stat] = (await service().findAll(paginateQuery())).data;

      expect(stat.recordDate).toBe(recordDate);
    });
  });

  describe('findAllForMap and findAllForUser', () => {
    it('returns only the records set on that map', async () => {
      const user = await createUser(context.dataSource);
      const map = await createMap(context.dataSource);
      const otherMap = await createMap(context.dataSource);

      await createStat(context.dataSource, { userId: user.id, mapId: map.id });
      await createStat(context.dataSource, {
        userId: user.id,
        mapId: otherMap.id,
      });

      const result = await service().findAllForMap(map.id, paginateQuery());

      expect(result.data.map((stat) => stat.mapId)).toEqual([map.id]);
    });

    it('returns only the records set by that user', async () => {
      const user = await createUser(context.dataSource);
      const other = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id });
      await createStat(context.dataSource, { userId: other.id });

      const result = await service().findAllForUser(user.id, paginateQuery());

      expect(result.data.map((stat) => stat.userId)).toEqual([user.id]);
    });

    it('answers an empty page for a map nobody has a record on', async () => {
      const map = await createMap(context.dataSource);

      const result = await service().findAllForMap(map.id, paginateQuery());

      expect(result.data).toEqual([]);
    });

    it('answers an empty page for a user that does not exist', async () => {
      const result = await service().findAllForUser(4242, paginateQuery());

      expect(result.data).toEqual([]);
    });
  });

  describe('findActivityForUser', () => {
    it('counts the records of the year day by day', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2024, 3, 15),
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2024, 3, 15),
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2024, 4, 2),
      });

      const activity = await service().findActivityForUser(
        user.id,
        'records',
        2024,
      );

      expect(activity.year).toBe(2024);
      expect(activity.days).toEqual([
        { day: '2024-03-15', count: 2 },
        { day: '2024-04-02', count: 1 },
      ]);
    });

    it('lists the years the user was active, newest first', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2020, 1, 1),
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2023, 1, 1),
      });

      const activity = await service().findActivityForUser(user.id, 'records');

      expect(activity.years).toEqual([2023, 2020]);
    });

    it('falls back to the most recent year when none is asked for', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2019, 6, 1),
      });
      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2022, 6, 1),
      });

      const activity = await service().findActivityForUser(user.id, 'records');

      expect(activity.year).toBe(2022);
      expect(activity.days).toEqual([{ day: '2022-06-01', count: 1 }]);
    });

    it('falls back to the most recent year when the one asked for is empty', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: DAY(2022, 6, 1),
      });

      const activity = await service().findActivityForUser(
        user.id,
        'records',
        1999,
      );

      expect(activity.year).toBe(2022);
    });

    it('falls back to the current year for a user with no records at all', async () => {
      const user = await createUser(context.dataSource);

      const activity = await service().findActivityForUser(user.id, 'records');

      expect(activity.year).toBe(new Date().getUTCFullYear());
      expect(activity.years).toEqual([]);
      expect(activity.days).toEqual([]);
    });

    it.each(['golds', 'silvers', 'bronzes'] as const)(
      'counts only the records that took the %s position',
      async (type) => {
        const user = await createUser(context.dataSource);

        for (const taken of [1, 2, 3, 4]) {
          await createStat(context.dataSource, {
            userId: user.id,
            recordDate: DAY(2024, 5, 5),
            position: taken,
          });
        }

        const activity = await service().findActivityForUser(
          user.id,
          type,
          2024,
        );

        expect(activity.days).toEqual([{ day: '2024-05-05', count: 1 }]);
      },
    );

    it('counts every record when no medal is asked for', async () => {
      const user = await createUser(context.dataSource);

      for (const taken of [1, 2, 3, 4]) {
        await createStat(context.dataSource, {
          userId: user.id,
          recordDate: DAY(2024, 5, 5),
          position: taken,
        });
      }

      const activity = await service().findActivityForUser(
        user.id,
        'records',
        2024,
      );

      expect(activity.days).toEqual([{ day: '2024-05-05', count: 4 }]);
    });

    it('ignores records that carry no date', async () => {
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: user.id,
        recordDate: null,
      });

      const activity = await service().findActivityForUser(user.id, 'records');

      expect(activity.years).toEqual([]);
    });

    it('ignores the records of other users', async () => {
      const user = await createUser(context.dataSource);
      const other = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: other.id,
        recordDate: DAY(2024, 1, 1),
      });

      const activity = await service().findActivityForUser(user.id, 'records');

      expect(activity.years).toEqual([]);
    });
  });
});
