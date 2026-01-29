// ==============================|| GLOBAL ERROR HANDLER MIDDLEWARE ||============================== //
// Catches and handles all unhandled errors in the application

import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS_INTERNAL_SERVER_ERROR, SERVER_ERROR_INTERNAL, getErrorMessageFromCode } from '../constants/error-codes.constants';
import { logErrorMessage } from '../utils/logger.util';
import { isProductionEnvironment } from '../config/environment.config';

// ==============================|| CUSTOM ERROR CLASS ||============================== //

export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS_INTERNAL_SERVER_ERROR,
    errorCode: string = SERVER_ERROR_INTERNAL,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where the error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==============================|| ERROR RESPONSE INTERFACE ||============================== //

interface ErrorResponseBody {
  success: false;
  errorCode: string;
  errorMessage: string;
  stack?: string;
}

// ==============================|| EXTENDED REQUEST TYPE ||============================== //

interface RequestWithAuthenticatedUser extends Request {
  authenticatedUser?: {
    userId: string;
    userEmail: string;
    userFullName: string;
    username: string;
  };
}

// ==============================|| GLOBAL ERROR HANDLER ||============================== //

export function globalErrorHandlerMiddleware(
  error: Error | ApplicationError,
  request: Request,
  response: Response,
  _nextMiddleware: NextFunction
): void {
  // Cast request to include authenticated user
  const authenticatedRequest = request as RequestWithAuthenticatedUser;

  // Log the error
  logErrorMessage('Unhandled error caught by global handler', error, {
    path: request.path,
    method: request.method,
    userId: authenticatedRequest.authenticatedUser?.userId
  });

  // Determine if this is an operational error
  const isApplicationError = error instanceof ApplicationError;
  const statusCode = isApplicationError ? error.statusCode : HTTP_STATUS_INTERNAL_SERVER_ERROR;
  const errorCode = isApplicationError ? error.errorCode : SERVER_ERROR_INTERNAL;

  // Build response body
  const responseBody: ErrorResponseBody = {
    success: false,
    errorCode,
    errorMessage: isApplicationError ? error.message : getErrorMessageFromCode(SERVER_ERROR_INTERNAL)
  };

  // Include stack trace in development
  if (!isProductionEnvironment) {
    responseBody.stack = error.stack;
  }

  response.status(statusCode).json(responseBody);
}

// ==============================|| NOT FOUND HANDLER ||============================== //

export function notFoundHandlerMiddleware(request: Request, response: Response, _nextMiddleware: NextFunction): void {
  response.status(404).json({
    success: false,
    errorCode: 'ROUTE_NOT_FOUND',
    errorMessage: `Route ${request.method} ${request.path} not found`
  });
}

// ==============================|| ASYNC HANDLER WRAPPER ||============================== //
// Wraps async route handlers to catch errors and pass them to error middleware

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function wrapAsyncRouteHandler(handler: AsyncRequestHandler): AsyncRequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
