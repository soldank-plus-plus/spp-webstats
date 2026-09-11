import Joi, { ObjectSchema } from 'joi';

import { Environment } from '@api/config/types';

export type ConfigType = {
  NODE_ENV: string;

  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_LOCAL_ROOT_PASSWORD?: string;

  THROTTLER_TTL_SECONDS: number;
  THROTTLER_LIMIT: number;

  CORS_ORIGINS: string;
};

const DEFAULTS: Partial<ConfigType> = {
  NODE_ENV: Environment.DEVELOPMENT,
  THROTTLER_TTL_SECONDS: 60,
  THROTTLER_LIMIT: 120,
  CORS_ORIGINS: 'https://soldankpp.app',
};

// a development run reloads the same routes far more often than a visitor
// browsing the site does, and being throttled locally only ever reads as a
// broken frontend
const DEVELOPMENT_THROTTLER_LIMIT = 300;

// where the frontend runs with `npm run dev`
const DEVELOPMENT_CORS_ORIGINS = 'http://localhost:5173';

// a trailing slash or a path never matches an Origin header, so it is refused
// at startup instead of silently blocking the frontend
const ORIGIN_PATTERN = /^https?:\/\/[^/\s]+$/;

const originList = Joi.string().custom((value: string, helpers) => {
  const origins = value.split(',').map((origin) => origin.trim());

  if (origins.some((origin) => !ORIGIN_PATTERN.test(origin))) {
    return helpers.error('any.invalid');
  }

  return origins.join(',');
});

export const configValidationSchema: ObjectSchema<ConfigType> = Joi.object({
  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .default(DEFAULTS.NODE_ENV),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_LOCAL_ROOT_PASSWORD: Joi.when('NODE_ENV', {
    is: Environment.DEVELOPMENT,
    then: Joi.string().required(),
    otherwise: Joi.string().optional().empty(''),
  }),

  THROTTLER_TTL_SECONDS: Joi.number()
    .integer()
    .positive()
    .default(DEFAULTS.THROTTLER_TTL_SECONDS),
  THROTTLER_LIMIT: Joi.number()
    .integer()
    .positive()
    .when('NODE_ENV', {
      is: Environment.DEVELOPMENT,
      then: Joi.number().default(DEVELOPMENT_THROTTLER_LIMIT),
      otherwise: Joi.number().default(DEFAULTS.THROTTLER_LIMIT),
    }),

  CORS_ORIGINS: originList.when('NODE_ENV', {
    is: Environment.DEVELOPMENT,
    then: Joi.string().default(DEVELOPMENT_CORS_ORIGINS),
    otherwise: Joi.string().default(DEFAULTS.CORS_ORIGINS),
  }),
});
