import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { StatsService } from '@api/features/climb/stats/stats.service';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { createTestApp, getDataSource } from '../utils/app';
import { assertTestDatabase } from '../utils/data-source';
import { truncateAll } from '../utils/database';
import { createStat, createUser } from '../factories';

// far enough ahead of UTC that late evening is already the next day there, and
// new year's eve is already the next year
const SHIFTED_ZONE = 'Pacific/Kiritimati';

const LAST_EVENING_OF_2024 = Date.UTC(2024, 11, 31, 23, 30);
const MARCH_EVENING = Date.UTC(2024, 2, 15, 23, 30);

describe('activity buckets in a shifted database time zone', () => {
  const database = assertTestDatabase();

  let app: NestExpressApplication;
  let dataSource: DataSource;
  let user: UserEntity;

  beforeAll(async () => {
    const setup = await createTestApp();

    await truncateAll(getDataSource(setup));
    await getDataSource(setup).query(
      `ALTER DATABASE "${database}" SET timezone TO '${SHIFTED_ZONE}'`,
    );
    await setup.close();

    // a second application, because only sessions opened after the alter pick
    // the zone up
    app = await createTestApp();
    dataSource = getDataSource(app);
    user = await createUser(dataSource);

    await createStat(dataSource, {
      userId: user.id,
      recordDate: MARCH_EVENING,
    });
    await createStat(dataSource, {
      userId: user.id,
      recordDate: LAST_EVENING_OF_2024,
    });
  });

  afterAll(async () => {
    await dataSource?.query(`ALTER DATABASE "${database}" RESET timezone`);
    await app?.close();
  });

  it('runs against a session that is not on UTC', async () => {
    const [row] =
      await dataSource.query<{ TimeZone: string }[]>('SHOW timezone');

    expect(row.TimeZone).toBe(SHIFTED_ZONE);
  });

  it('counts a record on the day it was set in UTC', async () => {
    const activity = await app
      .get(StatsService)
      .findActivityForUser(user.id, 'records', 2024);

    expect(activity.days).toEqual([
      { day: '2024-03-15', count: 1 },
      { day: '2024-12-31', count: 1 },
    ]);
  });

  it('keeps a record set late on 31 december in that same year', async () => {
    const activity = await app
      .get(StatsService)
      .findActivityForUser(user.id, 'records');

    expect(activity.years).toEqual([2024]);
  });
});
