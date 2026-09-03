import 'reflect-metadata';
import AppDataSource from '../data-source';
import { UserEntity } from '@api/users/user.entity';
import { MapEntity } from '@api/maps/map.entity';
import { EventEntity } from '@api/events/event.entity';
import { StatEntity } from '@api/stats/stat.entity';

// refId is the original id from climb.sql (the real legacy dataset) this
// sample data is copied from. It's only used to wire up relations below
// before insertion — Postgres assigns the real ids.
type UserFixture = Partial<UserEntity> & { refId: number };
type MapFixture = Partial<MapEntity> & { refId: number };

const users: UserFixture[] = [
  {
    refId: 662,
    username: 'Vanatox',
    gold: 0,
    silver: 1,
    bronze: 0,
    noMedal: 59,
    uniqueCaps: 60,
    totalCaps: 71,
    mapsCreated: 32,
    hardest: 0,
    playtime: 6911395,
    createdAt: 1190073600000,
    lastActiveAt: 1390780800000,
  },
  {
    refId: 2937,
    username: 'Lysy z Brazzers',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 52,
    uniqueCaps: 52,
    totalCaps: 53,
    mapsCreated: 16,
    hardest: 0,
    playtime: 5975457,
    createdAt: 1368403200000,
    lastActiveAt: 1431379630000,
  },
  {
    refId: 2948,
    username: '|NFS|*unknown*',
    gold: 0,
    silver: 0,
    bronze: 1,
    noMedal: 120,
    uniqueCaps: 121,
    totalCaps: 125,
    mapsCreated: 6,
    hardest: 0,
    playtime: 12287436,
    createdAt: 1396122771000,
    lastActiveAt: 1605823210447,
  },
  {
    refId: 2952,
    username: 'Viral',
    gold: 1,
    silver: 0,
    bronze: 1,
    noMedal: 34,
    uniqueCaps: 36,
    totalCaps: 38,
    mapsCreated: 40,
    hardest: 0,
    playtime: 2894377,
    createdAt: 1367935572000,
    lastActiveAt: 1430160038000,
  },
  {
    refId: 3620,
    username: 'Nedi .dC',
    gold: 5,
    silver: 3,
    bronze: 0,
    noMedal: 77,
    uniqueCaps: 85,
    totalCaps: 85,
    mapsCreated: 30,
    hardest: 0,
    playtime: 6694099,
    createdAt: 1396122771000,
    lastActiveAt: 1487462400000,
  },
  {
    refId: 4427,
    username: '9host',
    gold: 77,
    silver: 76,
    bronze: 76,
    noMedal: 1071,
    uniqueCaps: 1300,
    totalCaps: 2651,
    mapsCreated: 37,
    hardest: 0,
    playtime: 217264345,
    createdAt: 1247035354000,
    lastActiveAt: 1380615277000,
  },
  {
    refId: 5069,
    username: 'Morko',
    gold: 3,
    silver: 4,
    bronze: 2,
    noMedal: 6,
    uniqueCaps: 15,
    totalCaps: 15,
    mapsCreated: 2,
    hardest: 0,
    playtime: 1003780,
    createdAt: 1445558400000,
    lastActiveAt: 1589016968499,
  },
  {
    refId: 5071,
    username: '`JacksLostYouth',
    gold: 29,
    silver: 21,
    bronze: 18,
    noMedal: 107,
    uniqueCaps: 175,
    totalCaps: 175,
    mapsCreated: 10,
    hardest: 0,
    playtime: 6079113,
    createdAt: 1482278400000,
    lastActiveAt: 1625704291883,
  },
  {
    refId: 5154,
    username: 'TikL',
    gold: 0,
    silver: 0,
    bronze: 1,
    noMedal: 10,
    uniqueCaps: 11,
    totalCaps: 13,
    mapsCreated: 25,
    hardest: 0,
    playtime: 622662,
    createdAt: 1342742400000,
    lastActiveAt: 1605892459534,
  },
  {
    refId: 5223,
    username: 'Morgondagen',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 5,
    uniqueCaps: 5,
    totalCaps: 5,
    mapsCreated: 43,
    hardest: 0,
    playtime: 322330,
    createdAt: 1575393537423,
    lastActiveAt: 1613868472073,
  },
  {
    refId: 5423,
    username: '|DK| Blue-ninja',
    gold: 1,
    silver: 0,
    bronze: 0,
    noMedal: 16,
    uniqueCaps: 17,
    totalCaps: 17,
    mapsCreated: 75,
    hardest: 0,
    playtime: 1749047,
    createdAt: 1287985476000,
    lastActiveAt: 1378733068000,
  },
  {
    refId: 16055,
    username: '~>pC. maxghz',
    gold: 0,
    silver: 0,
    bronze: 0,
    noMedal: 0,
    uniqueCaps: 0,
    totalCaps: 0,
    mapsCreated: 54,
    hardest: 0,
    playtime: 0,
    createdAt: null,
    lastActiveAt: null,
  },
];

