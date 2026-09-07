import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { PositionEntity } from './position.entity';
import { POSITIONS_PAGINATION_CONFIG } from './positions.pagination';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly positionsRepository: Repository<PositionEntity>,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<PositionEntity>> {
    return paginate(
      query,
      this.positionsRepository,
      POSITIONS_PAGINATION_CONFIG,
    );
  }

  findAllForMap(
    mapId: number,
    query: PaginateQuery,
  ): Promise<Paginated<PositionEntity>> {
    const queryBuilder = this.positionsRepository
      .createQueryBuilder('position')
      .where('position.mapId = :mapId', { mapId });

    return paginate(query, queryBuilder, POSITIONS_PAGINATION_CONFIG);
  }

  findAllForUser(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<PositionEntity>> {
    const queryBuilder = this.positionsRepository
      .createQueryBuilder('position')
      .where('position.userId = :userId', { userId });

    return paginate(query, queryBuilder, POSITIONS_PAGINATION_CONFIG);
  }
}
