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
}
