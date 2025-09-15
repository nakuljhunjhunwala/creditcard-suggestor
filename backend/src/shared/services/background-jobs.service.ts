import { prisma } from '@/database/db';
import {
    ExtractionContext,
    transactionExtractionService,
} from './transaction-extraction.service';
import { categorizationService } from './categorization.service';
import { recommendationService } from './recommendation.service';
import { logger } from '@/shared/utils/logger.util';
import { env } from '@/shared/config/env.config';

/**
 * Background Jobs Service
 * Handles asynchronous processing of PDF uploads and other long-running tasks
 */

export interface JobData {
    sessionId: string;
    sessionToken: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    issuer?: string;
    expectedTransactionCount?: number;
    priority?: number;
}

export interface JobResult {
    success: boolean;
    transactionsExtracted?: number;
    transactionsCategorized?: number;
    recommendationsGenerated?: number;
    processingTimeMs: number;
    error?: string;
    warnings?: string[];
    stats?: any;
}

export interface JobProgress {
    jobId: string;
    sessionId: string;
    step: string;
    progress: number;
    message: string;
    details?: any;
    timestamp: Date;
}

export interface WorkerStats {
    workerId: string;
    isRunning: boolean;
    jobsProcessed: number;
    averageProcessingTime: number;
    lastJobCompletedAt?: Date;
    currentJob?: {
        id: string;
        type: string;
        startedAt: Date;
    };
}

export class BackgroundJobsService {
    private readonly MAX_CONCURRENT_JOBS = env.MAX_CONCURRENT_JOBS;
    private readonly JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    private workers: Map<string, Worker> = new Map();
    private isRunning = false;
    private processingStats = {
        totalJobsProcessed: 0,
        totalProcessingTime: 0,
        jobsByType: new Map<string, number>(),
        jobsByStatus: new Map<string, number>(),
    };

    constructor() {
        this.initialize();
    }

    /**
     * Initialize the job service
     */
    private initialize(): void {
        logger.info('Initializing background jobs service', {
            maxConcurrentJobs: this.MAX_CONCURRENT_JOBS,
            jobTimeoutMs: this.JOB_TIMEOUT_MS,
        });

        // Setup graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    /**
     * Start the job processing workers
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Background jobs service is already running');
            return;
        }

        this.isRunning = true;
        logger.info('Starting background jobs service');

        // Create workers
        for (let i = 0; i < this.MAX_CONCURRENT_JOBS; i++) {
            const workerId = `worker-${i + 1}`;
            const worker = new Worker(workerId, this);
            this.workers.set(workerId, worker);
            worker.start();
        }

        // Start cleanup task for stuck jobs
        this.startCleanupTask();

