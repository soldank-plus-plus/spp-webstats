import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT } from '@api/pagination.constants';
import { EventEntity } from './event.entity';

export const EVENTS_PAGINATION_CONFIG: PaginateConfig<EventEntity> = {
  relations: ['map', 'user'],
  sortableColumns: ['id', 'type', 'medal', 'eventDate'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {
    type: true,
    medal: true,
    eventDate: true,
  },
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
