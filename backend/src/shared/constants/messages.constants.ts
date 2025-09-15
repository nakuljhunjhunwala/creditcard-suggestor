/**
 * Message constants for the application
 */
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User with this email already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INCORRECT_PASSWORD: 'Current password is incorrect',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  INTERNAL_ERROR: 'Internal server error',
} as const;

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_RETRIEVED: 'User retrieved successfully',
  USERS_RETRIEVED: 'Users retrieved successfully',
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROFILE_RETRIEVED: 'Profile retrieved successfully',
} as const;
