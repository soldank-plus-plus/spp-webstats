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
};

const DEFAULTS: Partial<ConfigType> = {
  NODE_ENV: Environment.DEVELOPMENT,
  THROTTLER_TTL_SECONDS: 60,
  THROTTLER_LIMIT: 120,
};

// a development run reloads the same routes far more often than a visitor
// browsing the site does, and being throttled locally only ever reads as a
// broken frontend
const DEVELOPMENT_THROTTLER_LIMIT = 300;

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
});
