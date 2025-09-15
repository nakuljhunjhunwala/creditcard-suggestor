import { Response } from 'express';
import { StatusCodes } from '@/shared/constants/http-status.constants';

export class ResponseUtil {
  /**
   * Send a success response
   * @param {object} res - Express response object
   * @param {object} data - Data to send
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode: number = StatusCodes.OK,
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
  ): Response {
    const response: {
      status: string;
      message: string;
      data: T;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    } = {
      status: 'success',
      message,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated success response
   * @param {object} res - Express response object
   * @param {object} data - Data to send
   * @param {string} message - Success message
   * @param {number} page - Current page
   * @param {number} total - Total number of items
   * @param {number} limit - Items per page
   * @param {number} statusCode - HTTP status code
   */
  static paginatedSuccess<T>(
    res: Response,
    data: T[] = [],
    message = 'Success',
    page = 1,
    total = 0,
    limit = 10,
    statusCode: number = StatusCodes.OK,
  ): Response {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
      page: parseInt(page.toString(), 10),
      total,
      limit: parseInt(limit.toString(), 10),
    });
  }

  /**
   * Send an error response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {object} errors - Validation errors
   */
  static error(
    res: Response,
    message = 'Internal Server Error',
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    errors: object | null = null,
  ): Response {
    const response: { status: string; message: string; errors?: object } = {
      status: 'error',
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}

/**
 * Send a standardized response
 */
export function sendResponse<T>(
  res: Response,
  options: {
    status: number;
    message: string;
    data?: T;
    pagination?: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  },
): Response {
  const response: any = {
    status: options.status < 400 ? 'success' : 'error',
    message: options.message,
  };

  if (options.data !== undefined) {
    response.data = options.data;
  }

  if (options.pagination) {
    response.pagination = options.pagination;
  }

  return res.status(options.status).json(response);
}
