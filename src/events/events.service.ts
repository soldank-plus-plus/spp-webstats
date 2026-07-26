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
}
