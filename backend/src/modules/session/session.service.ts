import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger.util';
import { env } from '@/shared/config/env.config';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';

export interface SessionCreateData {
  sessionToken?: string;
}

export interface SessionWithStats {
  id: string;
  sessionToken: string;
  status: string;
  progress: number;
  totalSpend?: number;
  topCategory?: string;
  totalTransactions?: number;
  categorizedCount?: number;
  unknownMccCount?: number;
  newMccDiscovered?: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  errorMessage?: string;
}

export class SessionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new processing session
   */
  async createSession(data: SessionCreateData = {}): Promise<SessionWithStats> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + env.SESSION_EXPIRY_HOURS);

      const session = await this.prisma.session.create({
        data: {
          sessionToken: data.sessionToken,
          status: 'uploading',
          progress: 0,
          expiresAt,
          retryCount: 0,
        },
      });

      logger.info(`Created new session: ${session.sessionToken}`, {
        sessionId: session.id,
        expiresAt: session.expiresAt,
      });

      return this.mapSessionToResponse(session);
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new ApiError(
        'Failed to create processing session',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get session by token
   */
  async getSessionByToken(
    sessionToken: string,
  ): Promise<SessionWithStats | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { sessionToken },
      });

      if (!session) {
        return null;
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        logger.info(`Session expired: ${sessionToken}`);
        await this.deleteSession(session.id);
        return null;
      }

      return this.mapSessionToResponse(session);
    } catch (error) {
      logger.error(`Failed to get session by token: ${sessionToken}`, error);
      throw new ApiError(
        'Failed to retrieve session',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<SessionWithStats | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return null;
      }

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        logger.info(`Session expired: ${sessionId}`);
        await this.deleteSession(sessionId);
        return null;
      }

      return this.mapSessionToResponse(session);
    } catch (error) {
      logger.error(`Failed to get session by ID: ${sessionId}`, error);
      throw new ApiError(
        'Failed to retrieve session',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update session status and progress
   */
  async updateSession(
    sessionId: string,
    updates: {
      status?: string;
      progress?: number;
      totalSpend?: number;
      topCategory?: string;
      totalTransactions?: number;
      categorizedCount?: number;
      unknownMccCount?: number;
      newMccDiscovered?: number;
      errorMessage?: string;
    },
  ): Promise<SessionWithStats> {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      logger.debug(`Updated session ${sessionId}:`, updates);

      return this.mapSessionToResponse(session);
    } catch (error) {
      logger.error(`Failed to update session ${sessionId}:`, error);
      throw new ApiError(
        'Failed to update session',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update session progress with status
   */
  async updateProgress(
    sessionId: string,
    status: string,
    progress: number,
    currentStep?: string,
  ): Promise<void> {
    try {
      await this.updateSession(sessionId, {
        status,
        progress: Math.min(100, Math.max(0, progress)), // Ensure progress is between 0-100
      });

      if (currentStep) {
        logger.info(`Session ${sessionId}: ${currentStep} (${progress}%)`);
      }
    } catch (error) {
      logger.error(
        `Failed to update progress for session ${sessionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Mark session as failed with error message
   */
  async failSession(sessionId: string, errorMessage: string): Promise<void> {
    try {
      await this.updateSession(sessionId, {
        status: 'failed',
        errorMessage,
      });

      logger.error(`Session ${sessionId} failed: ${errorMessage}`);
    } catch (error) {
      logger.error(`Failed to mark session as failed: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Mark session as completed
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      await this.updateSession(sessionId, {
        status: 'completed',
        progress: 100,
      });

      logger.info(`Session ${sessionId} completed successfully`);
    } catch (error) {
      logger.error(`Failed to complete session: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Delete session and all related data
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Delete related data first (due to foreign key constraints)
      await this.prisma.processingJob.deleteMany({
        where: { sessionId },
      });

      await this.prisma.recommendation.deleteMany({
        where: { sessionId },
      });

      await this.prisma.transaction.deleteMany({
        where: { sessionId },
      });

      // Finally delete the session
      await this.prisma.session.delete({
        where: { id: sessionId },
      });

      logger.info(`Deleted session and all related data: ${sessionId}`);
    } catch (error) {
      logger.error(`Failed to delete session: ${sessionId}`, error);
      throw new ApiError(
        'Failed to delete session',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await this.prisma.session.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
        select: { id: true, sessionToken: true },
      });

      let cleanedCount = 0;
      for (const session of expiredSessions) {
        try {
          await this.deleteSession(session.id);
          cleanedCount++;
        } catch (error) {
          logger.error(
            `Failed to cleanup expired session: ${session.sessionToken}`,
            error,
          );
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions (for monitoring)
   */
  async getActiveSessions(): Promise<SessionWithStats[]> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return sessions.map((session) => this.mapSessionToResponse(session));
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      throw new ApiError(
        'Failed to retrieve active sessions',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    failed: number;
    processing: number;
  }> {
    try {
      const [total, active, completed, failed, processing] = await Promise.all([
        this.prisma.session.count(),
        this.prisma.session.count({
          where: {
            expiresAt: { gt: new Date() },
          },
        }),
        this.prisma.session.count({
          where: { status: 'completed' },
        }),
        this.prisma.session.count({
          where: { status: 'failed' },
        }),
        this.prisma.session.count({
          where: {
            status: {
              in: ['extracting', 'categorizing', 'mcc_discovery', 'analyzing'],
            },
            expiresAt: { gt: new Date() },
          },
        }),
      ]);

      return {
        total,
        active,
        completed,
        failed,
        processing,
      };
    } catch (error) {
      logger.error('Failed to get session statistics:', error);
      throw new ApiError(
        'Failed to retrieve session statistics',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Extend session expiration
   */
  async extendSession(
    sessionId: string,
    additionalHours: number = 24,
  ): Promise<void> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new ApiError('Session not found', StatusCodes.NOT_FOUND);
      }

      const newExpiresAt = new Date(session.expiresAt);
      newExpiresAt.setHours(newExpiresAt.getHours() + additionalHours);

      await this.prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt: newExpiresAt },
      });

      logger.info(`Extended session ${sessionId} by ${additionalHours} hours`);
    } catch (error) {
      logger.error(`Failed to extend session: ${sessionId}`, error);
      throw error instanceof ApiError
        ? error
        : new ApiError(
            'Failed to extend session',
            StatusCodes.INTERNAL_SERVER_ERROR,
          );
    }
  }

  /**
   * Map database session to response format
   */
  private mapSessionToResponse(session: any): SessionWithStats {
    return {
      id: session.id,
      sessionToken: session.sessionToken,
      status: session.status,
      progress: session.progress,
      totalSpend: session.totalSpend,
      topCategory: session.topCategory,
      totalTransactions: session.totalTransactions,
      categorizedCount: session.categorizedCount,
      unknownMccCount: session.unknownMccCount,
      newMccDiscovered: session.newMccDiscovered,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      errorMessage: session.errorMessage,
    };
  }
}
