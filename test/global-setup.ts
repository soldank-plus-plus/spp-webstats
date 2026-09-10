import './setup-env';
import { createTestDataSource } from './utils/data-source';

// Rebuilds the test schema from the migrations before the suites start, so the
// database they run against is the one production gets, not one derived from
// the entities by synchronize
export default async (): Promise<void> => {
  const dataSource = createTestDataSource();

  await dataSource.initialize();

  try {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
};
