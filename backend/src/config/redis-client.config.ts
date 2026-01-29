// ==============================|| REDIS CLIENT CONFIGURATION ||============================== //
// Singleton pattern for Redis client with connection management

import Redis from 'ioredis';
import { environmentConfig, isDevelopmentEnvironment } from './environment.config';

// ==============================|| GLOBAL REDIS TYPE ||============================== //
// Extends global namespace to hold Redis instance

declare global {
  // eslint-disable-next-line no-var
  var redisClientSingletonInstance: Redis | undefined;
}

// ==============================|| CREATE REDIS CLIENT ||============================== //
// Creates a new Redis client with configuration options

function createRedisClientInstance(): Redis {
  const redisClientInstance = new Redis(environmentConfig.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (timesAttempted: number) => {
      const maximumRetryDelayInMs = 3000;
      const delayInMs = Math.min(timesAttempted * 100, maximumRetryDelayInMs);
      console.log(`Redis connection retry attempt ${timesAttempted}, waiting ${delayInMs}ms`);
      return delayInMs;
    },
    enableReadyCheck: true,
    lazyConnect: false
  });

  // ==============================|| EVENT HANDLERS ||============================== //

  redisClientInstance.on('connect', () => {
    console.log('Redis client is connecting...');
  });

  redisClientInstance.on('ready', () => {
    console.log('Redis client is ready and connected');
  });

  redisClientInstance.on('error', (redisError: Error) => {
    console.error('Redis client encountered an error:', redisError.message);
  });

  redisClientInstance.on('close', () => {
    console.log('Redis connection closed');
  });

  redisClientInstance.on('reconnecting', () => {
    console.log('Redis client is reconnecting...');
  });

  return redisClientInstance;
}

// ==============================|| SINGLETON REDIS CLIENT ||============================== //
// Uses global variable in development to prevent hot-reload connection issues

export const redisClient: Redis = global.redisClientSingletonInstance || createRedisClientInstance();

if (isDevelopmentEnvironment) {
  global.redisClientSingletonInstance = redisClient;
}

// ==============================|| CONNECTION MANAGEMENT ||============================== //
// Functions to manage Redis connection lifecycle

export async function connectToRedisServer(): Promise<void> {
  try {
    const pingResponse = await redisClient.ping();
    if (pingResponse === 'PONG') {
      console.log('Successfully connected to Redis server');
    }
  } catch (connectionError) {
    console.error('Failed to connect to Redis server:', connectionError);
    throw connectionError;
  }
}

export async function disconnectFromRedisServer(): Promise<void> {
  try {
    await redisClient.quit();
    console.log('Successfully disconnected from Redis server');
  } catch (disconnectionError) {
    console.error('Failed to disconnect from Redis server:', disconnectionError);
    throw disconnectionError;
  }
}

// ==============================|| HEALTH CHECK ||============================== //
// Function to check Redis connection health

export async function checkRedisConnectionHealth(): Promise<boolean> {
  try {
    const pingResponse = await redisClient.ping();
    return pingResponse === 'PONG';
  } catch (healthCheckError) {
    console.error('Redis health check failed:', healthCheckError);
    return false;
  }
}

export default redisClient;
