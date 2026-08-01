import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT } from '@api/pagination.constants';
import { MapEntity } from './map.entity';

export const MAPS_PAGINATION_CONFIG: PaginateConfig<MapEntity> = {
  sortableColumns: ['id', 'mapname', 'date'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {
    mapname: true,
    date: true,
  },
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
