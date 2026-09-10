import request from 'supertest';
import {
  DEFAULT_LIMIT,
  DEFAULT_MAX_LIMIT,
} from '@api/shared/pagination/pagination.constants';
import { setupTestContext } from '../utils/context';
import { createUser } from '../factories';

const usernames = (data: { username: string }[]) =>
  data.map((user) => user.username);

describe('pagination contract', () => {
  const context = setupTestContext();
  const get = (path: string) => request(context.app.getHttpServer()).get(path);

  const seedUsers = async (count: number) => {
    for (let index = 1; index <= count; index++) {
      await createUser(context.dataSource, {
        username: `user${String(index).padStart(2, '0')}`,
      });
    }
  };

  it('describes the page it returned', async () => {
    await seedUsers(3);

    const { body } = await get('/climb/users').expect(200);

    expect(body.meta).toEqual({
      itemsPerPage: DEFAULT_LIMIT,
      totalItems: 3,
      currentPage: 1,
      totalPages: 1,
      sortBy: [['id', 'ASC']],
    });
    expect(body.links.current).toContain('/climb/users?page=1');
  });

  it('hands out the first page by default', async () => {
    await seedUsers(5);

    const { body } = await get('/climb/users?limit=2').expect(200);

    expect(usernames(body.data)).toEqual(['user01', 'user02']);
    expect(body.meta).toMatchObject({
      currentPage: 1,
      totalPages: 3,
      itemsPerPage: 2,
    });
  });

  it('walks to a page in the middle', async () => {
    await seedUsers(5);

    const { body } = await get('/climb/users?limit=2&page=2').expect(200);

    expect(usernames(body.data)).toEqual(['user03', 'user04']);
    expect(body.meta.currentPage).toBe(2);
  });

  it('returns the remainder on the last page', async () => {
    await seedUsers(5);

    const { body } = await get('/climb/users?limit=2&page=3').expect(200);

    expect(usernames(body.data)).toEqual(['user05']);
  });

  it('answers an empty page past the end instead of failing', async () => {
    await seedUsers(5);

    const { body } = await get('/climb/users?limit=2&page=99').expect(200);

    expect(body.data).toEqual([]);
    expect(body.meta.totalItems).toBe(5);
  });

  it('links to the neighbouring pages', async () => {
    await seedUsers(5);

    const { body } = await get('/climb/users?limit=2&page=2').expect(200);

    expect(body.links.first).toContain('page=1');
    expect(body.links.previous).toContain('page=1');
    expect(body.links.next).toContain('page=3');
    expect(body.links.last).toContain('page=3');
  });

  it('caps the page size, so nobody can ask for the whole table at once', async () => {
    await seedUsers(3);

    const { body } = await get('/climb/users?limit=100000').expect(200);

    expect(body.meta.itemsPerPage).toBe(DEFAULT_MAX_LIMIT);
    expect(body.links.current).toContain(`limit=${DEFAULT_MAX_LIMIT}`);
  });

  it.each(['0', '-1'])('treats page=%p as the first page', async (page) => {
    await seedUsers(3);

    const { body } = await get(`/climb/users?limit=2&page=${page}`).expect(200);

    expect(usernames(body.data)).toEqual(['user01', 'user02']);
    expect(body.meta.currentPage).toBe(1);
  });

  it('falls back to the default page size when the limit is not a number', async () => {
    await seedUsers(3);

    const { body } = await get('/climb/users?limit=abc').expect(200);

    expect(body.meta.itemsPerPage).toBe(DEFAULT_LIMIT);
  });

  it('ignores a sort on a column that is not sortable', async () => {
    await seedUsers(2);

    const { body } = await get('/climb/users?sortBy=playtime:DESC').expect(200);

    expect(body.meta.sortBy).toEqual([['id', 'ASC']]);
    expect(usernames(body.data)).toEqual(['user01', 'user02']);
  });

  it('ignores a sort direction it does not know', async () => {
    await seedUsers(2);

    const { body } = await get('/climb/users?sortBy=id:SIDEWAYS').expect(200);

    expect(body.meta.sortBy).toEqual([['id', 'ASC']]);
  });

  it('ignores a filter on a column that is not filterable', async () => {
    await seedUsers(2);

    const { body } = await get('/climb/users?filter.playtime=999').expect(200);

    expect(body.meta.totalItems).toBe(2);
  });

  it('reports no pages at all for an empty table', async () => {
    const { body } = await get('/climb/users').expect(200);

    expect(body.meta).toMatchObject({ totalItems: 0, totalPages: 0 });
    expect(body.data).toEqual([]);
  });

  it('paginates a nested listing the same way', async () => {
    const user = await createUser(context.dataSource, { username: 'owner' });

    for (let index = 0; index < 3; index++) {
      await context.dataSource.query(
        'INSERT INTO positions (type, user_id) VALUES (1, $1)',
        [user.id],
      );
    }

    const { body } = await get(
      `/climb/users/${user.id}/positions?limit=2&page=2`,
    ).expect(200);

    expect(body.data).toHaveLength(1);
    expect(body.meta).toMatchObject({ currentPage: 2, totalPages: 2 });
  });
});
