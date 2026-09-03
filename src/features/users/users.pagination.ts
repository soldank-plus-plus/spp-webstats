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
  // medal columns are nullable, and Postgres orders NULLs first on DESC
  nullSort: 'last',
  filterableColumns: {},
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};

// Clan rosters and country listings read as rankings, so they lead with the
// best players rather than with whoever registered first
export const RANKED_USERS_PAGINATION_CONFIG: PaginateConfig<UserEntity> = {
  ...USERS_PAGINATION_CONFIG,
  defaultSortBy: [['uniqueCaps', 'DESC']],
};
