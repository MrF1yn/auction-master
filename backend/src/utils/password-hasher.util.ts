// ==============================|| PASSWORD HASHER UTILITY ||============================== //
// Bcrypt wrapper for secure password hashing and verification

import bcrypt from 'bcrypt';

// ==============================|| CONFIGURATION ||============================== //

const SALT_ROUNDS_FOR_PASSWORD_HASHING = 10;

// ==============================|| HASH PASSWORD ||============================== //
// Hashes a plain text password using bcrypt

export async function hashPlainTextPassword(plainTextPassword: string): Promise<string> {
  const generatedSalt = await bcrypt.genSalt(SALT_ROUNDS_FOR_PASSWORD_HASHING);
  const hashedPasswordString = await bcrypt.hash(plainTextPassword, generatedSalt);
  return hashedPasswordString;
}

// ==============================|| VERIFY PASSWORD ||============================== //
// Compares a plain text password with a hashed password

export async function verifyPasswordAgainstHash(plainTextPassword: string, hashedPasswordFromDatabase: string): Promise<boolean> {
  const doesPasswordMatch = await bcrypt.compare(plainTextPassword, hashedPasswordFromDatabase);
  return doesPasswordMatch;
}

// ==============================|| PASSWORD VALIDATION ||============================== //
// Validates password strength requirements

export interface PasswordValidationResult {
  isPasswordValid: boolean;
  validationErrorMessages: string[];
}

export function validatePasswordStrengthRequirements(passwordToValidate: string): PasswordValidationResult {
  const validationErrorMessages: string[] = [];

  // Minimum length check
  const MINIMUM_PASSWORD_LENGTH = 8;
  if (passwordToValidate.length < MINIMUM_PASSWORD_LENGTH) {
    validationErrorMessages.push(`Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters long`);
  }

  // Uppercase letter check
  const UPPERCASE_LETTER_REGEX = /[A-Z]/;
  if (!UPPERCASE_LETTER_REGEX.test(passwordToValidate)) {
    validationErrorMessages.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter check
  const LOWERCASE_LETTER_REGEX = /[a-z]/;
  if (!LOWERCASE_LETTER_REGEX.test(passwordToValidate)) {
    validationErrorMessages.push('Password must contain at least one lowercase letter');
  }

  // Number check
  const NUMBER_REGEX = /[0-9]/;
  if (!NUMBER_REGEX.test(passwordToValidate)) {
    validationErrorMessages.push('Password must contain at least one number');
  }

  return {
    isPasswordValid: validationErrorMessages.length === 0,
    validationErrorMessages
  };
}

// ==============================|| USERNAME VALIDATION ||============================== //
// Validates username format requirements

export interface UsernameValidationResult {
  isUsernameValid: boolean;
  validationErrorMessage: string | null;
}

export function validateUsernameFormat(usernameToValidate: string): UsernameValidationResult {
  const MINIMUM_USERNAME_LENGTH = 3;
  const MAXIMUM_USERNAME_LENGTH = 30;
  const VALID_USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

  if (usernameToValidate.length < MINIMUM_USERNAME_LENGTH) {
    return {
      isUsernameValid: false,
      validationErrorMessage: `Username must be at least ${MINIMUM_USERNAME_LENGTH} characters long`
    };
  }

  if (usernameToValidate.length > MAXIMUM_USERNAME_LENGTH) {
    return {
      isUsernameValid: false,
      validationErrorMessage: `Username must be no more than ${MAXIMUM_USERNAME_LENGTH} characters long`
    };
  }

  if (!VALID_USERNAME_REGEX.test(usernameToValidate)) {
    return {
      isUsernameValid: false,
      validationErrorMessage: 'Username can only contain letters, numbers, and underscores'
    };
  }

  return {
    isUsernameValid: true,
    validationErrorMessage: null
  };
}

// ==============================|| EMAIL VALIDATION ||============================== //
// Validates email format

export function validateEmailFormat(emailToValidate: string): boolean {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(emailToValidate);
}
