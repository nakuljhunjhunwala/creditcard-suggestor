import { Router } from 'express';
import { HealthController } from './health.controller';

const healthRouter = Router();
const healthController = new HealthController();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Get basic health check
 *     description: Returns a simple status to indicate if the Credit Card Suggestor API is running
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Credit Card Suggestor API is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: OK
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     service:
 *                       type: string
 *                       example: credit-card-suggestor-api
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 */
healthRouter.get('/', healthController.getHealth);

/**
 * @swagger
 * /api/v1/health/detailed:
 *   get:
 *     tags: [Health]
 *     summary: Get detailed health check
 *     description: Provides detailed health status of the API and all its dependencies including database connection and table counts
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: All systems operational
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: OK
 *                     service:
 *                       type: string
 *                       example: credit-card-suggestor-api
 *                     environment:
 *                       type: string
 *                       example: development
 *                     dependencies:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: OK
 *                             responseTime:
 *                               type: string
 *                               example: 15ms
 *                             tables:
 *                               type: object
 *                     system:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                         memory:
 *                           type: object
 *                         nodeVersion:
 *                           type: string
 *       503:
 *         description: Some dependencies are unhealthy
 */
healthRouter.get('/detailed', healthController.getDetailedHealth);

/**
 * @swagger
 * /api/v1/health/database:
 *   get:
 *     tags: [Health]
 *     summary: Get database-specific health check
 *     description: Returns detailed database connection status and information
 *     responses:
 *       200:
 *         description: Database is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Database is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: OK
 *                     responseTime:
 *                       type: string
 *                       example: 12ms
 *                     info:
 *                       type: object
 *                       properties:
 *                         version:
 *                           type: string
 *                         connections:
 *                           type: integer
 *                         uptime:
 *                           type: integer
 *       503:
 *         description: Database connection failed
 */
healthRouter.get('/database', healthController.getDatabaseHealth);

/**
 * @swagger
 * /api/v1/health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe endpoint - checks if service is ready to receive traffic
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Service is ready
 *                 data:
 *                   type: object
 *                   properties:
 *                     ready:
 *                       type: boolean
 *                       example: true
 *                     checks:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: boolean
 *                           example: true
 *       503:
 *         description: Service not ready
 */
healthRouter.get('/ready', healthController.getReadiness);

/**
 * @swagger
 * /api/v1/health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe endpoint - checks if service is alive
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Service is alive
 *                 data:
 *                   type: object
 *                   properties:
 *                     alive:
 *                       type: boolean
 *                       example: true
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 */
healthRouter.get('/live', healthController.getLiveness);

export default healthRouter;
