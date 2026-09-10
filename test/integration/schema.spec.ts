import { UserEntity } from '@api/features/climb/users/user.entity';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { CountryEntity } from '@api/features/climb/countries/country.entity';
import { QueryFailedError } from 'typeorm';
import { setupTestContext } from '../utils/context';
import {
  addClanCreator,
  addMapCreator,
  createClan,
  createCountry,
  createMap,
  createUser,
} from '../factories';

describe('database schema', () => {
  const context = setupTestContext();

  it('matches the entities, so no migration is missing', async () => {
    const { upQueries } = await context.dataSource.driver
      .createSchemaBuilder()
      .log();

    expect(upQueries.map((query) => query.query)).toEqual([]);
  });

  it('maps camelCase properties onto snake_case columns', async () => {
    const user = await createUser(context.dataSource, { uniqueCaps: 7 });

    const [row] = await context.dataSource.query<
      { unique_caps: number; last_active_at: string }[]
    >('SELECT unique_caps, last_active_at FROM users WHERE id = $1', [user.id]);

    expect(row.unique_caps).toBe(7);
    expect(row.last_active_at).toBeDefined();
  });

  it('reads bigint timestamps back as numbers rather than strings', async () => {
    const timestamp = 1717200000000;
    const user = await createUser(context.dataSource, {
      createdAt: timestamp,
      lastActiveAt: timestamp,
    });

    const reloaded = await context.dataSource
      .getRepository(UserEntity)
      .findOneByOrFail({ id: user.id });

    expect(reloaded.createdAt).toBe(timestamp);
    expect(typeof reloaded.createdAt).toBe('number');
  });

  it('keeps a null bigint null instead of turning it into zero', async () => {
    const user = await createUser(context.dataSource, {
      createdAt: null,
      lastActiveAt: null,
    });

    const reloaded = await context.dataSource
      .getRepository(UserEntity)
      .findOneByOrFail({ id: user.id });

    expect(reloaded.createdAt).toBeNull();
    expect(reloaded.lastActiveAt).toBeNull();
  });

  it('rejects a duplicate username', async () => {
    await createUser(context.dataSource, { username: 'duplicate' });

    await expect(
      createUser(context.dataSource, { username: 'duplicate' }),
    ).rejects.toThrow(QueryFailedError);
  });

  it('rejects a duplicate country code', async () => {
    await createCountry(context.dataSource, { code: 'pl' });

    await expect(
      createCountry(context.dataSource, { code: 'pl' }),
    ).rejects.toThrow(QueryFailedError);
  });

  it('requires a stat to point at a user that exists', async () => {
    await expect(
      context.dataSource.getRepository(StatEntity).save({
        userId: 999999,
        mapId: null,
        recordTime: 1,
        recordDate: null,
        position: null,
        team: 0,
        status: 1,
      }),
    ).rejects.toThrow(QueryFailedError);
  });

  it('drops map authorship rows when the user behind them is deleted', async () => {
    const user = await createUser(context.dataSource);
    const map = await createMap(context.dataSource);

    await addMapCreator(context.dataSource, map.id, user.id);
    await context.dataSource.getRepository(UserEntity).delete(user.id);

    const rows = await context.dataSource.query(
      'SELECT * FROM map_creators WHERE map_id = $1',
      [map.id],
    );

    expect(rows).toEqual([]);
  });

  it('drops clan founder rows when the user behind them is deleted', async () => {
    const user = await createUser(context.dataSource);
    const clan = await createClan(context.dataSource);

    await addClanCreator(context.dataSource, clan.id, user.id);
    await context.dataSource.getRepository(UserEntity).delete(user.id);

    const rows = await context.dataSource.query(
      'SELECT * FROM clan_creators WHERE clan_id = $1',
      [clan.id],
    );

    expect(rows).toEqual([]);
  });

  it('starts identities over between tests, so ids are predictable', async () => {
    const country = await createCountry(context.dataSource);

    expect(country.id).toBe(1);
  });

  it('leaves no rows behind from the previous test', async () => {
    const count = await context.dataSource.getRepository(CountryEntity).count();

    expect(count).toBe(0);
  });
});
