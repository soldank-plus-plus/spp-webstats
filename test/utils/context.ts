import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { createTestApp, getDataSource } from './app';
import { truncateAll } from './database';

export type TestContext = {
  app: NestExpressApplication;
  dataSource: DataSource;
};

// One application per suite file, an empty database per test. The context is
// handed back before the hooks have run, so read its fields inside a test
export const setupTestContext = (): TestContext => {
  const context = {} as TestContext;

  beforeAll(async () => {
    context.app = await createTestApp();
    context.dataSource = getDataSource(context.app);
  });

  beforeEach(async () => {
    await truncateAll(context.dataSource);
  });

  afterAll(async () => {
    await context.app?.close();
  });

  return context;
};
