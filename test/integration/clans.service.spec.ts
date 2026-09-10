import { ClansService } from '@api/features/climb/clans/clans.service';
import { ClanEntity } from '@api/features/climb/clans/clan.entity';
import { setupTestContext } from '../utils/context';
import { paginateQuery } from '../utils/paginate';
import {
  addClanCreator,
  createClan,
  createStat,
  createUser,
} from '../factories';

type ClanWithCreators = ClanEntity & {
  creators: { id: number; username: string }[];
  usersCount: number;
};

const YEAR = (year: number, month = 5, day = 1) =>
  Date.UTC(year, month, day, 12);

describe('ClansService', () => {
  const context = setupTestContext();
  const service = () => context.app.get(ClansService);

  describe('exists', () => {
    it('recognises a clan that is there', async () => {
      const clan = await createClan(context.dataSource);

      expect(await service().exists(clan.id)).toBe(true);
    });

    it('rejects an id nothing is stored under', async () => {
      expect(await service().exists(4242)).toBe(false);
    });
  });

  describe('findAll', () => {
    it('answers an empty page on an empty database', async () => {
      const result = await service().findAll(paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('attaches the founders and the member count', async () => {
      const clan = await createClan(context.dataSource, { clanname: 'Alpha' });
      const founder = await createUser(context.dataSource, {
        username: 'founder',
        clanId: clan.id,
      });

      await createUser(context.dataSource, {
        username: 'member',
        clanId: clan.id,
      });
      await addClanCreator(context.dataSource, clan.id, founder.id);

      const result = await service().findAll(paginateQuery());
      const [entry] = result.data as ClanWithCreators[];

      expect(entry.creators).toEqual([{ id: founder.id, username: 'founder' }]);
      expect(entry.usersCount).toBe(2);
    });

    it('reports no members and no founders for an empty clan', async () => {
      await createClan(context.dataSource);

      const [entry] = (await service().findAll(paginateQuery()))
        .data as ClanWithCreators[];

      expect(entry.creators).toEqual([]);
      expect(entry.usersCount).toBe(0);
    });

    it('searches clans by name and by tag', async () => {
      await createClan(context.dataSource, { clanname: 'Rangers', tag: 'RGR' });
      await createClan(context.dataSource, { clanname: 'Hunters', tag: 'HNT' });

      const byName = await service().findAll(
        paginateQuery({ search: 'range' }),
      );
      const byTag = await service().findAll(paginateQuery({ search: 'HNT' }));

      expect(byName.data.map((clan) => clan.clanname)).toEqual(['Rangers']);
      expect(byTag.data.map((clan) => clan.clanname)).toEqual(['Hunters']);
    });
  });

  describe('findOne', () => {
    it('places the clan against the others', async () => {
      await createClan(context.dataSource, {
        clanname: 'Better',
        uniqueCaps: 50,
        hardest: 9,
        gold: 30,
      });

      const clan = await createClan(context.dataSource, {
        clanname: 'Ours',
        uniqueCaps: 10,
        hardest: 2,
        gold: 1,
      });

      const found = await service().findOne(clan.id);

      expect(found?.placement).toEqual({ records: 2, hardest: 2, golds: 2 });
    });

    it('gives tied clans the same place', async () => {
      const clan = await createClan(context.dataSource, { uniqueCaps: 10 });

      await createClan(context.dataSource, { uniqueCaps: 10 });

      const found = await service().findOne(clan.id);

      expect(found?.placement.records).toBe(1);
    });

    it('places a clan that has no scores at all behind every clan that has', async () => {
      const clan = await createClan(context.dataSource, {
        uniqueCaps: null,
        hardest: null,
        gold: null,
      });

      await createClan(context.dataSource, {
        uniqueCaps: 5,
        hardest: 5,
        gold: 5,
      });

      const found = await service().findOne(clan.id);

      expect(found?.placement).toEqual({ records: 2, hardest: 2, golds: 2 });
    });

    it('answers null for a clan that does not exist', async () => {
      expect(await service().findOne(999)).toBeNull();
    });
  });

  describe('findRecordsHistory', () => {
    it('groups the records of the given members by year', async () => {
      const clan = await createClan(context.dataSource);
      const member = await createUser(context.dataSource, { clanId: clan.id });

      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: YEAR(2020),
        position: 1,
      });
      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: YEAR(2020),
        position: 2,
      });

      const history = await service().findRecordsHistory(clan.id, [member.id]);

      expect(history).toEqual([
        { label: '2020', records: 2, gold: 1, silver: 1, bronze: 0 },
      ]);
    });

    it('counts medals by the position that was taken', async () => {
      const clan = await createClan(context.dataSource);
      const member = await createUser(context.dataSource, { clanId: clan.id });

      for (const position of [1, 2, 3, 4]) {
        await createStat(context.dataSource, {
          userId: member.id,
          recordDate: YEAR(2021),
          position,
        });
      }

      const [point] = await service().findRecordsHistory(clan.id, [member.id]);

      expect(point).toEqual({
        label: '2021',
        records: 4,
        gold: 1,
        silver: 1,
        bronze: 1,
      });
    });

    it('fills the years in between so the line has no holes', async () => {
      const clan = await createClan(context.dataSource);
      const member = await createUser(context.dataSource, { clanId: clan.id });

      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: YEAR(2018),
      });
      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: YEAR(2021),
      });

      const history = await service().findRecordsHistory(clan.id, [member.id]);

      expect(history.map((point) => point.label)).toEqual([
        '2018',
        '2019',
        '2020',
        '2021',
      ]);
      expect(history.map((point) => point.records)).toEqual([1, 0, 0, 1]);
    });

    it('keeps the year buckets in UTC whatever the session time zone is', async () => {
      const clan = await createClan(context.dataSource);
      const member = await createUser(context.dataSource, { clanId: clan.id });

      // a minute past new year in UTC, which is still the old year in any
      // timezone behind it
      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: Date.UTC(2022, 0, 1, 0, 1),
      });

      const history = await service().findRecordsHistory(clan.id, [member.id]);

      expect(history.map((point) => point.label)).toEqual(['2022']);
    });

    it('ignores ids of users who are not in the clan', async () => {
      const clan = await createClan(context.dataSource);
      const member = await createUser(context.dataSource, { clanId: clan.id });
      const outsider = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: YEAR(2020),
      });
      await createStat(context.dataSource, {
        userId: outsider.id,
        recordDate: YEAR(2020),
      });

      const [point] = await service().findRecordsHistory(clan.id, [
        member.id,
        outsider.id,
      ]);

      expect(point.records).toBe(1);
    });

    it('answers nothing when none of the ids belong to the clan', async () => {
      const clan = await createClan(context.dataSource);
      const outsider = await createUser(context.dataSource);

      await createStat(context.dataSource, {
        userId: outsider.id,
        recordDate: YEAR(2020),
      });

      expect(
        await service().findRecordsHistory(clan.id, [outsider.id]),
      ).toEqual([]);
    });

    it('answers nothing when the members have no dated records', async () => {
      const clan = await createClan(context.dataSource);
      const member = await createUser(context.dataSource, { clanId: clan.id });

      await createStat(context.dataSource, {
        userId: member.id,
        recordDate: null,
      });

      expect(await service().findRecordsHistory(clan.id, [member.id])).toEqual(
        [],
      );
    });
  });
});
