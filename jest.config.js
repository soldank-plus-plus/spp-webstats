// Two suites: unit specs live next to the code under src and need nothing but
// node, everything under test/ talks to the throwaway Postgres from
// docker-compose.test.yml. Coverage is collected over both, because most of the
// controllers and services are only meaningfully exercised through HTTP.
// Both projects share the repo root, so the coverage globs resolve the same way
// for each of them.
const unit = {
  displayName: 'unit',
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/$1',
  },
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
};

module.exports = {
  projects: [unit, '<rootDir>/test/jest-e2e.json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    // the composition root: it builds the app, reads the port and calls listen.
    // Everything it wires lives in app.setup.ts, which the e2e suites drive
    '!src/main.ts',
    // schema history and the typeorm cli entrypoint, run by the migration
    // scripts and by the test global setup rather than by the app
    '!src/database/migrations/**',
    '!src/database/data-source.ts',
    // developer convenience script for seeding a local database
    '!src/database/fixtures/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'text', 'lcov', 'json'],
  // set just under what the suites reach today, so a drop fails the run rather
  // than going unnoticed
  coverageThreshold: {
    global: {
      statements: 99,
      branches: 93,
      functions: 99,
      lines: 99,
    },
  },
};