        logger.info(`Started ${this.workers.size} background job workers`);
    }

    /**
     * Stop the job processing workers
     */
    async shutdown(): Promise<void> {
        if (!this.isRunning) return;

        logger.info('Shutting down background jobs service');
        this.isRunning = false;

        // Stop all workers
        const shutdownPromises = Array.from(this.workers.values()).map((worker) =>
            worker.stop(),
        );
        await Promise.all(shutdownPromises);

        this.workers.clear();
        logger.info('Background jobs service shut down completed');
    }

    /**
     * Queue a PDF processing job
     */
    async queuePDFProcessingJob(jobData: JobData): Promise<string> {
        try {
            const job = await prisma.processingJob.create({
                data: {
                    sessionId: jobData.sessionId,
                    jobType: 'pdf_processing',
                    priority: jobData.priority || 1,
                    status: 'queued',
                    inputData: {
                        sessionToken: jobData.sessionToken,
                        filePath: jobData.filePath,
                        fileName: jobData.fileName,
                        fileSize: jobData.fileSize,
                        issuer: jobData.issuer,
                        expectedTransactionCount: jobData.expectedTransactionCount,
                    },
                },
            });

            logger.info('Queued PDF processing job', {
                jobId: job.id,
                sessionId: jobData.sessionId,
                fileName: jobData.fileName,
            });

            return job.id;
        } catch (error) {
            logger.error('Failed to queue PDF processing job', { jobData, error });
            throw error;
        }
    }

    /**
     * Queue a categorization job
     */
    async queueCategorizationJob(
        sessionId: string,
        priority: number = 2,
    ): Promise<string> {
        try {
            const job = await prisma.processingJob.create({
                data: {
                    sessionId,
                    jobType: 'categorization',
                    priority,
                    status: 'queued',
                    inputData: { sessionId },
                },
            });

            logger.info('Queued categorization job', { jobId: job.id, sessionId });
            return job.id;
        } catch (error) {
            logger.error('Failed to queue categorization job', { sessionId, error });
            throw error;
        }
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId: string): Promise<{
        id: string;
        status: string;
        progress: number;
        currentStep?: string;
        error?: string;
        result?: any;
    } | null> {
        try {
            const job = await prisma.processingJob.findUnique({
                where: { id: jobId },
                select: {
                    id: true,
                    status: true,
                    progress: true,
                    currentStep: true,
                    errorMessage: true,
                    outputData: true,
                },
            });

            if (!job) return null;

            return {
                id: job.id,
                status: job.status,
                progress: job.progress,
                currentStep: job.currentStep || undefined,
                error: job.errorMessage || undefined,
                result: job.outputData || undefined,
            };
        } catch (error) {
            logger.error('Failed to get job status', { jobId, error });
            return null;
        }
    }

    /**
     * Get jobs for a session
     */
    async getSessionJobs(sessionId: string): Promise<any[]> {
        try {
            return await prisma.processingJob.findMany({
                where: { sessionId },
                orderBy: { queuedAt: 'desc' },
                select: {
                    id: true,
                    jobType: true,
                    status: true,
                    progress: true,
                    currentStep: true,
                    queuedAt: true,
                    startedAt: true,
                    completedAt: true,
                    errorMessage: true,
                },
            });
        } catch (error) {
            logger.error('Failed to get session jobs', { sessionId, error });
            return [];
        }
    }

    /**
     * Get processing statistics
     */
    getStats(): {
        isRunning: boolean;
        activeWorkers: number;
        totalJobsProcessed: number;
        averageProcessingTime: number;
        jobsByType: Record<string, number>;
        jobsByStatus: Record<string, number>;
        workers: WorkerStats[];
    } {
        return {
            isRunning: this.isRunning,
            activeWorkers: Array.from(this.workers.values()).filter((w) =>
                w.isRunning(),
            ).length,
            totalJobsProcessed: this.processingStats.totalJobsProcessed,
            averageProcessingTime:
                this.processingStats.totalJobsProcessed > 0
                    ? this.processingStats.totalProcessingTime /
                    this.processingStats.totalJobsProcessed
                    : 0,
            jobsByType: Object.fromEntries(this.processingStats.jobsByType),
            jobsByStatus: Object.fromEntries(this.processingStats.jobsByStatus),
            workers: Array.from(this.workers.values()).map((w) => w.getStats()),
        };
    }

    /**
     * Update job progress
     */
    async updateJobProgress(
        jobId: string,
        progress: number,
        step: string,
        message?: string,
    ): Promise<void> {
        try {
            await prisma.processingJob.update({
                where: { id: jobId },
                data: {
                    progress: Math.min(100, Math.max(0, progress)),
                    currentStep: step,
                    ...(message && { errorMessage: null }), // Clear error if we're making progress
                },
            });
        } catch (error) {
            logger.error('Failed to update job progress', {
                jobId,
                progress,
                step,
                error,
            });
        }
    }

    /**
     * Mark job as completed
     */
    async completeJob(jobId: string, result: JobResult): Promise<void> {
        try {
            await prisma.processingJob.update({
                where: { id: jobId },
                data: {
                    status: result.success ? 'completed' : 'failed',
                    progress: result.success ? 100 : 0,
                    currentStep: result.success ? 'completed' : 'failed',
                    completedAt: new Date(),
                    outputData: JSON.parse(JSON.stringify(result)), // Ensure it's serializable JSON
                    errorMessage: result.error || null,
                },
            });

            // Update processing stats
            this.processingStats.totalJobsProcessed++;
            this.processingStats.totalProcessingTime += result.processingTimeMs;
        } catch (error) {
            logger.error('Failed to complete job', { jobId, error });
        }
    }

    /**
     * Process a single PDF processing job
     */
    async processPDFJob(job: any): Promise<JobResult> {
        const startTime = Date.now();
        let result: JobResult = {
            success: false,
            processingTimeMs: 0,
            error: 'Unknown error',
        };

        try {
            const { inputData } = job;

            await this.updateJobProgress(
                job.id,
                5,
                'initializing',
                'Starting PDF processing',
            );

            // Create extraction context
            const context: ExtractionContext = {
                sessionId: job.sessionId,
                sessionToken: inputData.sessionToken,
                filePath: inputData.filePath,
                fileName: inputData.fileName,
                fileSize: inputData.fileSize,
                issuer: inputData.issuer,
                expectedTransactionCount: inputData.expectedTransactionCount,
            };

            // Step 1: Extract transactions
            await this.updateJobProgress(
                job.id,
                10,
                'extracting',
                'Extracting transactions from PDF',
            );

            const extractionResult =
                await transactionExtractionService.extractTransactionsFromPDF(
                    context,
                    async (progress) => {
                        await this.updateJobProgress(
                            job.id,
                            10 + progress.progress * 0.6, // 10-70% for extraction
                            progress.step,
                            progress.message,
                        );
                    },
                );

            if (!extractionResult.success) {
                throw new Error('Transaction extraction failed');
            }

            // Step 2: Categorize transactions
            await this.updateJobProgress(
                job.id,
                70,
                'categorizing',
                'Categorizing transactions',
            );

            const categorizationResult =
                await categorizationService.categorizeSessionTransactions(
                    job.sessionId,
                    async (progress) => {
                        await this.updateJobProgress(
                            job.id,
                            70 + progress.progress * 0.15, // 70-85% for categorization
                            progress.step,
                            progress.message,
                        );
                    },
                );

            // Step 3: Generate recommendations
            await this.updateJobProgress(
                job.id,
                85,
                'analyzing',
                'Generating credit card recommendations',
            );

            const recommendationResult =
                await recommendationService.generateRecommendations(job.sessionId);

            // Step 4: Complete processing
            await this.updateJobProgress(
                job.id,
                95,
                'finalizing',
                'Completing processing',
            );

            result = {
                success: true,
                transactionsExtracted: extractionResult.totalExtracted,
                transactionsCategorized:
                    categorizationResult.stats.successfullyCategorized,
                recommendationsGenerated: recommendationResult.recommendations.length,
                processingTimeMs: Date.now() - startTime,
                warnings: extractionResult.extractionStats.warnings,
                stats: {
                    extraction: extractionResult.extractionStats,
                    categorization: categorizationResult.stats,
                    recommendations: {
                        total: recommendationResult.recommendations.length,
                        averageScore: recommendationResult.summary.averageScore,
                        topRecommendation: recommendationResult.summary.topRecommendation,
                        potentialSavings: recommendationResult.summary.potentialSavings,
                        categoriesAnalyzed: recommendationResult.summary.categoriesAnalyzed,
                    },
                },
            };

            // Update session to completed status
            await prisma.session.update({
                where: { id: job.sessionId },
                data: {
                    status: 'completed',
                    progress: 100,
                    totalTransactions: result.transactionsExtracted,
                    categorizedCount: result.transactionsCategorized,
                },
            });

            logger.info('PDF processing job completed successfully', {
                jobId: job.id,
                sessionId: job.sessionId,
                transactionsExtracted: result.transactionsExtracted,
                transactionsCategorized: result.transactionsCategorized,
                recommendationsGenerated: result.recommendationsGenerated,
                processingTimeMs: result.processingTimeMs,
            });
        } catch (error) {
            result = {
                success: false,
                processingTimeMs: Date.now() - startTime,
                error:
                    error instanceof Error ? error.message : 'Unknown processing error',
            };

            logger.error('PDF processing job failed', {
                jobId: job.id,
                sessionId: job.sessionId,
                error,
            });
        }

        return result;
    }

    /**
     * Start cleanup task for stuck jobs
     */
    private startCleanupTask(): void {
        const cleanupInterval = 5 * 60 * 1000; // 5 minutes

        setInterval(async () => {
            try {
                await this.cleanupStuckJobs();
            } catch (error) {
                logger.error('Job cleanup task failed', error);
            }
        }, cleanupInterval);

        logger.info('Started job cleanup task', { intervalMs: cleanupInterval });
    }

    /**
     * Clean up stuck or timed-out jobs
     */
    private async cleanupStuckJobs(): Promise<void> {
        try {
            const timeoutThreshold = new Date(Date.now() - this.JOB_TIMEOUT_MS);

            // Find jobs that are processing but haven't updated in a while
            const stuckJobs = await prisma.processingJob.findMany({
                where: {
                    status: 'processing',
                    updatedAt: { lt: timeoutThreshold },
                },
            });

            if (stuckJobs.length > 0) {
                logger.warn(`Found ${stuckJobs.length} stuck jobs, marking as failed`);

                await prisma.processingJob.updateMany({
                    where: {
                        id: { in: stuckJobs.map((j: any) => j.id) },
                    },
                    data: {
                        status: 'failed',
                        errorMessage: 'Job timed out or became stuck',
                        completedAt: new Date(),
                    },
                });
            }
        } catch (error) {
            logger.error('Failed to cleanup stuck jobs', error);
        }
    }
}

