// ==============================|| AUTHENTICATION SERVICE ||============================== //
// Handles user registration, login, logout, and token management

import { prismaClient } from '../config/prisma-client.config';
import { redisClient } from '../config/redis-client.config';
import {
  hashPlainTextPassword,
  verifyPasswordAgainstHash,
  validatePasswordStrengthRequirements,
  validateUsernameFormat,
  validateEmailFormat
} from '../utils/password-hasher.util';
import {
  generateJwtTokenForUser,
  decodeJwtTokenWithoutVerification,
  calculateTokenRemainingTimeInSeconds
} from '../utils/jwt-token-manager.util';
import { generateBlacklistedTokenKey } from '../constants/redis-keys.constants';
import {
  AUTH_ERROR_EMAIL_ALREADY_EXISTS,
  AUTH_ERROR_USERNAME_ALREADY_EXISTS,
  AUTH_ERROR_INVALID_CREDENTIALS,
  AUTH_ERROR_ACCOUNT_INACTIVE,
  VALIDATION_ERROR_INVALID_EMAIL,
  VALIDATION_ERROR_INVALID_PASSWORD,
  VALIDATION_ERROR_INVALID_USERNAME,
  getErrorMessageFromCode
} from '../constants/error-codes.constants';
import { logAuthenticationEvent, logErrorMessage } from '../utils/logger.util';

// ==============================|| SERVICE RESULT INTERFACES ||============================== //

