// ==============================|| PRISMA CLIENT CONFIGURATION ||============================== //
// Singleton pattern for Prisma client to prevent multiple connections in development

import { PrismaClient } from '@prisma/client';
import { isDevelopmentEnvironment } from './environment.config';

// ==============================|| GLOBAL PRISMA TYPE ||============================== //
// Extends global namespace to hold Prisma instance

declare global {
  // eslint-disable-next-line no-var
  var prismaClientSingletonInstance: PrismaClient | undefined;
}

// ==============================|| CREATE PRISMA CLIENT ||============================== //
// Creates a new Prisma client with logging configuration

function createPrismaClientInstance(): PrismaClient {
  const prismaClientInstance = new PrismaClient({
    log: isDevelopmentEnvironment ? ['query', 'info', 'warn', 'error'] : ['error']
  });

  return prismaClientInstance;
}

// ==============================|| SINGLETON PRISMA CLIENT ||============================== //
// Uses global variable in development to prevent hot-reload connection issues

export const prismaClient: PrismaClient = global.prismaClientSingletonInstance || createPrismaClientInstance();

if (isDevelopmentEnvironment) {
  global.prismaClientSingletonInstance = prismaClient;
}

// ==============================|| CONNECTION MANAGEMENT ||============================== //
// Functions to manage database connection lifecycle

export async function connectToDatabaseWithPrisma(): Promise<void> {
  try {
    await prismaClient.$connect();
    console.log('Successfully connected to PostgreSQL database via Prisma');
  } catch (connectionError) {
    console.error('Failed to connect to PostgreSQL database:', connectionError);
    throw connectionError;
  }
}

export async function disconnectFromDatabaseWithPrisma(): Promise<void> {
  try {
    await prismaClient.$disconnect();
    console.log('Successfully disconnected from PostgreSQL database');
  } catch (disconnectionError) {
    console.error('Failed to disconnect from PostgreSQL database:', disconnectionError);
    throw disconnectionError;
  }
}

export default prismaClient;
