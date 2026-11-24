import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  API_PREFIX: Joi.string()
    .default('api/v1'),

  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:3002'),

  ADMIN_URL: Joi.string()
    .uri()
    .default('http://localhost:3001'),

  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required(),

  OTP_PROVIDER: Joi.string()
    .valid('development')
    .default('development'),

  OTP_TTL_MINUTES: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(5),
});