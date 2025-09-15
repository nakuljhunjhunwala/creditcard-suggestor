import {
    // ParsedPDFResult,
    pdfParserService,
    PDFParsingStats,
} from './pdf-parser.service';
import {
    geminiAIService,
    Transaction,
    // TransactionExtractionResult,
} from './gemini-ai.service';
import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';

/**
 * Transaction Extraction Service
 * Orchestrates PDF parsing and AI-based transaction extraction
 */

export interface ExtractionContext {
    sessionId: string;
    sessionToken: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    issuer?: string;
    expectedTransactionCount?: number;
}

export interface ExtractionResult {
    success: boolean;
    transactions: Transaction[];
    totalExtracted: number;
    pdfStats: PDFParsingStats;
    extractionStats: {
        confidence: number;
        processingTime: number;
        aiTokensUsed?: number;
        validationIssues: string[];
        warnings: string[];
    };
    metadata: {
        fileName: string;
        fileSize: number;
        pdfPages: number;
        textLength: number;
        extractedAt: Date;
    };
}

export interface ExtractionProgress {
    step: string;
    progress: number; // 0-100
    message: string;
    details?: any;
}

export class TransactionExtractionService {
    /**
     * Extract transactions from uploaded PDF file
     */
    async extractTransactionsFromPDF(
        context: ExtractionContext,
        onProgress?: (progress: ExtractionProgress) => Promise<void>,
    ): Promise<ExtractionResult> {
        const startTime = Date.now();

        try {
            logger.info('Starting transaction extraction process', {
                sessionId: context.sessionId,
                fileName: context.fileName,
                fileSize: context.fileSize,
            });

            // Step 1: Parse PDF (20% progress)
            await this.reportProgress(onProgress, {
                step: 'parsing_pdf',
                progress: 10,
                message: 'Parsing PDF file and extracting text',
            });

            const pdfResult = await pdfParserService.parsePDF(context.filePath);
            const pdfStats = pdfParserService.analyzePDFContent(pdfResult);

            await this.reportProgress(onProgress, {
                step: 'pdf_parsed',
                progress: 20,
                message: `PDF parsed successfully - ${pdfStats.totalWords} words, ${pdfResult.pages} pages`,
                details: { pages: pdfResult.pages, words: pdfStats.totalWords },
            });

            // Validate PDF content quality
            this.validatePDFForTransactions(pdfStats);

            // Step 2: Clean text for AI processing (30% progress)
            await this.reportProgress(onProgress, {
                step: 'preparing_text',
                progress: 30,
                message: 'Preparing text for AI analysis',
            });

            const cleanedText = pdfParserService.cleanTextForAI(pdfResult.text);

            // Step 3: Extract transactions with AI (60% progress)
            await this.reportProgress(onProgress, {
                step: 'ai_extraction',
                progress: 40,
                message: 'Analyzing text with AI to extract transactions',
            });

            const aiResult = await geminiAIService.extractTransactions(cleanedText, {
                fileName: context.fileName,
                fileSize: context.fileSize,
                issuer: context.issuer,
                expectedTransactionCount: context.expectedTransactionCount,
            });

            await this.reportProgress(onProgress, {
                step: 'ai_completed',
                progress: 60,
                message: `AI extraction completed - found ${aiResult.totalFound} transactions`,
                details: {
                    transactionsFound: aiResult.totalFound,
                    confidence: aiResult.confidence,
                },
            });

            // Step 4: Validate and clean transactions (80% progress)
            await this.reportProgress(onProgress, {
                step: 'validating_data',
                progress: 70,
                message: 'Validating extracted transaction data',
            });

            const validation = geminiAIService.validateTransactionData(
                aiResult.transactions,
            );
            const cleanedTransactions = this.cleanAndValidateTransactions(
                aiResult.transactions,
            );

            // Step 5: Store transactions in database (90% progress)
            await this.reportProgress(onProgress, {
                step: 'storing_data',
                progress: 80,
                message: 'Storing transactions in database',
            });

            await this.storeTransactions(context.sessionId, cleanedTransactions);

            // Step 6: Complete processing (100% progress)
            await this.reportProgress(onProgress, {
                step: 'completed',
                progress: 90,
                message: 'Transaction extraction completed successfully',
            });

            const processingTime = Date.now() - startTime;

            const result: ExtractionResult = {
                success: true,
                transactions: cleanedTransactions,
                totalExtracted: cleanedTransactions.length,
                pdfStats,
                extractionStats: {
                    confidence: aiResult.confidence,
                    processingTime,
                    validationIssues: validation.issues,
                    warnings: [
                        ...(aiResult.warnings || []),
                        ...(validation.suggestions || []),
                    ],
                },
                metadata: {
                    fileName: context.fileName,
                    fileSize: context.fileSize,
                    pdfPages: pdfResult.pages,
                    textLength: pdfResult.text.length,
                    extractedAt: new Date(),
                },
            };

            logger.info('Transaction extraction completed successfully', {
                sessionId: context.sessionId,
                transactionsExtracted: result.totalExtracted,
                processingTimeMs: processingTime,
                confidence: result.extractionStats.confidence,
            });

            return result;
        } catch (error) {
            logger.error('Transaction extraction failed', {
                sessionId: context.sessionId,
                fileName: context.fileName,
                error,
            });

            await this.reportProgress(onProgress, {
                step: 'failed',
                progress: 0,
                message: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });

            throw error;
        }
    }

