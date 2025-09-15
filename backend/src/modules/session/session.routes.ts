import { Router } from 'express';
import { SessionController } from './session.controller';
import {
  handleUploadErrors,
  uploadPDF,
} from '@/shared/middlewares/upload.middleware';

const router = Router();
const sessionController = new SessionController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         sessionToken:
 *           type: string
 *           description: Unique session token for client tracking
 *         status:
 *           type: string
 *           enum: [uploading, extracting, categorizing, mcc_discovery, analyzing, completed, failed]
 *           description: Current processing status
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Processing progress percentage
 *         totalSpend:
 *           type: number
 *           description: Total spending amount from transactions
 *         topCategory:
 *           type: string
 *           description: Category with highest spending
 *         totalTransactions:
 *           type: integer
 *           description: Number of transactions found
 *         categorizedCount:
 *           type: integer
 *           description: Number of successfully categorized transactions
 *         unknownMccCount:
 *           type: integer
 *           description: Number of transactions needing MCC discovery
 *         newMccDiscovered:
 *           type: integer
 *           description: Number of new MCC codes discovered
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Session expiration time
 *         errorMessage:
 *           type: string
 *           description: Error message if processing failed
 */

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     tags: [Sessions]
 *     summary: Create a new processing session
 *     description: Creates a new session for PDF processing and analysis
 *     responses:
 *       201:
 *         description: Session created successfully
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
 *                   example: Session created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionToken:
 *                       type: string
 *                       example: clxy123abc456def
 *                     status:
 *                       type: string
 *                       example: uploading
 *                     progress:
 *                       type: integer
 *                       example: 0
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 */
router.post('/', sessionController.createSession);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}/upload:
 *   post:
 *     tags: [Sessions]
 *     summary: Upload PDF file for processing
 *     description: Upload a credit card statement PDF for transaction extraction and analysis
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token from created session
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: Credit card statement PDF file
 *             required:
 *               - pdf
 *     responses:
 *       200:
 *         description: PDF uploaded and processing started
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
 *                   example: PDF uploaded successfully and processing started
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionToken:
 *                       type: string
 *                       example: clxy123abc456def
 *                     status:
 *                       type: string
 *                       example: extracting
 *                     progress:
 *                       type: integer
 *                       example: 10
 *                     fileName:
 *                       type: string
 *                       example: statement-jan-2024.pdf
 *                     fileSize:
 *                       type: integer
 *                       example: 1048576
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - invalid file, session, or upload error
 *       404:
 *         description: Session not found
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */
router.post(
  '/:sessionToken/upload',
  uploadPDF,
  handleUploadErrors,
  sessionController.uploadPDF,
);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}/job-status:
 *   get:
 *     tags: [Sessions]
 *     summary: Get processing job status
 *     description: Get the current status of background processing jobs for a session
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token from created session
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
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
 *                   example: Job status retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionToken:
 *                       type: string
 *                       example: clxy123abc456def
 *                     sessionStatus:
 *                       type: string
 *                       example: processing
 *                     sessionProgress:
 *                       type: integer
 *                       example: 45
 *                     activeJob:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: job_clxy789abc123def
 *                         type:
 *                           type: string
 *                           example: pdf_processing
 *                         status:
 *                           type: string
 *                           example: processing
 *                         progress:
 *                           type: integer
 *                           example: 45
 *                         currentStep:
 *                           type: string
 *                           example: categorizing
 *                         queuedAt:
 *                           type: string
 *                           format: date-time
 *                         startedAt:
 *                           type: string
 *                           format: date-time
 *                         completedAt:
 *                           type: string
 *                           format: date-time
 *                         errorMessage:
 *                           type: string
 *                     allJobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           progress:
 *                             type: integer
 *                           queuedAt:
 *                             type: string
 *                             format: date-time
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Bad request
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get('/:sessionToken/job-status', sessionController.getJobStatus);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}/status:
 *   get:
 *     tags: [Sessions]
 *     summary: Get session processing status
 *     description: Returns the current status and progress of a session
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
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
 *                   example: Session status retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.get('/:sessionToken/status', sessionController.getSessionStatus);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}/transactions:
 *   get:
 *     tags: [Sessions]
 *     summary: Get session transactions
 *     description: Returns paginated list of transactions for a session
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                   example: Transactions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           description:
 *                             type: string
 *                           merchant:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           mccCode:
 *                             type: string
 *                           categoryName:
 *                             type: string
 *                           mccStatus:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalCount:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.get(
  '/:sessionToken/transactions',
  sessionController.getSessionTransactions,
);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}/analysis:
 *   get:
 *     tags: [Sessions]
 *     summary: Get session spending analysis
 *     description: Returns detailed spending analysis and insights for a session
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token
 *     responses:
 *       200:
 *         description: Session analysis retrieved successfully
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
 *                   example: Session analysis retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionSummary:
 *                       type: object
 *                     categoryAnalysis:
 *                       type: array
 *                       items:
 *                         type: object
 *                     monthlySpending:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Analysis not yet available
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.get('/:sessionToken/analysis', sessionController.getSessionAnalysis);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}/recommendations:
 *   get:
 *     tags: [Sessions]
 *     summary: Get credit card recommendations
 *     description: Returns personalized credit card recommendations for a session
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
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
 *                   example: Recommendations retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           score:
 *                             type: number
 *                           potentialSavings:
 *                             type: number
 *                           primaryReason:
 *                             type: string
 *                           card:
 *                             type: object
 *                     totalRecommendations:
 *                       type: integer
 *       400:
 *         description: Recommendations not yet available
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.get(
  '/:sessionToken/recommendations',
  sessionController.getSessionRecommendations,
);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}/extend:
 *   post:
 *     tags: [Sessions]
 *     summary: Extend session expiration
 *     description: Extends the expiration time of a session
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: integer
 *                 default: 24
 *                 description: Number of hours to extend
 *     responses:
 *       200:
 *         description: Session extended successfully
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
 *                   example: Session extended successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionToken:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     extendedBy:
 *                       type: integer
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.post('/:sessionToken/extend', sessionController.extendSession);

/**
 * @swagger
 * /api/v1/sessions/{sessionToken}:
 *   delete:
 *     tags: [Sessions]
 *     summary: Delete session
 *     description: Deletes a session and all associated data
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Session token
 *     responses:
 *       200:
 *         description: Session deleted successfully
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
 *                   example: Session deleted successfully
 *       404:
 *         description: Session not found or expired
 *       500:
 *         description: Server error
 */
router.delete('/:sessionToken', sessionController.deleteSession);

/**
 * @swagger
 * /api/v1/sessions/stats:
 *   get:
 *     tags: [Sessions]
 *     summary: Get session statistics
 *     description: Returns overall session statistics for monitoring (admin endpoint)
 *     responses:
 *       200:
 *         description: Session statistics retrieved successfully
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
 *                   example: Session statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     completed:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     processing:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/stats', sessionController.getSessionStats);

export default router;
