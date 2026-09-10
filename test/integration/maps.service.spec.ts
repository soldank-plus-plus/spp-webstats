import { MapsService } from '@api/features/climb/maps/maps.service';
import { MapEntity } from '@api/features/climb/maps/map.entity';
import { setupTestContext } from '../utils/context';
import { paginateQuery } from '../utils/paginate';
import { addMapCreator, createMap, createStat, createUser } from '../factories';

type MapWithCreators = MapEntity & {
  creators: { id: number; username: string }[];
  recordsCount: number;
};

describe('MapsService', () => {
  const context = setupTestContext();
  const service = () => context.app.get(MapsService);

  describe('findAll', () => {
    it('answers an empty page on an empty database', async () => {
      const result = await service().findAll(paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('attaches the creators of every map on the page', async () => {
      const map = await createMap(context.dataSource);
      const author = await createUser(context.dataSource, {
        username: 'author',
      });

      await addMapCreator(context.dataSource, map.id, author.id);

      const result = await service().findAll(paginateQuery());

      expect((result.data[0] as MapWithCreators).creators).toEqual([
        { id: author.id, username: 'author' },
      ]);
    });

    it('leaves the creators empty for a map nobody is credited with', async () => {
      await createMap(context.dataSource);

      const result = await service().findAll(paginateQuery());

      expect((result.data[0] as MapWithCreators).creators).toEqual([]);
    });

    it('counts the records set on every map', async () => {
      const map = await createMap(context.dataSource);
      const other = await createMap(context.dataSource);
      const user = await createUser(context.dataSource);

      await createStat(context.dataSource, { userId: user.id, mapId: map.id });
      await createStat(context.dataSource, { userId: user.id, mapId: map.id });

      const result = await service().findAll(paginateQuery());
      const counts = (result.data as MapWithCreators[]).map((entry) => [
        entry.id,
        entry.recordsCount,
      ]);

      expect(counts).toEqual([
        [map.id, 2],
        [other.id, 0],
      ]);
    });

    it('keeps a map on the page once however many creators it has', async () => {
      const map = await createMap(context.dataSource);
      const first = await createUser(context.dataSource, { username: 'one' });
      const second = await createUser(context.dataSource, { username: 'two' });

      await addMapCreator(context.dataSource, map.id, first.id);
      await addMapCreator(context.dataSource, map.id, second.id);

      const result = await service().findAll(paginateQuery({ limit: 10 }));

      expect(result.meta.totalItems).toBe(1);
      expect(result.data).toHaveLength(1);
      expect((result.data[0] as MapWithCreators).creators).toHaveLength(2);
    });

    it('narrows the page to maps made by a matching creator', async () => {
      const wanted = await createMap(context.dataSource, {
        mapname: 'climb_wanted',
      });

      await createMap(context.dataSource, { mapname: 'climb_other' });

      const author = await createUser(context.dataSource, {
        username: 'Mapmaker',
      });

      await addMapCreator(context.dataSource, wanted.id, author.id);

      const result = await service().findAll(paginateQuery(), 'mapmak');

      expect(result.data.map((map) => map.mapname)).toEqual(['climb_wanted']);
    });

    it('matches a creator anywhere in the name, ignoring case', async () => {
      const map = await createMap(context.dataSource);
      const author = await createUser(context.dataSource, {
        username: 'TheBestMapper',
      });

      await addMapCreator(context.dataSource, map.id, author.id);

      const result = await service().findAll(paginateQuery(), 'bestmap');

      expect(result.data).toHaveLength(1);
    });

    it('answers an empty page when no creator matches', async () => {
      const map = await createMap(context.dataSource);
      const author = await createUser(context.dataSource, { username: 'anna' });

      await addMapCreator(context.dataSource, map.id, author.id);

      const result = await service().findAll(paginateQuery(), 'nobody');

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('filters maps by a climb mode flag', async () => {
      await createMap(context.dataSource, { mapname: 'with_jets', jets: 1 });
      await createMap(context.dataSource, { mapname: 'without_jets', jets: 0 });

      const result = await service().findAll(
        paginateQuery({ filter: { jets: '1' } }),
      );

      expect(result.data.map((map) => map.mapname)).toEqual(['with_jets']);
    });

    it('searches maps by name', async () => {
      await createMap(context.dataSource, { mapname: 'climb_forest' });
      await createMap(context.dataSource, { mapname: 'climb_desert' });

      const result = await service().findAll(
        paginateQuery({ search: 'forest' }),
      );

      expect(result.data.map((map) => map.mapname)).toEqual(['climb_forest']);
    });

    it('sorts by difficulty when asked to', async () => {
      await createMap(context.dataSource, { mapname: 'easy', hardest: 1 });
      await createMap(context.dataSource, { mapname: 'hard', hardest: 9 });

      const result = await service().findAll(
        paginateQuery({ sortBy: [['hardest', 'DESC']] }),
      );

      expect(result.data.map((map) => map.mapname)).toEqual(['hard', 'easy']);
    });
  });

  describe('findOne', () => {
    it('returns the map with its creators and record count', async () => {
      const map = await createMap(context.dataSource, { mapname: 'climb_one' });
      const author = await createUser(context.dataSource, {
        username: 'maker',
      });
      const runner = await createUser(context.dataSource, {
        username: 'runner',
      });

      await addMapCreator(context.dataSource, map.id, author.id);
      await createStat(context.dataSource, {
        userId: runner.id,
        mapId: map.id,
      });

      const found = (await service().findOne(map.id)) as MapWithCreators;

      expect(found).toMatchObject({
        id: map.id,
        mapname: 'climb_one',
        recordsCount: 1,
      });
      expect(found.creators).toEqual([{ id: author.id, username: 'maker' }]);
    });

    it('answers null for a map that does not exist', async () => {
      expect(await service().findOne(999)).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('returns only the maps that user is credited with', async () => {
      const mine = await createMap(context.dataSource, { mapname: 'mine' });
      const theirs = await createMap(context.dataSource, { mapname: 'theirs' });
      const author = await createUser(context.dataSource, {
        username: 'author',
      });
      const other = await createUser(context.dataSource, { username: 'other' });

      await addMapCreator(context.dataSource, mine.id, author.id);
      await addMapCreator(context.dataSource, theirs.id, other.id);

      const result = await service().findAllByUser(author.id, paginateQuery());

      expect(result.data.map((map) => map.mapname)).toEqual(['mine']);
    });

    it('answers an empty page for a user who made no maps', async () => {
      const user = await createUser(context.dataSource);

      await createMap(context.dataSource);

      const result = await service().findAllByUser(user.id, paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('answers an empty page for a user that does not exist', async () => {
      await createMap(context.dataSource);

      const result = await service().findAllByUser(4242, paginateQuery());

      expect(result.data).toEqual([]);
    });
  });
});
