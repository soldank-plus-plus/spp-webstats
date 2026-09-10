import { PaginateQuery } from 'nestjs-paginate';

// nestjs-paginate always wants a path, nothing else about the query is required
export const paginateQuery = (
  query: Partial<PaginateQuery> = {},
): PaginateQuery => ({ path: '', ...query });
