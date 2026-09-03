import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import {
  DEFAULT_LIMIT,
  DEFAULT_MAX_LIMIT,
} from '@api/shared/pagination/pagination.constants';
import { UserEntity } from './user.entity';

export const USERS_PAGINATION_CONFIG: PaginateConfig<UserEntity> = {
  sortableColumns: [
    'id',
    'username',
    'uniqueCaps',
    'hardest',
    'gold',
    'mapsCreated',
  ],
  searchableColumns: ['username'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {},
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
