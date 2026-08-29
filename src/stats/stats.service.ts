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

  async findActivityForUser(
    userId: number,
    type: ActivityType,
  ): Promise<{ day: string; count: number }[]> {
    const queryBuilder = this.statsRepository
      .createQueryBuilder('stat')
      .select(
        "to_char(to_timestamp(stat.recordDate / 1000), 'YYYY-MM-DD')",
        'day',
      )
      .addSelect('COUNT(*)', 'count')
      .where('stat.userId = :userId', { userId })
      .andWhere('stat.recordDate IS NOT NULL')
      .groupBy('day')
      .orderBy('day', 'ASC');

    const position = ACTIVITY_POSITION[type];

    if (position !== undefined) {
      queryBuilder.andWhere('stat.position = :position', { position });
    }

    const rows = await queryBuilder.getRawMany<{
      day: string;
      count: string;
    }>();

    return rows.map((row) => ({ day: row.day, count: Number(row.count) }));
  }
}
