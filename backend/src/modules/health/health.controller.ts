import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/utils/async-handler.util';
import { sendResponse } from '@/shared/utils/response.util';
import { prismaConnector } from '@/shared/connectors/prisma.connector';
import { StatusCodes } from '@/shared/constants/http-status.constants';
import { logger } from '@/shared/utils/logger.util';
import { env } from '@/shared/config/env.config';

export class HealthController {
  /**
   * Basic health check
   * GET /api/v1/health
   */
  public getHealth = asyncHandler(async (req: Request, res: Response) => {
    sendResponse(res, {
      status: StatusCodes.OK,
      message: 'Credit Card Suggestor API is healthy',
      data: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'credit-card-suggestor-api',
        version: '1.0.0',
      },
    });
  });

  /**
   * Detailed health check with dependencies
   * GET /api/v1/health/detailed
   */
  public getDetailedHealth = asyncHandler(
    async (req: Request, res: Response) => {
      const healthDetails: any = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'credit-card-suggestor-api',
        version: '1.0.0',
        environment: env.NODE_ENV,
        dependencies: {},
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
        },
      };

      let isHealthy = true;

      try {
        // Check database connection
        const dbStartTime = Date.now();
        const dbStatus = await prismaConnector.healthCheck();
        const dbResponseTime = Date.now() - dbStartTime;

        healthDetails.dependencies.database = {
          status: dbStatus ? 'OK' : 'DOWN',
          responseTime: `${dbResponseTime}ms`,
          lastChecked: new Date().toISOString(),
        };

        if (!dbStatus) {
          isHealthy = false;
        }

        // Get database info if connection is healthy
        if (dbStatus) {
          try {
            const dbInfo = await prismaConnector.getDatabaseInfo();
            healthDetails.dependencies.database.info = {
              version: dbInfo.version.split(' ')[0], // Get just the version number
              connections: dbInfo.connections,
              uptime: Math.round(dbInfo.uptime),
            };
          } catch (error) {
            logger.warn('Failed to get database info:', error);
          }
        }

        // Check if we can query essential tables
        if (dbStatus) {
          try {
            const tableChecks = await Promise.all([
              prismaConnector.getTableRowCount('sessions'),
              prismaConnector.getTableRowCount('categories'),
              prismaConnector.getTableRowCount('mcc_codes'),
              prismaConnector.getTableRowCount('credit_cards'),
            ]);

            healthDetails.dependencies.database.tables = {
              sessions: tableChecks[0] || 0,
              categories: tableChecks[1] || 0,
              mccCodes: tableChecks[2] || 0,
              creditCards: tableChecks[3] || 0,
            };
          } catch (error) {
            logger.warn('Failed to check table counts:', error);
            healthDetails.dependencies.database.tablesError =
              'Could not verify table data';
          }
        }
      } catch (error) {
        logger.error('Health check failed:', error);
        healthDetails.dependencies.database = {
          status: 'ERROR',
          error:
            error instanceof Error ? error.message : 'Unknown database error',
          lastChecked: new Date().toISOString(),
        };
        isHealthy = false;
      }

      // Additional system checks
      try {
        healthDetails.system.diskSpace = await this.getDiskSpace();
      } catch (error) {
        logger.warn('Could not get disk space:', error);
      }

      // Set overall status
      healthDetails.status = isHealthy ? 'OK' : 'DEGRADED';

      const statusCode = isHealthy
        ? StatusCodes.OK
        : StatusCodes.SERVICE_UNAVAILABLE;
      const message = isHealthy
        ? 'All systems operational'
        : 'Some dependencies are not healthy';

      sendResponse(res, {
        status: statusCode,
        message,
        data: healthDetails,
      });
    },
  );

  /**
   * Database-specific health check
   * GET /api/v1/health/database
   */
  public getDatabaseHealth = asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const startTime = Date.now();
        const isHealthy = await prismaConnector.healthCheck();
        const responseTime = Date.now() - startTime;

        if (!isHealthy) {
          sendResponse(res, {
            status: StatusCodes.SERVICE_UNAVAILABLE,
            message: 'Database connection failed',
            data: {
              status: 'DOWN',
              responseTime: `${responseTime}ms`,
              lastChecked: new Date().toISOString(),
            },
          });
          return;
        }

        const dbInfo = await prismaConnector.getDatabaseInfo();

        sendResponse(res, {
          status: StatusCodes.OK,
          message: 'Database is healthy',
          data: {
            status: 'OK',
            responseTime: `${responseTime}ms`,
            lastChecked: new Date().toISOString(),
            info: {
              version: dbInfo.version.split(' ')[0],
              connections: dbInfo.connections,
              uptime: Math.round(dbInfo.uptime),
            },
          },
        });
      } catch (error) {
        logger.error('Database health check failed:', error);
        sendResponse(res, {
          status: StatusCodes.SERVICE_UNAVAILABLE,
          message: 'Database health check failed',
          data: {
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString(),
          },
        });
      }
    },
  );

  /**
   * Ready check - for Kubernetes readiness probe
   * GET /api/v1/health/ready
   */
  public getReadiness = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if essential services are ready
      const dbHealthy = await prismaConnector.healthCheck();

      if (!dbHealthy) {
        sendResponse(res, {
          status: StatusCodes.SERVICE_UNAVAILABLE,
          message: 'Service not ready - database unavailable',
          data: {
            ready: false,
            checks: {
              database: false,
            },
          },
        });
        return;
      }

      sendResponse(res, {
        status: StatusCodes.OK,
        message: 'Service is ready',
        data: {
          ready: true,
          checks: {
            database: true,
          },
        },
      });
    } catch (error) {
      logger.error('Readiness check failed:', error);
      sendResponse(res, {
        status: StatusCodes.SERVICE_UNAVAILABLE,
        message: 'Service not ready',
        data: {
          ready: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  /**
   * Live check - for Kubernetes liveness probe
   * GET /api/v1/health/live
   */
  public getLiveness = asyncHandler(async (req: Request, res: Response) => {
    // Basic liveness check - just ensure the process is running
    sendResponse(res, {
      status: StatusCodes.OK,
      message: 'Service is alive',
      data: {
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  /**
   * Get disk space information - simplified for MVP
   */
  private async getDiskSpace(): Promise<Record<string, string> | null> {
    try {
      return {
        available: 'N/A', // Would need additional library for accurate disk space
        used: 'N/A',
      };
    } catch {
      return null;
    }
  }
}
