import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import {
  DEFAULT_LIMIT,
  DEFAULT_MAX_LIMIT,
} from '@api/shared/pagination/pagination.constants';
import { CountryEntity } from './country.entity';

export const COUNTRIES_PAGINATION_CONFIG: PaginateConfig<CountryEntity> = {
  sortableColumns: ['id', 'countryname', 'uniqueCaps', 'hardest', 'gold'],
  searchableColumns: ['countryname'],
  defaultSortBy: [['countryname', 'ASC']],
  filterableColumns: {},
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