/**
 * Worker class for processing jobs
 */
class Worker {
    private workerId: string;
    private jobsService: BackgroundJobsService;
    private isActive = false;
    private currentJob: any = null;
    private stats = {
        jobsProcessed: 0,
        totalProcessingTime: 0,
        lastJobCompletedAt: null as Date | null,
    };

    constructor(workerId: string, jobsService: BackgroundJobsService) {
        this.workerId = workerId;
        this.jobsService = jobsService;
    }

    /**
     * Start the worker
     */
    async start(): Promise<void> {
        this.isActive = true;
        logger.info(`Starting worker ${this.workerId}`);

        // Start processing loop
        this.processLoop();
    }

    /**
     * Stop the worker
     */
    async stop(): Promise<void> {
        logger.info(`Stopping worker ${this.workerId}`);
        this.isActive = false;

        // Wait for current job to complete if any
        if (this.currentJob) {
            logger.info(
                `Worker ${this.workerId} waiting for current job to complete`,
            );
            // Give it some time to finish gracefully
            await this.delay(5000);
        }

        logger.info(`Worker ${this.workerId} stopped`);
    }

    /**
     * Get worker statistics
     */
    getStats(): WorkerStats {
        return {
            workerId: this.workerId,
            isRunning: this.isActive,
            jobsProcessed: this.stats.jobsProcessed,
            averageProcessingTime:
                this.stats.jobsProcessed > 0
                    ? this.stats.totalProcessingTime / this.stats.jobsProcessed
                    : 0,
            lastJobCompletedAt: this.stats.lastJobCompletedAt || undefined,
            currentJob: this.currentJob
                ? {
                    id: this.currentJob.id,
                    type: this.currentJob.jobType,
                    startedAt: this.currentJob.startedAt,
                }
                : undefined,
        };
    }