    /**
     * Extract transactions for multiple files (batch processing)
     */
    async extractTransactionsBatch(
        contexts: ExtractionContext[],
        onProgress?: (
            sessionId: string,
            progress: ExtractionProgress,
        ) => Promise<void>,
    ): Promise<Record<string, ExtractionResult | Error>> {
        const results: Record<string, ExtractionResult | Error> = {};

        logger.info(
            `Starting batch transaction extraction for ${contexts.length} files`,
        );

        for (const context of contexts) {
            try {
                const progressCallback = onProgress
                    ? (progress: ExtractionProgress) =>
                        onProgress(context.sessionId, progress)
                    : undefined;

                results[context.sessionId] = await this.extractTransactionsFromPDF(
                    context,
                    progressCallback,
                );

                // Add delay between files to prevent overwhelming the AI service
                if (contexts.length > 1) {
                    await this.delay(2000); // 2 second delay
                }
            } catch (error) {
                logger.error(
                    `Batch extraction failed for session ${context.sessionId}`,
                    error,
                );
                results[context.sessionId] =
                    error instanceof Error
                        ? error
                        : new Error('Unknown extraction error');
            }
        }

        logger.info('Batch transaction extraction completed', {
            total: contexts.length,
            successful: Object.values(results).filter((r) => !(r instanceof Error))
                .length,
            failed: Object.values(results).filter((r) => r instanceof Error).length,
        });

        return results;
    }

    /**
     * Re-extract transactions with different parameters
     */
    async reExtractTransactions(
        sessionId: string,
        options: {
            useHigherConfidenceThreshold?: boolean;
            expectedTransactionCount?: number;
            forcedIssuer?: string;
            skipValidation?: boolean;
        },
    ): Promise<ExtractionResult> {
        // Get session and file info from database
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session?.filePath) {
            throw new ApiError(
                'Session or file not found for re-extraction',
                StatusCodes.NOT_FOUND,
            );
        }

        const context: ExtractionContext = {
            sessionId: session.id,
            sessionToken: session.sessionToken,
            filePath: session.filePath,
            fileName: session.fileName || 'unknown.pdf',
            fileSize: session.fileSize || 0,
            issuer: options.forcedIssuer,
            expectedTransactionCount: options.expectedTransactionCount,
        };

