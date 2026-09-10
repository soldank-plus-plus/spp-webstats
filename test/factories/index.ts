import { DataSource } from 'typeorm';
import { ClanEntity } from '@api/features/climb/clans/clan.entity';
import { CountryEntity } from '@api/features/climb/countries/country.entity';
import { MapEntity } from '@api/features/climb/maps/map.entity';
import { PositionEntity } from '@api/features/climb/positions/position.entity';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { UserEntity } from '@api/features/climb/users/user.entity';

// Only feeds the unique columns, so two records built with the same defaults do
// not collide. Nothing asserts on these values: a test that cares about a name
// passes it in
let sequence = 0;
const next = (): number => (sequence += 1);

export const UNIX_2024_06_01 = Date.UTC(2024, 5, 1);

export const createCountry = (
  dataSource: DataSource,
  overrides: Partial<CountryEntity> = {},
): Promise<CountryEntity> => {
  const id = next();

  return dataSource.getRepository(CountryEntity).save({
    countryname: `Country ${id}`,
    // two characters, the column is a varchar(2) unique code
    code: id.toString(36).padStart(2, '0').slice(-2),
    gold: 0,
    silver: 0,
    bronze: 0,
    uniqueCaps: 0,
    totalCaps: 0,
    mapsCreated: 0,
    hardest: 0,
    ...overrides,
  });
};

export const createClan = (
  dataSource: DataSource,
  overrides: Partial<ClanEntity> = {},
): Promise<ClanEntity> => {
  const id = next();

  return dataSource.getRepository(ClanEntity).save({
    clanname: `Clan ${id}`,
    tag: `C${id}`,
    gold: 0,
    silver: 0,
    bronze: 0,
    uniqueCaps: 0,
    totalCaps: 0,
    mapsCreated: 0,
    hardest: 0,
    ...overrides,
  });
};

export const createUser = (
  dataSource: DataSource,
  overrides: Partial<UserEntity> = {},
): Promise<UserEntity> => {
  const id = next();

  return dataSource.getRepository(UserEntity).save({
    username: `player${id}`,
    clanId: null,
    countryId: null,
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    uniqueCaps: 0,
    totalCaps: 0,
    mapsCreated: 0,
    hardest: 0,
    playtime: 0,
    createdAt: UNIX_2024_06_01,
    lastActiveAt: UNIX_2024_06_01,
    ...overrides,
  });
};

export const createMap = (
  dataSource: DataSource,
  overrides: Partial<MapEntity> = {},
): Promise<MapEntity> => {
  const id = next();

  return dataSource.getRepository(MapEntity).save({
    mapname: `climb_map_${id}`,
    // the column holds seconds, the api multiplies it into milliseconds
    date: Math.floor(UNIX_2024_06_01 / 1000),
    anticoop: 0,
    jets: 0,
    m79: 0,
    nade: 0,
    switch: 0,
    coop: 0,
    m79c: 0,
    hardest: 0,
    ...overrides,
  });
};

export const createPosition = (
  dataSource: DataSource,
  overrides: Partial<PositionEntity> = {},
): Promise<PositionEntity> =>
  dataSource.getRepository(PositionEntity).save({
    type: 1,
    mapId: null,
    userId: null,
    medal: null,
    positionDate: UNIX_2024_06_01,
    ...overrides,
  });

export const createStat = (
  dataSource: DataSource,
  overrides: Partial<StatEntity> & { userId: number },
): Promise<StatEntity> =>
  dataSource.getRepository(StatEntity).save({
    mapId: null,
    recordTime: 60000,
    recordDate: UNIX_2024_06_01,
    position: null,
    team: 0,
    status: 1,
    ...overrides,
  });

export const addMapCreator = async (
  dataSource: DataSource,
  mapId: number,
  userId: number,
): Promise<void> => {
  await dataSource.query(
    'INSERT INTO map_creators (map_id, user_id) VALUES ($1, $2)',
    [mapId, userId],
  );
};

export const addClanCreator = async (
  dataSource: DataSource,
  clanId: number,
  userId: number,
): Promise<void> => {
  await dataSource.query(
    'INSERT INTO clan_creators (clan_id, user_id) VALUES ($1, $2)',
    [clanId, userId],
  );
};
