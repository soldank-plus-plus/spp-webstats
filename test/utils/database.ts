import { DataSource } from 'typeorm';
import { assertTestDatabase } from './data-source';

const MIGRATIONS_TABLE = 'migrations';

// Emptied before every test rather than rolled back, so a test never sees a row
// another one wrote and the order they run in cannot matter
export const truncateAll = async (dataSource: DataSource): Promise<void> => {
  assertTestDatabase();

  const tables = await dataSource.query<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> $1`,
    [MIGRATIONS_TABLE],
  );

  if (tables.length === 0) {
    return;
  }

  const list = tables.map(({ tablename }) => `"${tablename}"`).join(', ');

  await dataSource.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
};
