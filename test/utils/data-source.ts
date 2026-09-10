import { DataSource } from 'typeorm';

const TEST_DATABASE_SUFFIX = '_test';

// Everything here drops and truncates, so nothing is allowed to run before the
// target has been recognised as a throwaway database. A misconfigured DB_DATABASE
// then fails loudly instead of emptying the database someone develops against
export const assertTestDatabase = (): string => {
  const database = process.env.DB_DATABASE;

  if (!database?.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(
      `Refusing to run destructive test setup against "${database ?? '(unset)'}". ` +
        `The test database name has to end with "${TEST_DATABASE_SUFFIX}", ` +
        'check that .env.test is loaded.',
    );
  }

  return database;
};

// Only ever used to build the schema, so it carries the migrations rather than
// the entities. The app under test brings its own connection through AppModule
export const createTestDataSource = (): DataSource =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: assertTestDatabase(),
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
    logging: false,
  });
