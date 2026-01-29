// ==============================|| ENVIRONMENT CONFIGURATION ||============================== //
// Validates and exports all environment variables using Zod schema validation

import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// ==============================|| ENVIRONMENT SCHEMA ||============================== //
// Defines the expected shape and validation rules for environment variables

const environmentVariablesSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').describe('PostgreSQL connection string'),

  // Redis Configuration
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').describe('Redis connection string'),

  // JWT Configuration
  JWT_SECRET_KEY: z
    .string()
    .min(32, 'JWT_SECRET_KEY must be at least 32 characters for security')
    .describe('Secret key for signing JWT tokens'),

  JWT_EXPIRATION_TIME_IN_HOURS: z
    .string()
    .default('24')
    .transform((valueAsString) => parseInt(valueAsString, 10))
    .refine((value) => value >= 1 && value <= 168, 'Must be between 1 and 168 hours')
    .describe('JWT token expiration time in hours'),

  // Server Configuration
  PORT: z
    .string()
    .default('3010')
    .transform((valueAsString) => parseInt(valueAsString, 10))
    .refine((value) => value >= 1024 && value <= 65535, 'Must be a valid port')
    .describe('Server port number'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development').describe('Node environment'),

  // CORS Configuration
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required').describe('Allowed CORS origin'),

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_IN_MINUTES: z
    .string()
    .default('15')
    .transform((valueAsString) => parseInt(valueAsString, 10))
    .refine((value) => value >= 1 && value <= 60, 'Must be between 1 and 60 minutes')
    .describe('Rate limit window in minutes'),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform((valueAsString) => parseInt(valueAsString, 10))
    .refine((value) => value >= 1 && value <= 1000, 'Must be between 1 and 1000 requests')
    .describe('Maximum requests per window')
});

// ==============================|| VALIDATE ENVIRONMENT VARIABLES ||============================== //

function validateAndParseEnvironmentVariables() {
  const validationResult = environmentVariablesSchema.safeParse(process.env);

  if (!validationResult.success) {
    const formattedErrors = validationResult.error.format();
    console.error('Environment validation failed:');
    console.error(JSON.stringify(formattedErrors, null, 2));
    throw new Error('Invalid environment configuration. Check the errors above.');
  }

  return validationResult.data;
}

// ==============================|| EXPORTED CONFIGURATION ||============================== //

export const environmentConfig = validateAndParseEnvironmentVariables();

// Type export for use in other files
export type EnvironmentConfigType = z.infer<typeof environmentVariablesSchema>;

// Convenience exports for commonly used values
export const isProductionEnvironment = environmentConfig.NODE_ENV === 'production';
export const isDevelopmentEnvironment = environmentConfig.NODE_ENV === 'development';
export const isTestEnvironment = environmentConfig.NODE_ENV === 'test';
