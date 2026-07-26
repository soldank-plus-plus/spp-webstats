import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { EventEntity } from './event.entity';

export const EVENTS_PAGINATION_CONFIG: PaginateConfig<EventEntity> = {
  sortableColumns: ['id', 'type', 'medal', 'eventDate'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {
    type: true,
    medal: true,
    eventDate: true,
  },
  maxLimit: 100,
  defaultLimit: 20,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