    /**
     * Check if worker is running
     */
    isRunning(): boolean {
        return this.isActive;
    }

    /**
     * Main processing loop
     */
    private async processLoop(): Promise<void> {
        let noJobsCount = 0;

        while (this.isActive) {
            try {
                const job = await this.getNextJob();

                if (job) {
                    noJobsCount = 0; // Reset counter when job is found
                    await this.processJob(job);
                } else {
                    // No jobs available, use exponential backoff
                    noJobsCount++;
                    const baseDelay = 2000; // 2 seconds
                    const maxDelay = 30000; // 30 seconds max
                    const delay = Math.min(baseDelay * Math.pow(1.5, Math.min(noJobsCount, 10)), maxDelay);

                    await this.delay(delay);
                }
            } catch (error) {
                logger.error(`Worker ${this.workerId} processing error`, error);
                await this.delay(5000); // Wait longer on error
            }
        }
    }

    /**
     * Get the next job to process
     */
    private async getNextJob(): Promise<any> {
        try {
            // Use a transaction to atomically claim a job
            return await prisma.$transaction(async (tx: any) => {
                const job = await tx.processingJob.findFirst({
                    where: { status: 'queued' },
                    orderBy: [{ priority: 'asc' }, { queuedAt: 'asc' }],
                });

                if (!job) return null;

                // Claim the job
                await tx.processingJob.update({
                    where: { id: job.id },
                    data: {
                        status: 'processing',
                        startedAt: new Date(),
                    },
                });

                return job;
            });
        } catch (error) {
            logger.error(`Worker ${this.workerId} failed to get next job`, error);
            return null;
        }
    }

    /**
     * Process a single job
     */
    private async processJob(job: any): Promise<void> {
        const startTime = Date.now();
        this.currentJob = { ...job, startedAt: new Date() };

        try {
            logger.info(`Worker ${this.workerId} processing job`, {
                jobId: job.id,
                jobType: job.jobType,
                sessionId: job.sessionId,
            });

            let result: JobResult;

            switch (job.jobType) {
                case 'pdf_processing':
                    result = await this.jobsService.processPDFJob(job);
                    break;

                case 'categorization':
                    // TODO: Implement standalone categorization job
                    result = {
                        success: false,
                        error: 'Categorization job not implemented',
                        processingTimeMs: 0,
                    };
                    break;

                default:
                    result = {
                        success: false,
                        error: `Unknown job type: ${job.jobType}`,
                        processingTimeMs: 0,
                    };
            }

            await this.jobsService.completeJob(job.id, result);

            // Update worker stats
            const processingTime = Date.now() - startTime;
            this.stats.jobsProcessed++;
            this.stats.totalProcessingTime += processingTime;
            this.stats.lastJobCompletedAt = new Date();

            logger.info(`Worker ${this.workerId} completed job`, {
                jobId: job.id,
                success: result.success,
                processingTimeMs: processingTime,
            });
        } catch (error) {
            logger.error(`Worker ${this.workerId} job processing failed`, {
                jobId: job.id,
                error,
            });

            const result: JobResult = {
                success: false,
                processingTimeMs: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };

            await this.jobsService.completeJob(job.id, result);
        } finally {
            this.currentJob = null;
        }
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const backgroundJobsService = new BackgroundJobsService();