        return this.extractTransactionsFromPDF(context);
    }

    /**
     * Get extraction statistics for a session
     */
    async getExtractionStats(sessionId: string): Promise<{
        transactionCount: number;
        averageConfidence: number;
        categoryBreakdown: Record<string, number>;
        amountRange: { min: number; max: number; total: number };
        dateRange: { earliest: Date; latest: Date };
        topMerchants: Array<{
            merchant: string;
            count: number;
            totalAmount: number;
        }>;
    } | null> {
        const transactions = await prisma.transaction.findMany({
            where: { sessionId },
            select: {
                amount: true,
                date: true,
                merchant: true,
                categoryName: true,
                confidence: true,
            },
        });

        if (transactions.length === 0) {
            return null;
        }

        // Calculate statistics
        const amounts = transactions.map((t) => Number(t.amount));
        const dates = transactions.map((t) => t.date);
        const confidences = transactions.map((t) => Number(t.confidence || 0.5));

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        transactions.forEach((t) => {
            const category = t.categoryName || 'Uncategorized';
            categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
        });

        // Top merchants
        const merchantMap: Record<string, { count: number; totalAmount: number }> =
            {};
        transactions.forEach((t) => {
            const merchant = t.merchant || 'Unknown';
            if (!merchantMap[merchant]) {
                merchantMap[merchant] = { count: 0, totalAmount: 0 };
            }
            merchantMap[merchant].count++;
            merchantMap[merchant].totalAmount += Number(t.amount);
        });

        const topMerchants = Object.entries(merchantMap)
            .map(([merchant, data]) => ({ merchant, ...data }))
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);

        return {
            transactionCount: transactions.length,
            averageConfidence:
                confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
            categoryBreakdown,
            amountRange: {
                min: Math.min(...amounts),
                max: Math.max(...amounts),
                total: amounts.reduce((sum, a) => sum + a, 0),
            },
            dateRange: {
                earliest: new Date(Math.min(...dates.map((d) => d.getTime()))),
                latest: new Date(Math.max(...dates.map((d) => d.getTime()))),
            },
            topMerchants,
        };
    }

    /**
     * Validate PDF content for transaction extraction
     */
    private validatePDFForTransactions(stats: PDFParsingStats): void {
        if (!stats.likelyTransactionData) {
            throw new ApiError(
                'PDF does not appear to contain transaction data. Please ensure you upload a credit card or bank statement.',
                StatusCodes.BAD_REQUEST,
            );
        }

        if (stats.totalWords < 50) {
            throw new ApiError(
                'PDF contains insufficient text content for transaction extraction.',
                StatusCodes.BAD_REQUEST,
            );
        }

        if (!stats.containsNumbers || !stats.containsDollarSigns) {
            throw new ApiError(
                'PDF does not contain expected financial data (amounts, currency symbols).',
                StatusCodes.BAD_REQUEST,
            );
        }
    }

    /**
     * Clean and validate transactions before storage
     */
    private cleanAndValidateTransactions(
        transactions: Transaction[],
    ): Transaction[] {
        return transactions
            .filter((t) => {
                // Filter out invalid transactions
                if (!t.date || !t.merchant || typeof t.amount !== 'number') {
                    return false;
                }

                // Filter out zero amounts (unless it's a specific transaction type)
                if (t.amount === 0 && !['fee', 'interest'].includes(t.type)) {
                    return false;
                }

                // Filter out very low confidence transactions
                if (t.confidence < 0.3) {
                    return false;
                }

                return true;
            })
            .map((t) => {
                // Clean merchant names
                const cleanMerchant = t.merchant
                    .replace(/\s+/g, ' ')
                    .replace(/[^a-zA-Z0-9\s&'-]/g, '')
                    .trim();

                return {
                    ...t,
                    merchant: cleanMerchant,
                    description: t.description.trim(),
                    // Ensure confidence is within bounds
                    confidence: Math.max(0, Math.min(1, t.confidence)),
                };
            });
    }

    /**
     * Store transactions in database
     */
    private async storeTransactions(
        sessionId: string,
        transactions: Transaction[],
    ): Promise<void> {
        if (transactions.length === 0) {
            logger.warn('No transactions to store', { sessionId });
            return;
        }

        try {
            // Delete existing transactions for this session (in case of re-extraction)
            await prisma.transaction.deleteMany({
                where: { sessionId },
            });

            // Insert new transactions
            await prisma.transaction.createMany({
                data: transactions.map((t) => ({
                    sessionId,
                    date: new Date(t.date),
                    description: t.description,
                    merchant: t.merchant,
                    amount: t.amount,
                    type: t.type,
                    confidence: t.confidence,
                    // These will be filled in by categorization service
                    mccCode: null,
                    categoryName: null,
                    subCategoryName: null,
                    mccStatus: 'unknown',
                    mccConfidence: null,
                    isVerified: false,
                    needsReview: t.confidence < 0.8,
                })),
            });

            logger.info(`Stored ${transactions.length} transactions`, { sessionId });
        } catch (error) {
            logger.error('Failed to store transactions', { sessionId, error });
            throw new ApiError(
                'Failed to store extracted transactions',
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Report progress to callback
     */
    private async reportProgress(
        callback: ((progress: ExtractionProgress) => Promise<void>) | undefined,
        progress: ExtractionProgress,
    ): Promise<void> {
        if (callback) {
            try {
                await callback(progress);
            } catch (error) {
                logger.warn('Progress callback failed', { error, progress });
            }
        }
    }

    /**
     * Add delay between operations
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const transactionExtractionService = new TransactionExtractionService();
