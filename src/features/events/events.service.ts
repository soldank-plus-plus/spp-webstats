import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { EventEntity } from './event.entity';
import { EVENTS_PAGINATION_CONFIG } from './events.pagination';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<EventEntity>> {
    return paginate(query, this.eventsRepository, EVENTS_PAGINATION_CONFIG);
  }

  findAllForMap(
    mapId: number,
    query: PaginateQuery,
  ): Promise<Paginated<EventEntity>> {
    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.mapId = :mapId', { mapId });

    return paginate(query, queryBuilder, EVENTS_PAGINATION_CONFIG);
  }

  findAllForUser(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<EventEntity>> {
    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId });

    return paginate(query, queryBuilder, EVENTS_PAGINATION_CONFIG);
  }
}
