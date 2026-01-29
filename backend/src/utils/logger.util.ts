// ==============================|| LOGGER UTILITY ||============================== //
// Winston logger configuration for consistent logging across the application

import winston from 'winston';
import { environmentConfig, isProductionEnvironment } from '../config/environment.config';

// ==============================|| LOG FORMAT CONFIGURATION ||============================== //

const logFormatForDevelopment = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...additionalMetadata } = info;
    const metadataString = Object.keys(additionalMetadata).length ? `\n${JSON.stringify(additionalMetadata, null, 2)}` : '';
    return `[${timestamp as string}] ${level}: ${message as string}${metadataString}`;
  })
);

const logFormatForProduction = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.json()
);

// ==============================|| CREATE LOGGER INSTANCE ||============================== //

export const applicationLogger = winston.createLogger({
  level: isProductionEnvironment ? 'info' : 'debug',
  format: isProductionEnvironment ? logFormatForProduction : logFormatForDevelopment,
  defaultMeta: {
    service: 'auction-backend',
    environment: environmentConfig.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// ==============================|| LOGGER WRAPPER FUNCTIONS ||============================== //
// Provides a cleaner API for logging with context

export function logInfoMessage(messageToLog: string, additionalContext?: Record<string, unknown>): void {
  applicationLogger.info(messageToLog, additionalContext);
}

export function logErrorMessage(messageToLog: string, errorObject?: Error | unknown, additionalContext?: Record<string, unknown>): void {
  const errorDetails =
    errorObject instanceof Error
      ? {
          errorName: errorObject.name,
          errorMessage: errorObject.message,
          errorStack: errorObject.stack
        }
      : { errorDetails: errorObject };

  applicationLogger.error(messageToLog, { ...errorDetails, ...additionalContext });
}

export function logWarningMessage(messageToLog: string, additionalContext?: Record<string, unknown>): void {
  applicationLogger.warn(messageToLog, additionalContext);
}

export function logDebugMessage(messageToLog: string, additionalContext?: Record<string, unknown>): void {
  applicationLogger.debug(messageToLog, additionalContext);
}

// ==============================|| SPECIALIZED LOGGERS ||============================== //
// Loggers for specific areas of the application

export function logAuthenticationEvent(
  eventType: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'TOKEN_REFRESH' | 'TOKEN_BLACKLIST',
  userId: string | null,
  additionalInfo?: Record<string, unknown>
): void {
  logInfoMessage(`Authentication event: ${eventType}`, {
    eventType,
    userId,
    ...additionalInfo
  });
}

export function logBidProcessingEvent(
  eventType: 'BID_RECEIVED' | 'BID_PROCESSED' | 'BID_FAILED' | 'LOCK_ACQUIRED' | 'LOCK_RELEASED',
  auctionItemId: string,
  userId: string,
  additionalInfo?: Record<string, unknown>
): void {
  logInfoMessage(`Bid processing event: ${eventType}`, {
    eventType,
    auctionItemId,
    userId,
    ...additionalInfo
  });
}

export function logSocketEvent(eventType: string, socketId: string, userId?: string, additionalInfo?: Record<string, unknown>): void {
  logDebugMessage(`Socket event: ${eventType}`, {
    eventType,
    socketId,
    userId,
    ...additionalInfo
  });
}

export default applicationLogger;
