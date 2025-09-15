/**
 * Application constants
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MANAGER: 'manager',
} as const;

export const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const BULK_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 1000,
  MAX_LIMIT: 10000,
  MIN_LIMIT: 1,
} as const;

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  ID: 'id',
  NAME: 'name',
  EMAIL: 'email',
} as const;
