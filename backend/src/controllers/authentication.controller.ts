// ==============================|| AUTHENTICATION CONTROLLER ||============================== //
// Handles HTTP requests for authentication endpoints

import { Request, Response } from 'express';
import {
  registerNewUserAccount,
  loginUserWithCredentials,
  logoutUserAndBlacklistToken,
  fetchUserProfileById
} from '../services/authentication.service';
import { AuthenticatedRequest } from '../middleware/authentication.middleware';
import { HTTP_STATUS_OK, HTTP_STATUS_CREATED, HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_UNAUTHORIZED } from '../constants/error-codes.constants';
import { logInfoMessage, logErrorMessage } from '../utils/logger.util';

// ==============================|| REGISTER USER ||============================== //

export async function handleUserRegistrationRequest(request: Request, response: Response): Promise<void> {
  try {
    const { email, username, fullName, password } = request.body;

    // Validate required fields
    if (!email || !username || !fullName || !password) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Email, username, full name, and password are required'
      });
      return;
    }

    const registrationResult = await registerNewUserAccount(email, username, fullName, password);

    if (!registrationResult.wasRegistrationSuccessful) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: registrationResult.errorCode,
        errorMessage: registrationResult.errorMessage
      });
      return;
    }

    logInfoMessage('User registered successfully', { userId: registrationResult.userProfile?.userId });

    response.status(HTTP_STATUS_CREATED).json({
      success: true,
      data: {
        serviceToken: registrationResult.jwtToken,
        user: {
          id: registrationResult.userProfile?.userId,
          email: registrationResult.userProfile?.emailAddress,
          name: registrationResult.userProfile?.fullName,
          avatar: registrationResult.userProfile?.avatarUrl,
          role: 'user'
        }
      }
    });
  } catch (error) {
    logErrorMessage('Error in user registration controller', error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'An unexpected error occurred during registration'
    });
  }
}

// ==============================|| LOGIN USER ||============================== //

export async function handleUserLoginRequest(request: Request, response: Response): Promise<void> {
  try {
    const { email, password } = request.body;

    // Validate required fields
    if (!email || !password) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Email/username and password are required'
      });
      return;
    }

    const loginResult = await loginUserWithCredentials(email, password);

    if (!loginResult.wasLoginSuccessful) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: loginResult.errorCode,
        errorMessage: loginResult.errorMessage
      });
      return;
    }

    logInfoMessage('User logged in successfully', { userId: loginResult.userProfile?.userId });

    response.status(HTTP_STATUS_OK).json({
      success: true,
      data: {
        serviceToken: loginResult.jwtToken,
        user: {
          id: loginResult.userProfile?.userId,
          email: loginResult.userProfile?.emailAddress,
          name: loginResult.userProfile?.fullName,
          avatar: loginResult.userProfile?.avatarUrl,
          role: 'user'
        }
      }
    });
  } catch (error) {
    logErrorMessage('Error in user login controller', error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'An unexpected error occurred during login'
    });
  }
}

// ==============================|| LOGOUT USER ||============================== //

export async function handleUserLogoutRequest(request: AuthenticatedRequest, response: Response): Promise<void> {
  try {
    const authenticatedUser = request.authenticatedUser;
    const jwtToken = request.jwtToken;

    if (!authenticatedUser || !jwtToken) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: 'AUTH_ERROR',
        errorMessage: 'Not authenticated'
      });
      return;
    }

    const logoutResult = await logoutUserAndBlacklistToken(jwtToken, authenticatedUser.userId);

    if (!logoutResult.wasLogoutSuccessful) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: 'LOGOUT_ERROR',
        errorMessage: logoutResult.errorMessage
      });
      return;
    }

    logInfoMessage('User logged out successfully', { userId: authenticatedUser.userId });

    response.status(HTTP_STATUS_OK).json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    logErrorMessage('Error in user logout controller', error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'An unexpected error occurred during logout'
    });
  }
}

// ==============================|| GET CURRENT USER ||============================== //

export async function handleGetCurrentUserRequest(request: AuthenticatedRequest, response: Response): Promise<void> {
  try {
    const authenticatedUser = request.authenticatedUser;

    if (!authenticatedUser) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: 'AUTH_ERROR',
        errorMessage: 'Not authenticated'
      });
      return;
    }

    const userProfile = await fetchUserProfileById(authenticatedUser.userId);

    if (!userProfile) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        errorMessage: 'User not found'
      });
      return;
    }

    response.status(HTTP_STATUS_OK).json({
      success: true,
      data: {
        user: {
          id: userProfile.userId,
          email: userProfile.emailAddress,
          name: userProfile.fullName,
          avatar: userProfile.avatarUrl,
          role: 'user'
        }
      }
    });
  } catch (error) {
    logErrorMessage('Error in get current user controller', error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'An unexpected error occurred'
    });
  }
}
