import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT } from '@api/pagination.constants';
import { StatEntity } from './stat.entity';

export const STATS_PAGINATION_CONFIG: PaginateConfig<StatEntity> = {
  relations: ['map', 'user'],
  sortableColumns: ['id', 'position', 'recordTime', 'recordDate'],
  searchableColumns: ['user.username', 'map.mapname'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {
    mapId: true,
    userId: true,
    status: true,
  },
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
