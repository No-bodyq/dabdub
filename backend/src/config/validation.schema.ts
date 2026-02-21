import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4000),
  DEBUG: Joi.boolean().default(false),

  // Database Configuration
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().default('dabdub_dev'),
  DB_POOL_SIZE: Joi.number().default(10),

  // Blockchain Configuration
  RPC_ENDPOINT: Joi.string().allow('').default(''),
  SETTLEMENT_PRIVATE_KEY: Joi.string().allow('').default(''),
  CHAIN_ID: Joi.number().optional(),

  // API Configuration
  JWT_SECRET: Joi.string().allow('').default(''),
  JWT_EXPIRY: Joi.string().default('24h'),

  // Optional fields
  DATABASE_URL: Joi.string().allow('').optional(),
})
  .unknown(true)
  .required();
