import { StatusCodes } from './http-status.constants';

/**
 * Prisma Error Code Mappings
 *
 * This file maps Prisma error codes to user-friendly messages and HTTP status codes.
 */
export const PRISMA_ERROR_MAP: Record<
  string,
  { message: (meta: Record<string, unknown>) => string; statusCode: number }
> = {
  // Connection / Availability Errors (P1XXX)
  P1000: {
    message: () =>
      'Authentication failed against the database server. Please check your database credentials.',
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
  },
  P1001: {
    message: () =>
      "Can't reach the database server. Please ensure it's running and accessible.",
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
  },
  P1002: {
    message: () =>
      'The database server was reached but timed out. Please try again later.',
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
  },
  P1003: {
    message: (meta: { database_name?: string; db_name?: string }) =>
      `The database specified in the connection string ('${meta?.database_name ?? meta?.db_name ?? 'configured database'}') does not exist.`,
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
  },
  P1010: {
    message: () =>
      'User was denied access to the database. Please check database user permissions.',
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
  },
  P1017: {
    message: () =>
      'The database server has closed the connection. Please try again later.',
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
  },

  // Client Query Errors (P2XXX)
  P2000: {
    message: (meta: { target?: string; column_name?: string }) =>
      `The provided value for the field '${meta?.target ?? meta?.column_name ?? 'unknown'}' is too long.`,
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2001: {
    message: (meta: { modelName?: string; where?: object; model?: object }) =>
      `The record searched for in the where condition (${meta?.modelName ? `model ${meta.modelName}, ` : ''}where: ${JSON.stringify(meta?.where ?? meta?.model)}) does not exist.`,
    statusCode: StatusCodes.NOT_FOUND,
  },
  P2002: {
    message: (meta: { target?: string[] }) =>
      `A record with this ${meta?.target?.join(', ') ?? 'value'} already exists.`,
    statusCode: StatusCodes.CONFLICT,
  },
  P2003: {
    message: (meta: { field_name?: string }) =>
      `Foreign key constraint failed on the field '${meta?.field_name ?? 'unknown'}'.`,
    statusCode: StatusCodes.CONFLICT, // Can also be BAD_REQUEST depending on the cause
  },
  P2004: {
    message: () =>
      'A constraint failed on the database. Please check your input.',
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2005: {
    message: (meta: { value?: string; field?: string }) =>
      `The value '${meta?.value}' stored in the database for the field '${meta?.field}' is invalid for the field's type.`,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR, // Data integrity issue
  },
  P2006: {
    message: (meta: { field_name?: string }) =>
      `The provided value for the field '${meta?.field_name ?? 'unknown'}' is not valid.`,
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2007: {
    message: () => 'Data validation error. Please check your input.',
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2011: {
    message: (meta: { constraint?: string; target?: string[] }) =>
      `Null constraint violation on '${meta?.constraint ?? meta?.target?.join(', ') ?? 'a field'}'.`,
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2012: {
    message: (meta: { path?: string }) =>
      `Missing a required value for the field '${meta?.path ?? 'unknown'}'.`,
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2013: {
    message: (meta: { argument_name?: string; field_name?: string }) =>
      `Missing the required argument '${meta?.argument_name ?? 'unknown'}' for field '${meta?.field_name ?? 'unknown'}'.`,
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2014: {
    message: (meta: {
      relation_name?: string;
      model_a_name?: string;
      model_b_name?: string;
    }) =>
      `The change you are trying to make would violate the required relation '${meta?.relation_name}' between the '${meta?.model_a_name}' and '${meta?.model_b_name}' models.`,
    statusCode: StatusCodes.CONFLICT,
  },
  P2015: {
    message: () => 'A related record could not be found.',
    statusCode: StatusCodes.NOT_FOUND,
  },
  P2016: {
    message: () =>
      'Query interpretation error. Please check your query parameters.',
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2017: {
    message: (meta: {
      relation_name?: string;
      parent_name?: string;
      child_name?: string;
    }) =>
      `The records for relation '${meta?.relation_name}' between model '${meta?.parent_name}' and model '${meta?.child_name}' are not connected.`,
    statusCode: StatusCodes.CONFLICT,
  },
  P2018: {
    message: () =>
      'The required connected records were not found. Please check your input.',
    statusCode: StatusCodes.NOT_FOUND,
  },
  P2019: {
    message: () => 'Input error. Please check your input data types or values.',
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2020: {
    message: () => 'Value out of range for the type. Please check your input.',
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2021: {
    message: (meta: { table?: string }) =>
      `The table '${meta?.table ?? 'unknown'}' does not exist in the current database.`,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  },
  P2022: {
    message: (meta: { column?: string }) =>
      `The column '${meta?.column ?? 'unknown'}' does not exist in the current database.`,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  },
  P2023: {
    message: () => 'Inconsistent column data in the database.', // Or more specific from meta.message
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  },
  P2024: {
    message: () =>
      'Timed out fetching a new connection from the connection pool. Please try again later.',
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
  },
  P2025: {
    message: (meta: { cause?: string }) =>
      meta?.cause ??
      'Record not found. An operation failed because it depends on one or more records that were required but not found.',
    statusCode: StatusCodes.NOT_FOUND,
  },
  P2026: {
    message: () =>
      "The current database provider doesn't support a feature used in the query (e.g., full-text search). Please check the query.",
    statusCode: StatusCodes.NOT_IMPLEMENTED,
  },
  P2027: {
    message: () =>
      'Multiple errors occurred on the database during query execution. Check server logs for details.',
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  },
  P2028: {
    message: () => 'Transaction API error. Check server logs for details.',
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  },
  P2030: {
    message: () =>
      'A findUnique query returned more than one record. This indicates a data integrity issue.',
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  },
  P2033: {
    message: () =>
      'A number used in the query does not fit into a 64 bit signed integer. Please check your input values.',
    statusCode: StatusCodes.BAD_REQUEST,
  },
  P2034: {
    message: () =>
      'Transaction failed due to a write conflict or a deadlock. Please retry the transaction.',
    statusCode: StatusCodes.CONFLICT,
  },
  // Add more Prisma error codes and their mappings as needed
};
