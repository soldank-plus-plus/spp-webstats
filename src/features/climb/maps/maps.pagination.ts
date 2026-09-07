import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import {
  DEFAULT_LIMIT,
  DEFAULT_MAX_LIMIT,
} from '@api/shared/pagination/pagination.constants';
import { MapEntity } from './map.entity';

export const MAPS_PAGINATION_CONFIG: PaginateConfig<MapEntity> = {
  sortableColumns: ['id', 'mapname', 'date', 'hardest'],
  searchableColumns: ['mapname'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {
    mapname: true,
    date: true,
    // Ranked maps carry a difficulty, the rest sit at 0
    hardest: true,
    // Climb mode flags, stored as 0 or 1 per map
    anticoop: true,
    jets: true,
    m79: true,
    nade: true,
    switch: true,
    coop: true,
    m79c: true,
  },
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