const maps: MapFixture[] = [
  { refId: 1, mapname: 'ctf_lysy_throw', date: 1391963561, anticoop: 1 },
  { refId: 2, mapname: 'Maxu_Zabobin', date: 1611363281, anticoop: 1 },
  { refId: 3, mapname: 'ctf_boo_venom', date: 1429371401, anticoop: 1 },
  { refId: 4, mapname: 'rce_My_jettime', date: 1579384372, anticoop: 1 },
  {
    refId: 10,
    mapname: 'mc_1ebuc',
    date: 1593722493,
    anticoop: 1,
    hardest: 29,
  },
];

const mapCreators: { mapRefId: number; userRefId: number }[] = [
  { mapRefId: 1, userRefId: 2937 },
  { mapRefId: 2, userRefId: 16055 },
  { mapRefId: 3, userRefId: 4427 },
  { mapRefId: 4, userRefId: 5069 },
  { mapRefId: 10, userRefId: 2952 },
  { mapRefId: 10, userRefId: 3620 },
  { mapRefId: 10, userRefId: 5423 },
  { mapRefId: 10, userRefId: 5154 },
  { mapRefId: 10, userRefId: 5223 },
  { mapRefId: 10, userRefId: 5071 },
  { mapRefId: 10, userRefId: 2948 },
  { mapRefId: 10, userRefId: 16055 },
  { mapRefId: 10, userRefId: 662 },
];

const events: (Partial<EventEntity> & {
  mapRefId: number;
  userRefId: number;
})[] = [
  { type: 1, mapRefId: 1, userRefId: 5423, medal: 1, eventDate: 1572810519000 },
  { type: 1, mapRefId: 1, userRefId: 2948, medal: 1, eventDate: 1574346448000 },
  { type: 3, mapRefId: 1, userRefId: 5423, medal: 1, eventDate: 1574346448000 },
  { type: 1, mapRefId: 1, userRefId: 5423, medal: 2, eventDate: 1574346448000 },
  { type: 1, mapRefId: 1, userRefId: 3620, medal: 1, eventDate: 1574348729000 },
  { type: 3, mapRefId: 1, userRefId: 2948, medal: 1, eventDate: 1574348729000 },
  { type: 1, mapRefId: 1, userRefId: 2948, medal: 2, eventDate: 1574348729000 },
  { type: 3, mapRefId: 1, userRefId: 5423, medal: 2, eventDate: 1574348729000 },
  { type: 1, mapRefId: 1, userRefId: 5423, medal: 3, eventDate: 1574348729000 },
  { type: 1, mapRefId: 1, userRefId: 662, medal: 1, eventDate: 1574352577000 },
];

const stats: (Partial<StatEntity> & { mapRefId: number; userRefId: number })[] =
  [
    {
      userRefId: 5069,
      mapRefId: 4,
      recordTime: 71484,
      recordDate: 1620840806000,
      position: 1,
      team: 0,
      status: 1,
    },
    {
      userRefId: 5071,
      mapRefId: 4,
      recordTime: 80300,
      recordDate: 1620642476000,
      position: 2,
      team: 0,
      status: 1,
    },
    {
      userRefId: 5154,
      mapRefId: 4,
      recordTime: 80534,
      recordDate: 1723649837000,
      position: 3,
      team: 0,
      status: 1,
    },
    {
      userRefId: 5223,
      mapRefId: 4,
      recordTime: 81318,
      recordDate: 1726799974000,
      position: 4,
      team: 0,
      status: 1,
    },
    {
      userRefId: 5423,
      mapRefId: 4,
      recordTime: 97303,
      recordDate: 1732207216000,
      position: 5,
      team: 0,
      status: 1,
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
