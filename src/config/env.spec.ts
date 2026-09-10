import { HEAVY_ENDPOINT_LIMIT } from '@api/shared/throttling/throttling.constants';
import { configValidationSchema } from './env';
import { Environment } from './types';

const DATABASE_ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'spp',
  DB_LOCAL_ROOT_PASSWORD: 'postgres',
};

const validate = (env: Record<string, string>) =>
  configValidationSchema.validate({ ...DATABASE_ENV, ...env });

describe('throttler configuration', () => {
  it('defaults production to the stricter limit', () => {
    const { error, value } = validate({ NODE_ENV: Environment.PRODUCTION });

    expect(error).toBeUndefined();
    expect(value.THROTTLER_TTL_SECONDS).toBe(60);
    expect(value.THROTTLER_LIMIT).toBe(120);
  });

  it('leaves development more room', () => {
    const { value } = validate({ NODE_ENV: Environment.DEVELOPMENT });

    expect(value.THROTTLER_LIMIT).toBe(300);
  });

  it('hands the overrides over as numbers', () => {
    const { value } = validate({
      NODE_ENV: Environment.PRODUCTION,
      THROTTLER_TTL_SECONDS: '30',
      THROTTLER_LIMIT: '60',
    });

    expect(value.THROTTLER_TTL_SECONDS).toBe(30);
    expect(value.THROTTLER_LIMIT).toBe(60);
  });

  it.each(['0', '-1', '1.5', 'abc'])('rejects a limit of %p', (limit) => {
    const { error } = validate({
      NODE_ENV: Environment.PRODUCTION,
      THROTTLER_LIMIT: limit,
    });

    expect(error?.message).toContain('THROTTLER_LIMIT');
  });

  it.each(['0', '-1', '1.5', 'abc'])('rejects a ttl of %p', (ttl) => {
    const { error } = validate({
      NODE_ENV: Environment.PRODUCTION,
      THROTTLER_TTL_SECONDS: ttl,
    });

    expect(error?.message).toContain('THROTTLER_TTL_SECONDS');
  });

  it('keeps the heavy endpoint limit under the global one', () => {
    const { value } = validate({ NODE_ENV: Environment.PRODUCTION });

    expect(HEAVY_ENDPOINT_LIMIT).toBeLessThan(value.THROTTLER_LIMIT);
  });
});
