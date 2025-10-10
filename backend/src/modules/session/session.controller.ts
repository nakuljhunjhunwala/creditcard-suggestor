import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';
import { asyncHandler } from '@/shared/utils/async-handler.util';
import { sendResponse } from '@/shared/utils/response.util';
import fs from 'fs/promises';
// import path from 'path';
import { backgroundJobsService } from '@/shared/services/background-jobs.service';
import { fileValidationService } from '@/shared/services/file-validation.service';
import { recommendationService } from '@/shared/services/recommendation.service';

export class SessionController {
    private sessionService: SessionService;

    constructor() {
        this.sessionService = new SessionService(prisma);
    }

    /**
     * Create a new session
     * POST /api/v1/sessions
     */
    createSession = asyncHandler(async (req: Request, res: Response) => {
        logger.info('Creating new session', { ip: req.ip });

        const session = await this.sessionService.createSession();

        sendResponse(res, {
            status: StatusCodes.CREATED,
            message: 'Session created successfully',
            data: {
                sessionToken: session.sessionToken,
                status: session.status,
                progress: session.progress,
                expiresAt: session.expiresAt,
            },
        });
    });

    /**
     * Upload PDF file for processing
     * POST /api/v1/sessions/:sessionToken/upload
     */
    uploadPDF = asyncHandler(async (req: Request, res: Response) => {
        const { sessionToken } = req.params;
        const uploadedFile = req.file;

        logger.info('PDF upload initiated', {
            sessionToken,
            file: uploadedFile?.originalname,
            size: uploadedFile?.size,
            ip: req.ip,
        });

        // Validate session token
        if (!sessionToken) {
            throw new ApiError('Session token is required', StatusCodes.BAD_REQUEST);
        }

        // Validate file upload
        if (!uploadedFile) {
            throw new ApiError('PDF file is required', StatusCodes.BAD_REQUEST);
        }

        // Verify session exists and is active
        const session = await this.sessionService.getSessionByToken(sessionToken);
        if (!session) {
            // Clean up uploaded file if session is invalid
            try {
                await fs.unlink(uploadedFile.path);
            } catch (error) {
                logger.warn(
                    'Failed to cleanup uploaded file after session validation failure',
                    error,
                );
            }
            throw new ApiError('Session not found or expired', StatusCodes.NOT_FOUND);
        }

        // Check if session is in correct state for upload
        if (session.status !== 'uploading') {
            // Clean up uploaded file
            try {
                await fs.unlink(uploadedFile.path);
            } catch (error) {
                logger.warn(
                    'Failed to cleanup uploaded file after status check failure',
                    error,
                );
            }
            throw new ApiError(
                `Session is not ready for upload. Current status: ${session.status}`,
                StatusCodes.BAD_REQUEST,
            );
        }

        try {
            // Perform comprehensive file validation
            const validationResult = await fileValidationService.validateFile(
                uploadedFile.path,
                {
                    originalName: uploadedFile.originalname,
                    size: uploadedFile.size,
                    uploadedAt: new Date(),
                    sessionToken,
                    clientIP: req.ip,
                    userAgent: req.get('User-Agent'),
                },
            );

            // Check validation result
            if (!validationResult.isValid) {
                // Clean up uploaded file
                try {
                    await fs.unlink(uploadedFile.path);
                } catch (cleanupError) {
                    logger.warn('Failed to cleanup invalid file', cleanupError);
                }

                const errorMessage = validationResult.errors.join('; ');
                throw new ApiError(
                    `File validation failed: ${errorMessage}`,
                    StatusCodes.BAD_REQUEST,
                );
            }

            // Log validation warnings if any
            if (validationResult.warnings.length > 0) {
                logger.warn('File validation warnings', {
                    sessionToken,
                    warnings: validationResult.warnings,
                    recommendations: validationResult.recommendations,
                });
            }

            // Store file path in session with validation info
            await prisma.session.update({
                where: { id: session.id },
                data: {
                    filePath: uploadedFile.path,
                    fileName: uploadedFile.originalname,
                    fileSize: uploadedFile.size,
                },
            });

            // Queue background processing job
            const jobId = await backgroundJobsService.queuePDFProcessingJob({
                sessionId: session.id,
                sessionToken: session.sessionToken,
                filePath: uploadedFile.path,
                fileName: uploadedFile.originalname,
                fileSize: uploadedFile.size,
                priority: 1, // High priority for user uploads
            });

            // Update session status to queued
            await this.sessionService.updateProgress(
                session.id,
                'queued',
                5,
                'PDF uploaded successfully, queued for processing',
            );

            logger.info(`PDF uploaded and queued for processing`, {
                sessionToken,
                jobId,
                filename: uploadedFile.filename,
                originalName: uploadedFile.originalname,
                size: uploadedFile.size,
                path: uploadedFile.path,
            });

            sendResponse(res, {
                status: StatusCodes.OK,
                message: 'PDF uploaded successfully and queued for processing',
                data: {
                    sessionToken: session.sessionToken,
                    status: 'queued',
                    progress: 5,
                    fileName: uploadedFile.originalname,
                    fileSize: uploadedFile.size,
                    jobId,
                    uploadedAt: new Date().toISOString(),
                    estimatedProcessingTime: '2-5 minutes',
                    validation: {
                        passed: validationResult.isValid,
                        warnings: validationResult.warnings,
                        recommendations: validationResult.recommendations,
                        fileInfo: validationResult.fileInfo,
                        pdfInfo: validationResult.pdfInfo,
                    },
                },
            });
        } catch (error) {
            // Clean up uploaded file on error
            try {
                await fs.unlink(uploadedFile.path);
            } catch (cleanupError) {
                logger.warn(
                    'Failed to cleanup uploaded file after processing error',
                    cleanupError,
                );
            }

            // Update session to failed state
            await this.sessionService.failSession(
                session.id,
                `Upload processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );

            logger.error('PDF upload processing failed', { sessionToken, error });
            throw error;
        }
    });

    /**
     * Get processing job status
     * GET /api/v1/sessions/:sessionToken/job-status
     */
    getJobStatus = asyncHandler(async (req: Request, res: Response) => {
        const { sessionToken } = req.params;

        if (!sessionToken) {
            throw new ApiError('Session token is required', StatusCodes.BAD_REQUEST);
        }

        const session = await this.sessionService.getSessionByToken(sessionToken);
        if (!session) {
            throw new ApiError('Session not found or expired', StatusCodes.NOT_FOUND);
        }

        // Get all jobs for this session
        const jobs = await backgroundJobsService.getSessionJobs(session.id);

        // Get the most recent active job
        const activeJob =
            jobs.find((j) => ['queued', 'processing'].includes(j.status)) || jobs[0];

        sendResponse(res, {
            status: StatusCodes.OK,
            message: 'Job status retrieved successfully',
            data: {
                sessionToken: session.sessionToken,
                sessionStatus: session.status,
                sessionProgress: session.progress,
                activeJob: activeJob
                    ? {
                        id: activeJob.id,
                        type: activeJob.jobType,
                        status: activeJob.status,
                        progress: activeJob.progress,
                        currentStep: activeJob.currentStep,
                        queuedAt: activeJob.queuedAt,
                        startedAt: activeJob.startedAt,
                        completedAt: activeJob.completedAt,
                        errorMessage: activeJob.errorMessage,
                    }
                    : null,
                allJobs: jobs.map((job) => ({
                    id: job.id,
                    type: job.jobType,
                    status: job.status,
                    progress: job.progress,
                    queuedAt: job.queuedAt,
                    completedAt: job.completedAt,
                })),
            },
        });
    });

    /**
     * Get session status
     * GET /api/v1/sessions/:sessionToken/status
     */
    getSessionStatus = asyncHandler(async (req: Request, res: Response) => {
        const { sessionToken } = req.params;

        if (!sessionToken) {
            throw new ApiError('Session token is required', StatusCodes.BAD_REQUEST);
        }

        const session = await this.sessionService.getSessionByToken(sessionToken);

        if (!session) {
            throw new ApiError('Session not found or expired', StatusCodes.NOT_FOUND);
        }

        sendResponse(res, {
            status: StatusCodes.OK,
            message: 'Session status retrieved successfully',
            data: {
                sessionToken: session.sessionToken,
                status: session.status,
                progress: session.progress,
                totalSpend: session.totalSpend,
                topCategory: session.topCategory,
                totalTransactions: session.totalTransactions,
                categorizedCount: session.categorizedCount,
                unknownMccCount: session.unknownMccCount,
                newMccDiscovered: session.newMccDiscovered,
                expiresAt: session.expiresAt,
                errorMessage: session.errorMessage,
            },
        });
    });

    /**
     * Get session transactions
     * GET /api/v1/sessions/:sessionToken/transactions
     */
    getSessionTransactions = asyncHandler(async (req: Request, res: Response) => {
        const { sessionToken } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page

        if (!sessionToken) {
            throw new ApiError('Session token is required', StatusCodes.BAD_REQUEST);
        }

        const session = await this.sessionService.getSessionByToken(sessionToken);

        if (!session) {
            throw new ApiError('Session not found or expired', StatusCodes.NOT_FOUND);
        }

        // Get transactions with pagination
        const skip = (page - 1) * limit;
        const [transactions, totalCount] = await Promise.all([
            prisma.transaction.findMany({
                where: { sessionId: session.id },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    date: true,
                    description: true,
                    merchant: true,
                    amount: true,
                    mccCode: true,
                    categoryName: true,
                    subCategoryName: true,
                    mccStatus: true,
                    mccConfidence: true,
                    confidence: true,
                    isVerified: true,
                    needsReview: true,
                },
            }),
            prisma.transaction.count({
                where: { sessionId: session.id },
            }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        sendResponse(res, {
            status: StatusCodes.OK,
            message: 'Transactions retrieved successfully',
            data: {
                transactions,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    });

    /**
     * Get session analysis
     * GET /api/v1/sessions/:sessionToken/analysis
     */
    getSessionAnalysis = asyncHandler(async (req: Request, res: Response) => {
        const { sessionToken } = req.params;

        if (!sessionToken) {
            throw new ApiError('Session token is required', StatusCodes.BAD_REQUEST);
        }

        const session = await this.sessionService.getSessionByToken(sessionToken);

        if (!session) {
            throw new ApiError('Session not found or expired', StatusCodes.NOT_FOUND);
        }

        if (session.status !== 'completed' && session.status !== 'analyzing') {
            throw new ApiError('Analysis not yet available', StatusCodes.BAD_REQUEST);
        }

        // Get spending analysis by category
        const categoryAnalysis = await prisma.transaction.groupBy({
            by: ['categoryName'],
            where: {
                sessionId: session.id,
                categoryName: { not: null },
            },
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    amount: 'desc',
                },
            },
        });

        // Get monthly spending trend
        const monthlySpending = await prisma.$queryRaw<
            Array<{ month: string; amount: number; count: number }>
        >`
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM transactions 
      WHERE "sessionId" = ${session.id}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `;

        // Get MCC discovery stats
        const mccStats = await prisma.transaction.groupBy({
            by: ['mccStatus'],
            where: {
                sessionId: session.id,
            },
            _count: {
                id: true,
            },
        });

        sendResponse(res, {
            status: StatusCodes.OK,
            message: 'Session analysis retrieved successfully',
            data: {
                sessionSummary: {
                    totalSpend: session.totalSpend,
                    totalTransactions: session.totalTransactions,
                    categorizedCount: session.categorizedCount,
                    unknownMccCount: session.unknownMccCount,
                    newMccDiscovered: session.newMccDiscovered,
                    topCategory: session.topCategory,
                },
                categoryAnalysis: categoryAnalysis.map((cat) => ({
                    category: cat.categoryName,
                    amount: cat._sum.amount,
                    transactionCount: cat._count.id,
                    percentage: session.totalSpend
                        ? Number(
                            (
                                (Number(cat._sum.amount) / Number(session.totalSpend)) *
                                100
                            ).toFixed(2),
                        )
                        : 0,
                })),
                monthlySpending: monthlySpending.map((month) => ({
                    month: month.month,
                    amount: Number(month.amount),
                    transactionCount: Number(month.count),
                })),
                mccDiscoveryStats: mccStats.map((stat) => ({
                    status: stat.mccStatus,
                    count: stat._count.id,
                })),
            },
        });
    });

    /**
     * Get enhanced session recommendations
     * GET /api/v1/sessions/:sessionToken/recommendations
     */
    getSessionRecommendations = asyncHandler(
        async (req: Request, res: Response) => {
            const { sessionToken } = req.params;
            const { creditScore, maxAnnualFee, preferredNetwork, includeBusinessCards } = req.query;

            if (!sessionToken) {
                throw new ApiError(
                    'Session token is required',
                    StatusCodes.BAD_REQUEST,
                );
            }

            const session = await this.sessionService.getSessionByToken(sessionToken);

            if (!session) {
                throw new ApiError(
                    'Session not found or expired',
                    StatusCodes.NOT_FOUND,
                );
            }

            if (session.status !== 'completed') {
                throw new ApiError(
                    'Recommendations not yet available',
                    StatusCodes.BAD_REQUEST,
                );
            }

            try {
                // Get enhanced recommendations using the new service
                const recommendationResult = await recommendationService.generateRecommendations(
                    session.id,
                    {
                        creditScore: creditScore as any,
                        maxAnnualFee: maxAnnualFee ? Number(maxAnnualFee) : undefined,
                        preferredNetwork: preferredNetwork as any,
                        includeBusinessCards: includeBusinessCards === 'true',
                    }
                );

                // Get detailed card information for each recommendation
                const cardIds = recommendationResult.recommendations.map(rec => rec.cardId);
                const detailedCards = await prisma.creditCard.findMany({
                    where: { id: { in: cardIds } },
                    include: {
                        issuer: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                color: true,
                                marketShare: true
                            }
                        },
                        network: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                color: true
                            }
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                                iconName: true,
                                color: true
                            }
                        },
                        subCategory: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true
                            }
                        },
                        acceleratedRewards: {
                            include: {
                                rewardCategory: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        description: true,
                                        mccCodes: true
                                    }
                                }
                            }
                        }
                    }
                });

                const cardMap = detailedCards.reduce((acc, card) => {
                    acc[card.id] = card;
                    return acc;
                }, {} as Record<string, any>);

                // Enhance recommendations with detailed card data
                const enhancedRecommendations = recommendationResult.recommendations.map(rec => {
                    const card = cardMap[rec.cardId];
                    return {
                        ...rec,
                        card: {
                            id: card.id,
                            name: card.name,
                            slug: card.slug,
                            description: card.description,
                            iconName: card.iconName,
                            color: card.color,
                            isActive: card.isActive,
                            isLifetimeFree: card.isLifetimeFree,
                            launchDate: card.launchDate,
                            issuer: card.issuer,
                            network: card.network,
                            category: card.category,
                            subCategory: card.subCategory,
                            feeStructure: card.feeStructure,
                            eligibilityRequirements: card.eligibilityRequirements,
                            rewardStructure: card.rewardStructure,
                            additionalBenefits: card.additionalBenefits,
                            uniqueFeatures: card.uniqueFeatures,
                            popularityScore: card.popularityScore,
                            customerSatisfactionScore: Number(card.customerSatisfactionScore),
                            recommendationScore: card.recommendationScore,
                            acceleratedRewards: card.acceleratedRewards.map((reward: any) => ({
                                id: reward.id,
                                rewardCategory: reward.rewardCategory,
                                merchantPatterns: reward.merchantPatterns,
                                rewardRate: Number(reward.rewardRate),
                                conditions: reward.conditions,
                                cappingLimit: reward.cappingLimit ? Number(reward.cappingLimit) : null,
                                cappingPeriod: reward.cappingPeriod,
                                description: reward.description
                            }))
                        }
                    };
                });

                // Limit to top 3 recommendations
                const top3Recommendations = enhancedRecommendations.slice(0, 3);

                // Get statement period dates from transactions
                const transactionDates = await prisma.transaction.aggregate({
                    where: { sessionId: session.id },
                    _min: { date: true },
                    _max: { date: true }
                });

                sendResponse(res, {
                    status: StatusCodes.OK,
                    message: 'Enhanced recommendations retrieved successfully',
                    data: {
                        sessionToken,
                        recommendations: top3Recommendations,
                        criteria: recommendationResult.criteria,
                        summary: recommendationResult.summary,
                        analysis: recommendationResult.analysis,
                        totalCards: recommendationResult.totalCards,
                        processingTimeMs: recommendationResult.processingTimeMs,
                        generatedAt: recommendationResult.generatedAt,
                        sessionSummary: {
                            totalSpend: Number(session.totalSpend || 0),
                            topCategory: session.topCategory,
                            totalTransactions: session.totalTransactions,
                            statementStartDate: transactionDates._min.date,
                            statementEndDate: transactionDates._max.date,
                        },
                    },
                });

            } catch (error) {
                logger.error('Failed to generate enhanced recommendations', {
                    sessionToken,
                    error
                });

                // Fallback to stored recommendations if service fails (limit to top 3)
                const storedRecommendations = await recommendationService.getSessionRecommendations(session.id);
                const top3StoredRecs = storedRecommendations.slice(0, 3);

                // Get statement period dates from transactions
                const transactionDates = await prisma.transaction.aggregate({
                    where: { sessionId: session.id },
                    _min: { date: true },
                    _max: { date: true }
                });

                sendResponse(res, {
                    status: StatusCodes.OK,
                    message: 'Recommendations retrieved successfully (cached)',
                    data: {
                        sessionToken,
                        recommendations: top3StoredRecs,
                        totalRecommendations: top3StoredRecs.length,
                        generatedAt: new Date(),
                        fallback: true,
                        sessionSummary: {
                            totalSpend: Number(session.totalSpend || 0),
                            topCategory: session.topCategory,
                            totalTransactions: session.totalTransactions,
                            statementStartDate: transactionDates._min.date,
                            statementEndDate: transactionDates._max.date,
                        },
                    },
                });
            }
        },
    );

    /**
     * Delete session
     * DELETE /api/v1/sessions/:sessionToken
     */
    deleteSession = asyncHandler(async (req: Request, res: Response) => {
        const { sessionToken } = req.params;

        if (!sessionToken) {
            throw new ApiError('Session token is required', StatusCodes.BAD_REQUEST);
        }

        const session = await this.sessionService.getSessionByToken(sessionToken);

        if (!session) {
            throw new ApiError('Session not found or expired', StatusCodes.NOT_FOUND);
        }

        await this.sessionService.deleteSession(session.id);

        sendResponse(res, {
            status: StatusCodes.OK,
            message: 'Session deleted successfully',
        });
    });

    /**
     * Extend session expiration
     * POST /api/v1/sessions/:sessionToken/extend
     */
    extendSession = asyncHandler(async (req: Request, res: Response) => {
        const { sessionToken } = req.params;
        const { hours = 24 } = req.body;

        if (!sessionToken) {
            throw new ApiError('Session token is required', StatusCodes.BAD_REQUEST);
        }

        const session = await this.sessionService.getSessionByToken(sessionToken);

        if (!session) {
            throw new ApiError('Session not found or expired', StatusCodes.NOT_FOUND);
        }

        await this.sessionService.extendSession(session.id, hours);

        const updatedSession = await this.sessionService.getSessionById(session.id);

        sendResponse(res, {
            status: StatusCodes.OK,
            message: 'Session extended successfully',
            data: {
                sessionToken: updatedSession?.sessionToken,
                expiresAt: updatedSession?.expiresAt,
                extendedBy: hours,
            },
        });
    });

    /**
     * Get session statistics (admin endpoint)
     * GET /api/v1/sessions/stats
     */
    getSessionStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await this.sessionService.getSessionStats();

        sendResponse(res, {
            status: StatusCodes.OK,
            message: 'Session statistics retrieved successfully',
            data: stats,
        });
    });
}
