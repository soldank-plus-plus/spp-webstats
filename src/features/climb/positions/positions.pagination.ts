import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import {
  DEFAULT_LIMIT,
  DEFAULT_MAX_LIMIT,
} from '@api/shared/pagination/pagination.constants';
import { PositionEntity } from './position.entity';

export const POSITIONS_PAGINATION_CONFIG: PaginateConfig<PositionEntity> = {
  relations: ['map', 'user'],
  sortableColumns: ['id', 'type', 'medal', 'positionDate'],
  searchableColumns: ['user.username', 'map.mapname'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {
    type: true,
    medal: true,
    positionDate: true,
  },
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
