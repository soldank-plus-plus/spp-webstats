import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { StatEntity } from './stat.entity';
import { STATS_PAGINATION_CONFIG } from './stats.pagination';

export type ActivityType = 'records' | 'golds' | 'silvers' | 'bronzes';

export const ACTIVITY_TYPES: ActivityType[] = [
  'records',
  'golds',
  'silvers',
  'bronzes',
];

// position on a map's leaderboard: 1st place = gold, 2nd = silver, 3rd = bronze
const ACTIVITY_POSITION: Record<ActivityType, number | undefined> = {
  records: undefined,
  golds: 1,
  silvers: 2,
  bronzes: 3,
};

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(StatEntity)
    private readonly statsRepository: Repository<StatEntity>,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<StatEntity>> {
    return paginate(query, this.statsRepository, STATS_PAGINATION_CONFIG);
  }

  findAllForMap(
    mapId: number,
    query: PaginateQuery,
  ): Promise<Paginated<StatEntity>> {
    const queryBuilder = this.statsRepository
      .createQueryBuilder('stat')
      .where('stat.mapId = :mapId', { mapId });

    return paginate(query, queryBuilder, STATS_PAGINATION_CONFIG);
  }

  findAllForUser(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<StatEntity>> {
    const queryBuilder = this.statsRepository
      .createQueryBuilder('stat')
      .where('stat.userId = :userId', { userId });

    return paginate(query, queryBuilder, STATS_PAGINATION_CONFIG);
  }

  // Days and years are pinned to UTC so the buckets stay the same whatever
  // time zone the database session runs in
  async findActivityForUser(
    userId: number,
    type: ActivityType,
    year?: number,
  ): Promise<{
    year: number;
    years: number[];
    days: { day: string; count: number }[];
  }> {
    const years = await this.findActivityYears(userId, type);
    // An unknown year (a filter without records that year) falls back to the
    // most recent one the player has
    const selected =
      year !== undefined && years.includes(year)
        ? year
        : (years[0] ?? new Date().getUTCFullYear());

    const queryBuilder = this.activityQuery(userId, type)
      .select(
        "to_char(to_timestamp(stat.recordDate / 1000) AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
        'day',
      )
      .addSelect('COUNT(*)', 'count')
      .andWhere(
        "EXTRACT(YEAR FROM to_timestamp(stat.recordDate / 1000) AT TIME ZONE 'UTC') = :year",
        { year: selected },
      )
      .groupBy('day')
      .orderBy('day', 'ASC');

    const rows = await queryBuilder.getRawMany<{
      day: string;
      count: string;
    }>();

    return {
      year: selected,
      years,
      days: rows.map((row) => ({ day: row.day, count: Number(row.count) })),
    };
  }

  private async findActivityYears(
    userId: number,
    type: ActivityType,
  ): Promise<number[]> {
    const rows = await this.activityQuery(userId, type)
      .select(
        "EXTRACT(YEAR FROM to_timestamp(stat.recordDate / 1000) AT TIME ZONE 'UTC')::int",
        'year',
      )
      .distinct(true)
      .orderBy('year', 'DESC')
      .getRawMany<{ year: number }>();

    return rows.map((row) => Number(row.year));
  }

  private activityQuery(userId: number, type: ActivityType) {
    const queryBuilder = this.statsRepository
      .createQueryBuilder('stat')
      .where('stat.userId = :userId', { userId })
      .andWhere('stat.recordDate IS NOT NULL');

    const position = ACTIVITY_POSITION[type];

    if (position !== undefined) {
      queryBuilder.andWhere('stat.position = :position', { position });
    }

    return queryBuilder;
  }
}
