import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Jest pins NODE_ENV to "test" before anything else runs, and the app only
// knows development and production, so the value .env.test carries has to be
// the one that survives
delete process.env.NODE_ENV;

// Loaded before anything imports the app, so ConfigModule (which never
// overwrites a variable that is already set) picks the test database up
// instead of the one in .env
dotenv.config({ path: resolve(__dirname, '..', '.env.test') });
