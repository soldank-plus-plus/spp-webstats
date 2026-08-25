import 'reflect-metadata';
import AppDataSource from './data-source';
import { UserEntity } from '@api/users/user.entity';
import { MapEntity } from '@api/maps/map.entity';
import { EventEntity } from '@api/events/event.entity';
import { StatEntity } from '@api/stats/stat.entity';

// refId is the original id from the legacy sqlite dump this data was
// sampled from. It's only used to wire up relations below before insertion
// — Postgres assigns the real ids.
type UserFixture = Partial<UserEntity> & { refId: number };
type MapFixture = Partial<MapEntity> & { refId: number };

const users: UserFixture[] = [
  {
    refId: 10,
    username: '~>2Fast|`Fro$ty.|',
    gold: 2,
    silver: 13,
    bronze: 14,
    noMedal: 137,
    totalPoints: 1151,
    uniqueCaps: 166,
    mapsCreated: 0,
    playtime: 4789043,
    createdAt: 1530990093,
    lastActiveAt: 1772163780,
  },
  {
    refId: 23,
    username: '`JacksLostYouth',
    gold: 1,
    silver: 4,
    bronze: 8,
    noMedal: 299,
    totalPoints: 348,
    uniqueCaps: 312,
    mapsCreated: 0,
    playtime: 8800507,
    createdAt: 1531062913,
    lastActiveAt: 1667846653,
  },
  {
    refId: 422,
    username: 'spcc',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 225,
    totalPoints: 125,
    uniqueCaps: 225,
    mapsCreated: 0,
    playtime: 7266063,
    createdAt: 1559250452,
    lastActiveAt: 1725909658,
  },
  {
    refId: 435,
    username: '*Demon| CoCo-JamBo',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 75,
    totalPoints: 0,
    uniqueCaps: 75,
    mapsCreated: 0,
    playtime: 1851778,
    createdAt: 1560708269,
    lastActiveAt: 1612888915,
  },
  {
    refId: 1124,
    username: 'Morgondagen',
    gold: 0,
    silver: 7,
    bronze: 1,
    noMedal: 36,
    totalPoints: 165,
    uniqueCaps: 44,
    mapsCreated: 6,
    playtime: 1452050,
    createdAt: 1594763165,
    lastActiveAt: 1641385854,
  },
  {
    refId: 1728,
    username: '~>pC. Pavito',
    gold: 9,
    silver: 24,
    bronze: 36,
    noMedal: 667,
    totalPoints: 3419,
    uniqueCaps: 736,
    mapsCreated: 0,
    playtime: 22603818,
    createdAt: 1558020720,
    lastActiveAt: 1729531990,
  },
  {
    refId: 1762,
    username: 'YnGwi3',
    gold: 6,
    silver: 11,
    bronze: 22,
    noMedal: 667,
    totalPoints: 1967,
    uniqueCaps: 706,
    mapsCreated: 3,
    playtime: 19277045,
    createdAt: 1548727486,
    lastActiveAt: 1779231706,
  },
  {
    refId: 2763,
    username: 'Capybara~>',
    gold: 0,
    silver: 1,
    bronze: 2,
    noMedal: 17,
    totalPoints: 70,
    uniqueCaps: 20,
    mapsCreated: 0,
    playtime: 1720689,
    createdAt: 1712789752,
    lastActiveAt: 1724623633,
  },
  {
    refId: 3581,
    username: '~>pC. Ghostrunner',
    gold: 28,
    silver: 49,
    bronze: 52,
    noMedal: 459,
    totalPoints: 3981,
    uniqueCaps: 588,
    mapsCreated: 25,
    playtime: 17765848,
    createdAt: 1531245897,
    lastActiveAt: 1778249227,
  },
  {
    refId: 3850,
    username: 'Pure .ms',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    totalPoints: 0,
    uniqueCaps: 0,
    mapsCreated: 7,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
  {
    refId: 3855,
    username: 'Zakath',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    totalPoints: 0,
    uniqueCaps: 0,
    mapsCreated: 35,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
  {
    refId: 3866,
    username: 'shadow x chaos',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    totalPoints: 0,
    uniqueCaps: 0,
    mapsCreated: 1,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
  {
    refId: 3930,
    username: 'grand_diablo',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    totalPoints: 0,
    uniqueCaps: 0,
    mapsCreated: 10,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
  {
    refId: 3941,
    username: 'KamikazeDuck',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    totalPoints: 0,
    uniqueCaps: 0,
    mapsCreated: 1,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
  {
    refId: 3952,
    username: 'unknown',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    totalPoints: 0,
    uniqueCaps: 0,
    mapsCreated: 38,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
  {
    refId: 3963,
    username: 'Smilecythe',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    totalPoints: 0,
    uniqueCaps: 0,
    mapsCreated: 8,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
];

const maps: MapFixture[] = [
  { refId: 1, mapname: 'hns_Void', date: 0, hns: 1 },
  { refId: 2, mapname: 'rce_Hole', date: 0, race: 1 },
  { refId: 3, mapname: 'htf_Rubik', date: 0, htf: 1 },
  { refId: 4, mapname: 'Juice_Delta', date: 0, duplicate: 1 },
  { refId: 5, mapname: 'hns_Flood', date: 0, hns: 1 },
  { refId: 6, mapname: 'ctf_Borders', date: 0, ctf: 1 },
  { refId: 7, mapname: 'ctf_Horror', date: 0, ctf: 1 },
  { refId: 8, mapname: 'ctf_Fl', date: 0, ctf: 1 },
];

const mapCreators: { mapRefId: number; userRefId: number }[] = [
  { mapRefId: 1, userRefId: 3952 },
  { mapRefId: 2, userRefId: 3930 },
  { mapRefId: 3, userRefId: 3930 },
  { mapRefId: 4, userRefId: 3963 },
  { mapRefId: 5, userRefId: 3866 },
  { mapRefId: 6, userRefId: 3941 },
  { mapRefId: 7, userRefId: 3850 },
  { mapRefId: 8, userRefId: 3855 },
];

const events: (Partial<EventEntity> & {
  mapRefId: number;
  userRefId: number;
})[] = [
  // eventDate is a unix timestamp in milliseconds (matches climb.sql).
  { type: 1, mapRefId: 1, userRefId: 435, medal: 1, eventDate: 1572810519000 },
  { type: 1, mapRefId: 1, userRefId: 422, medal: 1, eventDate: 1574346448000 },
  { type: 3, mapRefId: 1, userRefId: 435, medal: 1, eventDate: 1574346448000 },
  { type: 1, mapRefId: 1, userRefId: 435, medal: 2, eventDate: 1574346448000 },
  { type: 1, mapRefId: 1, userRefId: 23, medal: 1, eventDate: 1574348729000 },
  { type: 3, mapRefId: 1, userRefId: 422, medal: 1, eventDate: 1574348729000 },
  { type: 1, mapRefId: 1, userRefId: 422, medal: 2, eventDate: 1574348729000 },
  { type: 3, mapRefId: 1, userRefId: 435, medal: 2, eventDate: 1574348729000 },
  { type: 1, mapRefId: 1, userRefId: 435, medal: 3, eventDate: 1574348729000 },
  { type: 1, mapRefId: 1, userRefId: 10, medal: 1, eventDate: 1574352577000 },
];

const stats: (Partial<StatEntity> & { mapRefId: number; userRefId: number })[] =
  [
    {
      userRefId: 1728,
      mapRefId: 4,
      recordTime: 71484,
      recordDate: 1620840806,
      position: 1,
      team: 0,
    },
    {
      userRefId: 1124,
      mapRefId: 4,
      recordTime: 80300,
      recordDate: 1620642476,
      position: 2,
      team: 0,
    },
    {
      userRefId: 2763,
      mapRefId: 4,
      recordTime: 80534,
      recordDate: 1723649837,
      position: 3,
      team: 0,
    },
    {
      userRefId: 1762,
      mapRefId: 4,
      recordTime: 81318,
      recordDate: 1726799974,
      position: 4,
      team: 0,
    },
    {
      userRefId: 3581,
      mapRefId: 4,
      recordTime: 97303,
      recordDate: 1732207216,
      position: 5,
      team: 0,
    },
  ];

async function run() {
  const dataSource = await AppDataSource.initialize();

  try {
    const userResult = await dataSource
      .getRepository(UserEntity)
      .insert(users.map(({ refId: _refId, ...user }) => user));
    const userIdByRef = new Map<number, number>(
      users.map((user, i) => [user.refId, userResult.identifiers[i].id]),
    );

    const mapResult = await dataSource
      .getRepository(MapEntity)
      .insert(maps.map(({ refId: _refId, ...map }) => map));
    const mapIdByRef = new Map<number, number>(
      maps.map((map, i) => [map.refId, mapResult.identifiers[i].id]),
    );

    await dataSource
      .createQueryBuilder()
      .insert()
      .into('map_creators')
      .values(
        mapCreators.map(({ mapRefId, userRefId }) => ({
          map_id: mapIdByRef.get(mapRefId),
          user_id: userIdByRef.get(userRefId),
        })),
      )
      .execute();

    await dataSource.getRepository(EventEntity).insert(
      events.map(({ mapRefId, userRefId, ...event }) => ({
        ...event,
        mapId: mapIdByRef.get(mapRefId),
        userId: userIdByRef.get(userRefId),
      })),
    );

    await dataSource.getRepository(StatEntity).insert(
      stats.map(({ mapRefId, userRefId, ...stat }) => ({
        ...stat,
        mapId: mapIdByRef.get(mapRefId),
        userId: userIdByRef.get(userRefId),
      })),
    );

    console.log('Fixtures inserted successfully.');
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