export interface UserRegistrationResult {
  wasRegistrationSuccessful: boolean;
  jwtToken: string | null;
  userProfile: UserProfileData | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface UserLoginResult {
  wasLoginSuccessful: boolean;
  jwtToken: string | null;
  userProfile: UserProfileData | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface UserLogoutResult {
  wasLogoutSuccessful: boolean;
  errorMessage: string | null;
}

export interface UserProfileData {
  userId: string;
  emailAddress: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  createdAtTimestamp: Date;
  isAccountActive: boolean;
}

export interface TokenValidationResult {
  isTokenValid: boolean;
  isTokenBlacklisted: boolean;
  errorCode: string | null;
}

// ==============================|| REGISTER NEW USER ||============================== //

export async function registerNewUserAccount(
  emailAddress: string,
  username: string,
  fullName: string,
  plainTextPassword: string
): Promise<UserRegistrationResult> {
  try {
    // Validate email format
    if (!validateEmailFormat(emailAddress)) {
      return {
        wasRegistrationSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: VALIDATION_ERROR_INVALID_EMAIL,
        errorMessage: getErrorMessageFromCode(VALIDATION_ERROR_INVALID_EMAIL)
      };
    }

    // Validate username format
    const usernameValidation = validateUsernameFormat(username);
    if (!usernameValidation.isUsernameValid) {
      return {
        wasRegistrationSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: VALIDATION_ERROR_INVALID_USERNAME,
        errorMessage: usernameValidation.validationErrorMessage || getErrorMessageFromCode(VALIDATION_ERROR_INVALID_USERNAME)
      };
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrengthRequirements(plainTextPassword);
    if (!passwordValidation.isPasswordValid) {
      return {
        wasRegistrationSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: VALIDATION_ERROR_INVALID_PASSWORD,
        errorMessage: passwordValidation.validationErrorMessages.join('. ')
      };
    }

    // Check if email already exists
    const existingUserWithEmail = await prismaClient.user.findUnique({
      where: { emailAddress: emailAddress.toLowerCase() }
    });

    if (existingUserWithEmail) {
      return {
        wasRegistrationSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: AUTH_ERROR_EMAIL_ALREADY_EXISTS,
        errorMessage: getErrorMessageFromCode(AUTH_ERROR_EMAIL_ALREADY_EXISTS)
      };
    }

    // Check if username already exists
    const existingUserWithUsername = await prismaClient.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existingUserWithUsername) {
      return {
        wasRegistrationSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: AUTH_ERROR_USERNAME_ALREADY_EXISTS,
        errorMessage: getErrorMessageFromCode(AUTH_ERROR_USERNAME_ALREADY_EXISTS)
      };
    }

    // Hash the password
    const hashedPassword = await hashPlainTextPassword(plainTextPassword);

    // Create the user
    const createdUser = await prismaClient.user.create({
      data: {
        emailAddress: emailAddress.toLowerCase(),
        username: username.toLowerCase(),
        fullName,
        hashedPassword,
        isAccountActive: true,
        isEmailVerified: false
      }
    });

    // Generate JWT token
    const jwtToken = generateJwtTokenForUser({
      userId: createdUser.id,
      userEmail: createdUser.emailAddress,
      userFullName: createdUser.fullName,
      username: createdUser.username
    });

    const userProfile: UserProfileData = {
      userId: createdUser.id,
      emailAddress: createdUser.emailAddress,
      username: createdUser.username,
      fullName: createdUser.fullName,
      avatarUrl: createdUser.avatarUrl,
      createdAtTimestamp: createdUser.createdAtTimestamp,
      isAccountActive: createdUser.isAccountActive
    };

    logAuthenticationEvent('REGISTER', createdUser.id, { email: createdUser.emailAddress });

    return {
      wasRegistrationSuccessful: true,
      jwtToken,
      userProfile,
      errorCode: null,
      errorMessage: null
    };
  } catch (registrationError) {
    logErrorMessage('Error during user registration', registrationError, { emailAddress, username });

    return {
      wasRegistrationSuccessful: false,
      jwtToken: null,
      userProfile: null,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'An unexpected error occurred during registration'
    };
  }
}

// ==============================|| LOGIN USER ||============================== //

export async function loginUserWithCredentials(emailOrUsername: string, plainTextPassword: string): Promise<UserLoginResult> {
  try {
    const searchValue = emailOrUsername.toLowerCase();

    // Find user by email or username
    const foundUser = await prismaClient.user.findFirst({
      where: {
        OR: [{ emailAddress: searchValue }, { username: searchValue }]
      }
    });

    if (!foundUser) {
      return {
        wasLoginSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: AUTH_ERROR_INVALID_CREDENTIALS,
        errorMessage: getErrorMessageFromCode(AUTH_ERROR_INVALID_CREDENTIALS)
      };
    }

    // Check if account is active
    if (!foundUser.isAccountActive) {
      return {
        wasLoginSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: AUTH_ERROR_ACCOUNT_INACTIVE,
        errorMessage: getErrorMessageFromCode(AUTH_ERROR_ACCOUNT_INACTIVE)
      };
    }

    // Verify password
    const isPasswordCorrect = await verifyPasswordAgainstHash(plainTextPassword, foundUser.hashedPassword);

    if (!isPasswordCorrect) {
      return {
        wasLoginSuccessful: false,
        jwtToken: null,
        userProfile: null,
        errorCode: AUTH_ERROR_INVALID_CREDENTIALS,
        errorMessage: getErrorMessageFromCode(AUTH_ERROR_INVALID_CREDENTIALS)
      };
    }

    // Update last login timestamp
    await prismaClient.user.update({
      where: { id: foundUser.id },
      data: { lastLoginAtTimestamp: new Date() }
    });

    // Generate JWT token
    const jwtToken = generateJwtTokenForUser({
      userId: foundUser.id,
      userEmail: foundUser.emailAddress,
      userFullName: foundUser.fullName,
      username: foundUser.username
    });

    const userProfile: UserProfileData = {
      userId: foundUser.id,
      emailAddress: foundUser.emailAddress,
      username: foundUser.username,
      fullName: foundUser.fullName,
      avatarUrl: foundUser.avatarUrl,
      createdAtTimestamp: foundUser.createdAtTimestamp,
      isAccountActive: foundUser.isAccountActive
    };

    logAuthenticationEvent('LOGIN', foundUser.id, { email: foundUser.emailAddress });

    return {
      wasLoginSuccessful: true,
      jwtToken,
      userProfile,
      errorCode: null,
      errorMessage: null
    };
  } catch (loginError) {
    logErrorMessage('Error during user login', loginError, { emailOrUsername });

    return {
      wasLoginSuccessful: false,
      jwtToken: null,
      userProfile: null,
      errorCode: 'SERVER_ERROR',
      errorMessage: 'An unexpected error occurred during login'
    };
  }
}

// ==============================|| LOGOUT USER ||============================== //

export async function logoutUserAndBlacklistToken(jwtToken: string, userId: string): Promise<UserLogoutResult> {
  try {
    // Decode token to get expiration time
    const decodedToken = decodeJwtTokenWithoutVerification(jwtToken);

    if (!decodedToken) {
      return {
        wasLogoutSuccessful: false,
        errorMessage: 'Invalid token format'
      };
    }

    // Calculate remaining TTL for the token
    const remainingTimeInSeconds = calculateTokenRemainingTimeInSeconds(decodedToken.tokenExpiresAtTimestamp);

    // Only blacklist if token hasn't expired
    if (remainingTimeInSeconds > 0) {
      // Store in Redis for fast lookup
      const blacklistKey = generateBlacklistedTokenKey(jwtToken);
      await redisClient.setex(blacklistKey, remainingTimeInSeconds, 'blacklisted');

      // Also store in database for persistence
      await prismaClient.blacklistedToken.create({
        data: {
          tokenString: jwtToken,
          expiresAtTimestamp: new Date(decodedToken.tokenExpiresAtTimestamp)
        }
      });
    }

    logAuthenticationEvent('LOGOUT', userId);

    return {
      wasLogoutSuccessful: true,
      errorMessage: null
    };
  } catch (logoutError) {
    logErrorMessage('Error during user logout', logoutError, { userId });

    return {
      wasLogoutSuccessful: false,
      errorMessage: 'An unexpected error occurred during logout'
    };
  }
}

// ==============================|| CHECK IF TOKEN IS BLACKLISTED ||============================== //

export async function checkIfTokenIsBlacklisted(jwtToken: string): Promise<boolean> {
  try {
    // First check Redis (faster)
    const blacklistKey = generateBlacklistedTokenKey(jwtToken);
    const redisResult = await redisClient.get(blacklistKey);

    if (redisResult !== null) {
      return true;
    }

    // Fallback to database check (in case Redis was restarted)
    const dbResult = await prismaClient.blacklistedToken.findUnique({
      where: { tokenString: jwtToken }
    });

    if (dbResult) {
      // Re-add to Redis for future fast lookups
      const remainingTimeInSeconds = calculateTokenRemainingTimeInSeconds(dbResult.expiresAtTimestamp.getTime());

      if (remainingTimeInSeconds > 0) {
        await redisClient.setex(blacklistKey, remainingTimeInSeconds, 'blacklisted');
      }

      return true;
    }

    return false;
  } catch (checkError) {
    logErrorMessage('Error checking token blacklist status', checkError);
    // Default to not blacklisted on error (to avoid blocking valid users)
    return false;
  }
}

// ==============================|| GET USER BY ID ||============================== //

export async function fetchUserProfileById(userId: string): Promise<UserProfileData | null> {
  try {
    const foundUser = await prismaClient.user.findUnique({
      where: { id: userId }
    });

    if (!foundUser) {
      return null;
    }

    return {
      userId: foundUser.id,
      emailAddress: foundUser.emailAddress,
      username: foundUser.username,
      fullName: foundUser.fullName,
      avatarUrl: foundUser.avatarUrl,
      createdAtTimestamp: foundUser.createdAtTimestamp,
      isAccountActive: foundUser.isAccountActive
    };
  } catch (fetchError) {
    logErrorMessage('Error fetching user profile', fetchError, { userId });
    return null;
  }
}

// ==============================|| CLEAN UP EXPIRED BLACKLISTED TOKENS ||============================== //

export async function cleanUpExpiredBlacklistedTokens(): Promise<number> {
  try {
    const deleteResult = await prismaClient.blacklistedToken.deleteMany({
      where: {
        expiresAtTimestamp: {
          lt: new Date()
        }
      }
    });

    return deleteResult.count;
  } catch (cleanupError) {
    logErrorMessage('Error cleaning up expired blacklisted tokens', cleanupError);
    return 0;
  }
}
