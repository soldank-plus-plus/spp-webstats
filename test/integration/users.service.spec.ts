import { UsersService } from '@api/features/climb/users/users.service';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { setupTestContext } from '../utils/context';
import { paginateQuery } from '../utils/paginate';
import {
  addClanCreator,
  createClan,
  createCountry,
  createMap,
  createUser,
} from '../factories';

describe('UsersService', () => {
  const context = setupTestContext();
  const service = () => context.app.get(UsersService);

  describe('findAll', () => {
    it('reports the share of maps a user has captured', async () => {
      await createMap(context.dataSource);
      await createMap(context.dataSource);
      await createMap(context.dataSource);
      await createMap(context.dataSource);
      await createUser(context.dataSource, { uniqueCaps: 1 });

      const result = await service().findAll(paginateQuery());

      expect(result.data[0]).toMatchObject({ passed: 25 });
    });

    it('rounds the share to one decimal place', async () => {
      await createMap(context.dataSource);
      await createMap(context.dataSource);
      await createMap(context.dataSource);
      await createUser(context.dataSource, { uniqueCaps: 1 });

      const result = await service().findAll(paginateQuery());

      expect(result.data[0]).toMatchObject({ passed: 33.3 });
    });

    it('reports no progress when there are no maps to capture', async () => {
      await createUser(context.dataSource, { uniqueCaps: 5 });

      const result = await service().findAll(paginateQuery());

      expect(result.data[0]).toMatchObject({ passed: 0 });
    });

    it('treats a user without captures as having captured nothing', async () => {
      await createMap(context.dataSource);
      await createUser(context.dataSource, { uniqueCaps: null });

      const result = await service().findAll(paginateQuery());

      expect(result.data[0]).toMatchObject({ passed: 0 });
    });

    it('answers an empty page rather than failing on an empty database', async () => {
      const result = await service().findAll(paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('sorts by id ascending unless asked otherwise', async () => {
      const second = await createUser(context.dataSource, { username: 'b' });
      const first = await createUser(context.dataSource, { username: 'a' });

      const result = await service().findAll(paginateQuery());

      expect(result.data.map((user) => user.id)).toEqual([second.id, first.id]);
    });

    it('puts users without medals last when sorting by them descending', async () => {
      await createUser(context.dataSource, { username: 'empty', gold: null });
      await createUser(context.dataSource, { username: 'best', gold: 10 });

      const result = await service().findAll(
        paginateQuery({ sortBy: [['gold', 'DESC']] }),
      );

      expect(result.data.map((user) => user.username)).toEqual([
        'best',
        'empty',
      ]);
    });
  });

  describe('findAllForClan', () => {
    it('leads the roster with the founders', async () => {
      const clan = await createClan(context.dataSource);

      await createUser(context.dataSource, {
        username: 'member',
        clanId: clan.id,
        uniqueCaps: 100,
      });

      const founder = await createUser(context.dataSource, {
        username: 'founder',
        clanId: clan.id,
        uniqueCaps: 1,
      });

      await addClanCreator(context.dataSource, clan.id, founder.id);

      const result = await service().findAllForClan(clan.id, paginateQuery());

      expect(result.data.map((user) => user.username)).toEqual([
        'founder',
        'member',
      ]);
      expect(
        result.data.map(
          (user) => (user as UserEntity & { founder: boolean }).founder,
        ),
      ).toEqual([true, false]);
    });

    it('ranks the members of each group by captures', async () => {
      const clan = await createClan(context.dataSource);

      await createUser(context.dataSource, {
        username: 'weaker',
        clanId: clan.id,
        uniqueCaps: 1,
      });
      await createUser(context.dataSource, {
        username: 'stronger',
        clanId: clan.id,
        uniqueCaps: 50,
      });

      const result = await service().findAllForClan(clan.id, paginateQuery());

      expect(result.data.map((user) => user.username)).toEqual([
        'stronger',
        'weaker',
      ]);
    });

    it('sorts by username without letting case decide the order', async () => {
      const clan = await createClan(context.dataSource);

      await createUser(context.dataSource, {
        username: 'alpha',
        clanId: clan.id,
      });
      await createUser(context.dataSource, {
        username: 'Beta',
        clanId: clan.id,
      });
      await createUser(context.dataSource, {
        username: 'gamma',
        clanId: clan.id,
      });

      const result = await service().findAllForClan(
        clan.id,
        paginateQuery({ sortBy: [['username', 'ASC']] }),
      );

      expect(result.data.map((user) => user.username)).toEqual([
        'alpha',
        'Beta',
        'gamma',
      ]);
    });

    it('drops the founder grouping when an explicit username sort is asked for', async () => {
      const clan = await createClan(context.dataSource);
      const founder = await createUser(context.dataSource, {
        username: 'zzz',
        clanId: clan.id,
      });

      await createUser(context.dataSource, {
        username: 'aaa',
        clanId: clan.id,
      });
      await addClanCreator(context.dataSource, clan.id, founder.id);

      const result = await service().findAllForClan(
        clan.id,
        paginateQuery({ sortBy: [['username', 'ASC']] }),
      );

      expect(result.data.map((user) => user.username)).toEqual(['aaa', 'zzz']);
    });

    it('sorts by username descending when asked to', async () => {
      const clan = await createClan(context.dataSource);

      await createUser(context.dataSource, {
        username: 'aaa',
        clanId: clan.id,
      });
      await createUser(context.dataSource, {
        username: 'bbb',
        clanId: clan.id,
      });

      const result = await service().findAllForClan(
        clan.id,
        paginateQuery({ sortBy: [['username', 'DESC']] }),
      );

      expect(result.data.map((user) => user.username)).toEqual(['bbb', 'aaa']);
    });

    it('keeps members of other clans out', async () => {
      const clan = await createClan(context.dataSource);
      const otherClan = await createClan(context.dataSource);

      await createUser(context.dataSource, {
        username: 'ours',
        clanId: clan.id,
      });
      await createUser(context.dataSource, {
        username: 'theirs',
        clanId: otherClan.id,
      });
      await createUser(context.dataSource, { username: 'clanless' });

      const result = await service().findAllForClan(clan.id, paginateQuery());

      expect(result.data.map((user) => user.username)).toEqual(['ours']);
    });

    it('answers an empty page for a clan with no members', async () => {
      const clan = await createClan(context.dataSource);

      const result = await service().findAllForClan(clan.id, paginateQuery());

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('findAllForCountry', () => {
    it('returns only the users of that country, best first', async () => {
      const country = await createCountry(context.dataSource);
      const other = await createCountry(context.dataSource);

      await createUser(context.dataSource, {
        username: 'weaker',
        countryId: country.id,
        uniqueCaps: 1,
      });
      await createUser(context.dataSource, {
        username: 'stronger',
        countryId: country.id,
        uniqueCaps: 9,
      });
      await createUser(context.dataSource, {
        username: 'foreigner',
        countryId: other.id,
      });

      const result = await service().findAllForCountry(
        country.id,
        paginateQuery(),
      );

      expect(result.data.map((user) => user.username)).toEqual([
        'stronger',
        'weaker',
      ]);
    });
  });

  describe('findOne', () => {
    it('places a user by how many users beat them', async () => {
      await createUser(context.dataSource, {
        username: 'first',
        uniqueCaps: 30,
      });
      await createUser(context.dataSource, {
        username: 'second',
        uniqueCaps: 20,
      });

      const third = await createUser(context.dataSource, {
        username: 'third',
        uniqueCaps: 10,
      });

      const user = await service().findOne(third.id);

      expect(user?.placement.records).toBe(3);
    });

    it('gives tied users the same place', async () => {
      const tied = await createUser(context.dataSource, {
        username: 'tied',
        uniqueCaps: 10,
        gold: 5,
        hardest: 3,
      });

      await createUser(context.dataSource, {
        username: 'alsoTied',
        uniqueCaps: 10,
        gold: 5,
        hardest: 3,
      });
      await createUser(context.dataSource, {
        username: 'better',
        uniqueCaps: 20,
        gold: 9,
        hardest: 8,
      });

      const user = await service().findOne(tied.id);

      expect(user?.placement).toEqual({ records: 2, hardest: 2, golds: 2 });
    });

    it('counts a user with no score as beaten by everyone with one', async () => {
      await createUser(context.dataSource, { username: 'scorer', gold: 1 });

      const empty = await createUser(context.dataSource, {
        username: 'empty',
        gold: null,
        uniqueCaps: null,
        hardest: null,
      });

      const user = await service().findOne(empty.id);

      expect(user?.placement.golds).toBe(2);
    });

    it('reports how many maps are left to capture', async () => {
      await createMap(context.dataSource);
      await createMap(context.dataSource);
      await createMap(context.dataSource);

      const user = await createUser(context.dataSource, { uniqueCaps: 1 });

      const found = await service().findOne(user.id);

      expect(found?.mapsLeft).toBe(2);
    });

    it('never reports fewer than zero maps left', async () => {
      await createMap(context.dataSource);

      const user = await createUser(context.dataSource, { uniqueCaps: 5 });

      const found = await service().findOne(user.id);

      expect(found?.mapsLeft).toBe(0);
    });

    it('loads the clan the user belongs to', async () => {
      const clan = await createClan(context.dataSource, {
        clanname: 'Legends',
      });
      const user = await createUser(context.dataSource, { clanId: clan.id });

      const found = await service().findOne(user.id);

      expect(found?.clan).toMatchObject({ id: clan.id, clanname: 'Legends' });
    });

    it('reports no clan for a user who belongs to none', async () => {
      const user = await createUser(context.dataSource);

      const found = await service().findOne(user.id);

      expect(found?.clan).toBeNull();
    });

    it('answers null for a user that does not exist', async () => {
      expect(await service().findOne(4242)).toBeNull();
    });
  });

  describe('findOneByUsername', () => {
    it('finds the user behind an exact username', async () => {
      await createUser(context.dataSource, { username: 'Sniper' });

      const found = await service().findOneByUsername('Sniper');

      expect(found).toMatchObject({ username: 'Sniper' });
    });

    it('does not match a username that differs in case', async () => {
      await createUser(context.dataSource, { username: 'Sniper' });

      expect(await service().findOneByUsername('sniper')).toBeNull();
    });

    it('answers null for a username nobody uses', async () => {
      expect(await service().findOneByUsername('ghost')).toBeNull();
    });
  });
});
