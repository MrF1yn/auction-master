// Authentication HTTP request handlers

import { Request, Response } from "express";
import {
  registerNewUserAccount,
  loginUserWithCredentials,
  logoutUserAndBlacklistToken,
  fetchUserProfileById,
} from "../services/authentication.service";
import { AuthenticatedRequest } from "../middleware/authentication.middleware";
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_UNAUTHORIZED,
} from "../constants/error-codes.constants";
import { logInfoMessage, logErrorMessage } from "../utils/logger.util";

export async function handleUserRegistrationRequest(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const { email, username, fullName, password } = request.body;

    if (!email || !username || !fullName || !password) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: "VALIDATION_ERROR",
        errorMessage: "Email, username, full name, and password are required",
      });
      return;
    }

    const result = await registerNewUserAccount(
      email,
      username,
      fullName,
      password,
    );

    if (!result.wasRegistrationSuccessful) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
      return;
    }

    logInfoMessage("User registered successfully", {
      userId: result.userProfile?.userId,
    });

    response.status(HTTP_STATUS_CREATED).json({
      success: true,
      data: {
        serviceToken: result.jwtToken,
        user: {
          id: result.userProfile?.userId,
          email: result.userProfile?.emailAddress,
          name: result.userProfile?.fullName,
          avatar: result.userProfile?.avatarUrl,
          role: "user",
        },
      },
    });
  } catch (error) {
    logErrorMessage("Error in user registration controller", error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: "SERVER_ERROR",
      errorMessage: "An unexpected error occurred during registration",
    });
  }
}

export async function handleUserLoginRequest(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: "VALIDATION_ERROR",
        errorMessage: "Email/username and password are required",
      });
      return;
    }

    const result = await loginUserWithCredentials(email, password);

    if (!result.wasLoginSuccessful) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
      return;
    }

    logInfoMessage("User logged in successfully", {
      userId: result.userProfile?.userId,
    });

    response.status(HTTP_STATUS_OK).json({
      success: true,
      data: {
        serviceToken: result.jwtToken,
        user: {
          id: result.userProfile?.userId,
          email: result.userProfile?.emailAddress,
          name: result.userProfile?.fullName,
          avatar: result.userProfile?.avatarUrl,
          role: "user",
        },
      },
    });
  } catch (error) {
    logErrorMessage("Error in user login controller", error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: "SERVER_ERROR",
      errorMessage: "An unexpected error occurred during login",
    });
  }
}

export async function handleUserLogoutRequest(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  try {
    const { authenticatedUser, jwtToken } = request;

    if (!authenticatedUser || !jwtToken) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: "AUTH_ERROR",
        errorMessage: "Not authenticated",
      });
      return;
    }

    const result = await logoutUserAndBlacklistToken(
      jwtToken,
      authenticatedUser.userId,
    );

    if (!result.wasLogoutSuccessful) {
      response.status(HTTP_STATUS_BAD_REQUEST).json({
        success: false,
        errorCode: "LOGOUT_ERROR",
        errorMessage: result.errorMessage,
      });
      return;
    }

    logInfoMessage("User logged out successfully", {
      userId: authenticatedUser.userId,
    });

    response.status(HTTP_STATUS_OK).json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch (error) {
    logErrorMessage("Error in user logout controller", error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: "SERVER_ERROR",
      errorMessage: "An unexpected error occurred during logout",
    });
  }
}

export async function handleGetCurrentUserRequest(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  try {
    const { authenticatedUser } = request;

    if (!authenticatedUser) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: "AUTH_ERROR",
        errorMessage: "Not authenticated",
      });
      return;
    }

    const userProfile = await fetchUserProfileById(authenticatedUser.userId);

    if (!userProfile) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: "USER_NOT_FOUND",
        errorMessage: "User not found",
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
          role: "user",
        },
      },
    });
  } catch (error) {
    logErrorMessage("Error in get current user controller", error);
    response.status(HTTP_STATUS_BAD_REQUEST).json({
      success: false,
      errorCode: "SERVER_ERROR",
      errorMessage: "An unexpected error occurred",
    });
  }
}
