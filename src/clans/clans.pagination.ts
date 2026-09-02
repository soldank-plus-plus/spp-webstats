import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT } from '@api/pagination.constants';
import { ClanEntity } from './clan.entity';

export const CLANS_PAGINATION_CONFIG: PaginateConfig<ClanEntity> = {
  sortableColumns: ['id', 'clanname', 'uniqueCaps', 'hardest', 'gold'],
  searchableColumns: ['clanname', 'tag'],
  defaultSortBy: [['id', 'ASC']],
  filterableColumns: {},
  maxLimit: DEFAULT_MAX_LIMIT,
  defaultLimit: DEFAULT_LIMIT,
  paginationType: PaginationType.LIMIT_AND_OFFSET,
};
