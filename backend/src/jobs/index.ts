import { logger } from '@/shared/utils/logger.util';
import { fileValidationService } from '@/shared/services/file-validation.service';
import { env } from '@/shared/config/env.config';

/**
 * Initialize background jobs for the credit card recommendation system
 */

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * File cleanup job - runs periodically to clean up old temporary files
 */
async function fileCleanupJob(): Promise<void> {
  try {
    logger.info('Starting file cleanup job');

    const result = await fileValidationService.cleanupTempFiles(
      env.CLEANUP_INTERVAL_MINUTES || 60,
    );

    if (result.cleaned > 0) {
      logger.info(`File cleanup completed: ${result.cleaned} files removed`);
    }

    if (result.errors.length > 0) {
      logger.warn(`File cleanup errors: ${result.errors.length}`, {
        errors: result.errors,
      });
    }
  } catch (error) {
    logger.error('File cleanup job failed:', error);
  }
}

export const startJobs = async () => {
  logger.info('🔄 Initializing background jobs...');

  // Start file cleanup job
  const cleanupIntervalMs = (env.CLEANUP_INTERVAL_MINUTES || 60) * 60 * 1000;
  cleanupInterval = setInterval(fileCleanupJob, cleanupIntervalMs);

  // Run initial cleanup
  await fileCleanupJob();

  logger.info('✅ Background jobs initialized');
};

export const stopJobs = () => {
  logger.info('🛑 Stopping background jobs...');

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  logger.info('✅ Background jobs stopped');
};
