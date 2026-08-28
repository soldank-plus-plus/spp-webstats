import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { StatEntity } from './stat.entity';
import { STATS_PAGINATION_CONFIG } from './stats.pagination';

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
}
