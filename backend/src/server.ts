import app from './app';
import { env } from '@/shared/config/env.config';
import { logger } from '@/shared/utils/logger.util';
import { prismaConnector } from '@/shared/connectors/prisma.connector';
import { backgroundJobsService } from '@/shared/services/background-jobs.service';

const server = app.listen(env.PORT, async () => {
  logger.info(
    `🚀 Credit Card Suggestor API Server is running on port ${env.PORT}`,
  );
  logger.info(
    `📚 API Documentation available at http://localhost:${env.PORT}/api-docs`,
  );
  logger.info(
    `🔍 Health check available at http://localhost:${env.PORT}/api/v1/health`,
  );

  // Start background jobs service
  try {
    await backgroundJobsService.start();
    logger.info('⚡ Background jobs service started');
  } catch (error) {
    logger.error('Failed to start background jobs service:', error);
  }
});

const gracefulShutdown = (signal: string) => {
  process.on(signal, async () => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');

      // Stop background jobs service
      try {
        await backgroundJobsService.shutdown();
        logger.info('Background jobs service stopped.');
      } catch (error) {
        logger.error('Error stopping background jobs service:', error);
      }

      await prismaConnector.disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    });
  });
};

gracefulShutdown('SIGTERM');
gracefulShutdown('SIGINT');
