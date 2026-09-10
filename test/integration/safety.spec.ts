import { assertTestDatabase } from '../utils/data-source';
import { truncateAll } from '../utils/database';

// The suites drop the schema and truncate every table, so the guard in front of
// that is the thing standing between a misconfigured DB_DATABASE and the
// database someone develops against
describe('test database guard', () => {
  const original = process.env.DB_DATABASE;

  afterEach(() => {
    process.env.DB_DATABASE = original;
  });

  it('accepts the throwaway database the suites are pointed at', () => {
    expect(assertTestDatabase()).toBe(original);
    expect(original).toMatch(/_test$/);
  });

  it.each(['spp', 'webstats', 'production', 'test_webstats'])(
    'refuses to touch %p',
    (database) => {
      process.env.DB_DATABASE = database;

      expect(() => assertTestDatabase()).toThrow(/Refusing to run/);
    },
  );

  it('refuses to run when no database is configured at all', () => {
    delete process.env.DB_DATABASE;

    expect(() => assertTestDatabase()).toThrow(/Refusing to run/);
  });

  it('refuses to truncate anything outside a test database', async () => {
    process.env.DB_DATABASE = 'spp';

    const dataSource = {
      query: jest.fn(),
    } as unknown as Parameters<typeof truncateAll>[0];

    await expect(truncateAll(dataSource)).rejects.toThrow(/Refusing to run/);
    expect(dataSource.query).not.toHaveBeenCalled();
  });
});
