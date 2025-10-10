import { prisma } from '@/database/db';
import {
    mccDiscoveryService,
    MerchantMCCResult,
} from './mcc-discovery.service';
import { categoryMappingService, CategoryMappingResult } from './category-mapping.service';
import { logger } from '@/shared/utils/logger.util';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';

/**
 * Transaction Categorization Service
 * Handles categorizing transactions using MCC codes and merchant patterns
 */

export interface TransactionToProcess {
    id: string;
    merchant: string;
    amount: number;
    description: string;
    currentMccCode?: string | null;
    currentCategory?: string | null;
}

export interface CategoryResult {
    transactionId: string;
    mccCode: string;
    mccDescription: string;
    categoryId: string;
    categoryName: string;
    subCategoryId?: string;
    subCategoryName?: string;
    confidence: number;
    source: string;
    reasoning?: string;
    needsReview: boolean;
    mappingInfo?: {
        isExactMatch: boolean;
        fallbackUsed: boolean;
        originalCategory?: string;
        originalSubCategory?: string;
    };
}

export interface CategorizationStats {
    totalProcessed: number;
    successfullyCategorized: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    needsReview: number;
    failed: number;
    byCategory: Record<string, number>;
    bySource: Record<string, number>;
    averageConfidence: number;
    processingTimeMs: number;
}

export interface CategorizationProgress {
    step: string;
    progress: number;
    processed: number;
    total: number;
    currentTransaction?: string;
    message: string;
}

export class CategorizationService {
    private readonly HIGH_CONFIDENCE_THRESHOLD = 0.85;
    private readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.7;
    private readonly REVIEW_THRESHOLD = 0.6;

    /**
     * Categorize all transactions for a session
     */
    async categorizeSessionTransactions(
        sessionId: string,
        onProgress?: (progress: CategorizationProgress) => Promise<void>,
    ): Promise<{
        results: CategoryResult[];
        stats: CategorizationStats;
    }> {
        const startTime = Date.now();

        try {
            logger.info('Starting transaction categorization', { sessionId });

            // Get uncategorized transactions
            const transactions = await prisma.transaction.findMany({
                where: {
                    sessionId,
                    OR: [
                        { mccCode: null },
                        { categoryName: null },
                        { mccStatus: 'unknown' },
                    ],
                },
                select: {
                    id: true,
                    merchant: true,
                    amount: true,
                    description: true,
                    mccCode: true,
                    categoryName: true,
                },
            });

            await this.reportProgress(onProgress, {
                step: 'loaded_transactions',
                progress: 5,
                processed: 0,
                total: transactions.length,
                message: `Loaded ${transactions.length} transactions for categorization`,
            });

            if (transactions.length === 0) {
                logger.info('No transactions to categorize', { sessionId });
                return {
                    results: [],
                    stats: this.createEmptyStats(0),
                };
            }

            // Step 1: Discover MCC codes for unknown merchants
            await this.reportProgress(onProgress, {
                step: 'discovering_mcc',
                progress: 10,
                processed: 0,
                total: transactions.length,
                message: 'Discovering MCC codes for merchants',
            });

            const unknownMerchants = [
                ...new Set(
                    transactions
                        .filter((t) => !t.mccCode)
                        .map((t) => t.merchant)
                        .filter((merchant): merchant is string => Boolean(merchant)),
                ),
            ];

            const mccResults =
                await mccDiscoveryService.discoverMCCCodes(unknownMerchants);

            await this.reportProgress(onProgress, {
                step: 'mcc_discovered',
                progress: 40,
                processed: 0,
                total: transactions.length,
                message: `Discovered MCC codes for ${mccResults.results.length} merchants`,
            });

            // Step 2: Load category mappings
            const [categories, subCategories, mccCategoryMappings] =
                await Promise.all([
                    this.loadCategories(),
                    this.loadSubCategories(),
                    this.loadMCCCategoryMappings(),
                ]);

            await this.reportProgress(onProgress, {
                step: 'mappings_loaded',
                progress: 50,
                processed: 0,
                total: transactions.length,
                message: 'Loaded category mappings',
            });

            // Step 3: Categorize each transaction
            const results: CategoryResult[] = [];
            const mccLookup = new Map(
                mccResults.results.map((r) => [r.merchantName.toLowerCase(), r]),
            );

            for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                // Skip transactions without merchants
                if (!transaction.merchant) {
                    logger.warn('Skipping transaction without merchant', {
                        transactionId: transaction.id,
                        description: transaction.description,
                    });
                    continue;
                }

                try {
                    const result = await this.categorizeTransaction(
                        {
                            ...transaction,
                            merchant: transaction.merchant, // Now guaranteed to be string
                            amount: Number(transaction.amount), // Convert Decimal to number
                        },
                        {
                            mccLookup,
                            categories,
                            subCategories,
                            mccCategoryMappings,
                        },
                    );

                    if (result) {
                        results.push(result);
                        logger.debug('Transaction categorized successfully', {
                            transactionId: transaction.id,
                            merchant: transaction.merchant,
                            category: result.categoryName,
                            subCategory: result.subCategoryName,
                            confidence: result.confidence,
                        });
                    } else {
                        logger.warn('Transaction categorization returned null', {
                            transactionId: transaction.id,
                            merchant: transaction.merchant,
                        });
                    }
                } catch (error) {
                    logger.error('Unexpected error during transaction categorization', {
                        transactionId: transaction.id,
                        merchant: transaction.merchant,
                        error: {
                            name: error instanceof Error ? error.name : 'Unknown',
                            message: error instanceof Error ? error.message : String(error),
                        },
                    });
                    // Continue processing other transactions
                    continue;
                }

                const progress = 50 + ((i + 1) / transactions.length) * 40; // 50-90%
                await this.reportProgress(onProgress, {
                    step: 'categorizing',
                    progress,
                    processed: i + 1,
                    total: transactions.length,
                    currentTransaction: transaction.merchant,
                    message: `Categorizing transaction: ${transaction.merchant}`,
                });
            }

            // Step 4: Update transactions in database
            await this.reportProgress(onProgress, {
                step: 'updating_database',
                progress: 90,
                processed: transactions.length,
                total: transactions.length,
                message: 'Updating transactions with categories',
            });

            await this.updateTransactionCategories(results);

            // Step 5: Calculate statistics
            const stats = this.calculateStats(results, Date.now() - startTime);

            await this.reportProgress(onProgress, {
                step: 'completed',
                progress: 100,
                processed: transactions.length,
                total: transactions.length,
                message: `Categorization completed - ${results.length} transactions processed`,
            });

            // Update session with categorization stats
            await this.updateSessionStats(sessionId, stats);

            logger.info('Transaction categorization completed', {
                sessionId,
                totalProcessed: stats.totalProcessed,
                successfullyCategorized: stats.successfullyCategorized,
                processingTimeMs: stats.processingTimeMs,
            });

            return { results, stats };
        } catch (error) {
            logger.error('Transaction categorization failed', { sessionId, error });
            throw error;
        }
    }

    /**
     * Categorize a single transaction
     */
    async categorizeTransaction(
        transaction: TransactionToProcess,
        context: {
            mccLookup: Map<string, MerchantMCCResult>;
            categories: any[];
            subCategories: any[];
            mccCategoryMappings: Map<string, any>;
        },
    ): Promise<CategoryResult | null> {
        try {
            const merchant = transaction.merchant?.toLowerCase() || '';
            let mccInfo = null;
            let source = 'unknown';

            // Step 1: Get MCC code (existing or discovered)
            if (transaction.currentMccCode) {
                mccInfo = {
                    mccCode: transaction.currentMccCode,
                    confidence: 1.0,
                };
                source = 'existing';
            } else {
                const discoveredMcc = context.mccLookup.get(merchant);
                if (discoveredMcc) {
                    mccInfo = {
                        mccCode: discoveredMcc.mccCode,
                        confidence: discoveredMcc.confidence,
                    };
                    source = discoveredMcc.source;
                }
            }

            if (!mccInfo) {
                // Try to infer from transaction description or amount patterns
                mccInfo = this.inferMCCFromTransaction(transaction);
                source = 'inferred';
            }

            if (!mccInfo) {
                logger.warn('Could not determine MCC for transaction', {
                    transactionId: transaction.id,
                    merchant: transaction.merchant,
                });
                return null;
            }

            // Step 2: Map MCC to category
            const categoryMapping = this.mapMCCToCategory(mccInfo.mccCode, context);

            if (!categoryMapping) {
                logger.warn('Could not map MCC to category', {
                    transactionId: transaction.id,
                    mccCode: mccInfo.mccCode,
                });
                return null;
            }

            // Step 3: Apply business rules and adjustments
            const finalCategory = this.applyBusinessRules(
                transaction,
                categoryMapping,
                mccInfo,
            );

            // Step 4: Validate and map to our predefined categories
            const mappingResult = await categoryMappingService.mapCategory(
                finalCategory.categoryName,
                finalCategory.subCategoryName,
                mccInfo.mccCode
            );

            if (!mappingResult.mapping) {
                logger.error('Failed to map to predefined categories', {
                    transactionId: transaction.id,
                    mccCode: mccInfo.mccCode,
                    originalCategory: finalCategory.categoryName,
                    originalSubCategory: finalCategory.subCategoryName,
                });
                return null;
            }

            // Step 5: Calculate confidence and review needs
            const confidence = this.calculateOverallConfidence(
                mccInfo.confidence,
                Math.min(finalCategory.confidence, mappingResult.mapping.confidence),
            );
            const needsReview =
                confidence < this.REVIEW_THRESHOLD ||
                mappingResult.fallbackUsed ||
                this.requiresManualReview(transaction, finalCategory);

            return {
                transactionId: transaction.id,
                mccCode: mccInfo.mccCode,
                mccDescription:
                    finalCategory.mccDescription || `MCC ${mccInfo.mccCode}`,
                categoryId: mappingResult.mapping.categoryId,
                categoryName: mappingResult.mapping.categoryName,
                subCategoryId: mappingResult.mapping.subCategoryId,
                subCategoryName: mappingResult.mapping.subCategoryName,
                confidence,
                source,
                reasoning: finalCategory.reasoning,
                needsReview,
                mappingInfo: {
                    isExactMatch: mappingResult.isExactMatch,
                    fallbackUsed: mappingResult.fallbackUsed,
                    originalCategory: mappingResult.originalCategory,
                    originalSubCategory: mappingResult.originalSubCategory,
                },
            };
        } catch (error) {
            logger.error('Failed to categorize transaction', {
                transactionId: transaction.id,
                merchant: transaction.merchant,
                amount: transaction.amount,
                description: transaction.description,
                error: {
                    name: error instanceof Error ? error.name : 'Unknown',
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                },
            });
            return null;
        }
    }

    /**
     * Recategorize transactions with updated rules
     */
    async recategorizeTransactions(
        sessionId: string,
        options: {
            forceRecategorize?: boolean;
            onlyLowConfidence?: boolean;
            specificTransactionIds?: string[];
        } = {},
    ): Promise<{
        updated: number;
        unchanged: number;
        errors: number;
    }> {
        try {
            const whereClause: any = { sessionId };

            if (options.specificTransactionIds?.length) {
                whereClause.id = { in: options.specificTransactionIds };
            } else if (options.onlyLowConfidence) {
                whereClause.confidence = { lt: this.MEDIUM_CONFIDENCE_THRESHOLD };
            } else if (!options.forceRecategorize) {
                whereClause.OR = [
                    { categoryName: null },
                    { confidence: { lt: this.REVIEW_THRESHOLD } },
                ];
            }

            const transactions = await prisma.transaction.findMany({
                where: whereClause,
                select: {
                    id: true,
                    merchant: true,
                    amount: true,
                    description: true,
                    mccCode: true,
                    categoryName: true,
                },
            });

            const results = await this.categorizeSessionTransactions(sessionId);

            return {
                updated: results.stats.successfullyCategorized,
                unchanged: transactions.length - results.stats.successfullyCategorized,
                errors: results.stats.failed,
            };
        } catch (error) {
            logger.error('Recategorization failed', { sessionId, error });
            throw error;
        }
    }

    /**
     * Get categorization insights for a session
     */
    async getCategorizationInsights(sessionId: string): Promise<{
        categoryBreakdown: Array<{
            category: string;
            subCategory?: string;
            count: number;
            totalAmount: number;
            averageAmount: number;
            confidence: number;
        }>;
        confidenceDistribution: {
            high: number;
            medium: number;
            low: number;
            needsReview: number;
        };
        topMerchants: Array<{
            merchant: string;
            category: string;
            count: number;
            totalAmount: number;
        }>;
        uncategorized: number;
        totalTransactions: number;
    }> {
        const transactions = await prisma.transaction.findMany({
            where: { sessionId },
            select: {
                merchant: true,
                amount: true,
                categoryName: true,
                subCategoryName: true,
                confidence: true,
                needsReview: true,
            },
        });

        // Category breakdown
        const categoryMap = new Map<
            string,
            {
                count: number;
                totalAmount: number;
                confidences: number[];
                subCategory?: string;
            }
        >();

        transactions.forEach((t) => {
            if (!t.categoryName) return;

            const key = t.categoryName;
            if (!categoryMap.has(key)) {
                categoryMap.set(key, {
                    count: 0,
                    totalAmount: 0,
                    confidences: [],
                    subCategory: t.subCategoryName || undefined,
                });
            }

            const entry = categoryMap.get(key)!;
            entry.count++;
            entry.totalAmount += Number(t.amount);
            entry.confidences.push(Number(t.confidence || 0.5));
        });

        const categoryBreakdown = Array.from(categoryMap.entries()).map(
            ([category, data]) => ({
                category,
                subCategory: data.subCategory,
                count: data.count,
                totalAmount: data.totalAmount,
                averageAmount: data.totalAmount / data.count,
                confidence:
                    data.confidences.reduce((sum, c) => sum + c, 0) /
                    data.confidences.length,
            }),
        );

        // Confidence distribution
        const confidenceDistribution = {
            high: transactions.filter(
                (t) => Number(t.confidence || 0) >= this.HIGH_CONFIDENCE_THRESHOLD,
            ).length,
            medium: transactions.filter(
                (t) =>
                    Number(t.confidence || 0) >= this.MEDIUM_CONFIDENCE_THRESHOLD &&
                    Number(t.confidence || 0) < this.HIGH_CONFIDENCE_THRESHOLD,
            ).length,
            low: transactions.filter(
                (t) =>
                    Number(t.confidence || 0) < this.MEDIUM_CONFIDENCE_THRESHOLD &&
                    Number(t.confidence || 0) >= this.REVIEW_THRESHOLD,
            ).length,
            needsReview: transactions.filter((t) => t.needsReview).length,
        };

        // Top merchants
        const merchantMap = new Map<
            string,
            { count: number; totalAmount: number; category: string }
        >();
        transactions.forEach((t) => {
            if (!t.merchant || !t.categoryName) return;

            if (!merchantMap.has(t.merchant)) {
                merchantMap.set(t.merchant, {
                    count: 0,
                    totalAmount: 0,
                    category: t.categoryName,
                });
            }

            const entry = merchantMap.get(t.merchant)!;
            entry.count++;
            entry.totalAmount += Number(t.amount);
        });

        const topMerchants = Array.from(merchantMap.entries())
            .map(([merchant, data]) => ({ merchant, ...data }))
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);

        return {
            categoryBreakdown: categoryBreakdown.sort(
                (a, b) => b.totalAmount - a.totalAmount,
            ),
            confidenceDistribution,
            topMerchants,
            uncategorized: transactions.filter((t) => !t.categoryName).length,
            totalTransactions: transactions.length,
        };
    }

    /**
     * Load categories from database
     */
    private async loadCategories(): Promise<any[]> {
        return await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                color: true,
            },
        });
    }

    /**
     * Load subcategories from database
     */
    private async loadSubCategories(): Promise<any[]> {
        return await prisma.subCategory.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                categoryId: true,
                description: true,
            },
        });
    }

    /**
     * Load MCC to category mappings
     */
    private async loadMCCCategoryMappings(): Promise<Map<string, any>> {
        const mccCodes = await prisma.mCCCode.findMany();

        // Get categories and subcategories separately
        const [categories, subCategories] = await Promise.all([
            prisma.category.findMany({ select: { id: true, name: true } }),
            prisma.subCategory.findMany({ select: { id: true, name: true } }),
        ]);

        const categoryMap = categories.reduce(
            (acc, cat) => {
                acc[cat.id] = cat.name;
                return acc;
            },
            {} as Record<string, string>,
        );

        const subCategoryMap = subCategories.reduce(
            (acc, sub) => {
                acc[sub.id] = sub.name;
                return acc;
            },
            {} as Record<string, string>,
        );

        const mappings = new Map();
        mccCodes.forEach((mcc: any) => {
            mappings.set(mcc.code, {
                mccCode: mcc.code,
                mccDescription: mcc.description,
                categoryName: categoryMap[mcc.categoryId] || null,
                subCategoryName: mcc.subCategoryId
                    ? subCategoryMap[mcc.subCategoryId]
                    : null,
                confidence: 0.9, // High confidence for direct MCC mappings
            });
        });

        return mappings;
    }

    /**
     * Map MCC code to category
     */
    private mapMCCToCategory(mccCode: string, context: any): any {
        const mapping = context.mccCategoryMappings.get(mccCode);
        if (mapping) {
            return { ...mapping, reasoning: `Direct MCC mapping: ${mccCode}` };
        }

        // Fallback to MCC code patterns or defaults
        return this.getDefaultCategoryForMCC(mccCode);
    }

    /**
     * Get default category for MCC code patterns
     */
    private getDefaultCategoryForMCC(mccCode: string): any {
        const code = parseInt(mccCode);

        // Basic MCC code ranges
        if (code >= 3000 && code <= 3299) {
            return {
                categoryName: 'Travel',
                subCategoryName: 'Airlines',
                confidence: 0.8,
                reasoning: 'MCC range: Airlines',
            };
        }
        if (code >= 3500 && code <= 3999) {
            return {
                categoryName: 'Travel',
                subCategoryName: 'Hotels',
                confidence: 0.8,
                reasoning: 'MCC range: Hotels/Lodging',
            };
        }
        if (code >= 4000 && code <= 4799) {
            return {
                categoryName: 'Transportation',
                confidence: 0.8,
                reasoning: 'MCC range: Transportation',
            };
        }
        if (code >= 5000 && code <= 5999) {
            return {
                categoryName: 'Shopping',
                confidence: 0.7,
                reasoning: 'MCC range: Retail',
            };
        }
        if (code >= 7000 && code <= 7999) {
            return {
                categoryName: 'Services',
                confidence: 0.7,
                reasoning: 'MCC range: Services',
            };
        }

        // Default uncategorized
        return {
            categoryName: 'Other',
            confidence: 0.5,
            reasoning: 'Unknown MCC code',
        };
    }

    /**
     * Infer MCC from transaction patterns
     */
    private inferMCCFromTransaction(
        transaction: TransactionToProcess,
    ): { mccCode: string; confidence: number } | null {
        const description = transaction.description?.toLowerCase() || '';
        const merchant = transaction.merchant?.toLowerCase() || '';
        const { amount } = transaction;

        // Common patterns
        if (
            description.includes('gas') ||
            description.includes('fuel') ||
            description.includes('exxon') ||
            description.includes('shell')
        ) {
            return { mccCode: '5542', confidence: 0.75 };
        }

        if (
            description.includes('grocery') ||
            description.includes('supermarket') ||
            merchant.includes('walmart') ||
            merchant.includes('kroger')
        ) {
            return { mccCode: '5411', confidence: 0.75 };
        }

        if (
            description.includes('restaurant') ||
            description.includes('food') ||
            merchant.includes('mcdonalds') ||
            merchant.includes('starbucks')
        ) {
            return { mccCode: '5814', confidence: 0.7 };
        }

        if (
            description.includes('pharmacy') ||
            merchant.includes('cvs') ||
            merchant.includes('walgreens')
        ) {
            return { mccCode: '5912', confidence: 0.75 };
        }

        // Amount-based patterns (less reliable)
        if (
            amount < 5 &&
            (description.includes('fee') || description.includes('charge'))
        ) {
            return { mccCode: '4900', confidence: 0.6 }; // Utilities
        }

        return null;
    }

    /**
     * Apply business rules to categorization
     */
    private applyBusinessRules(
        transaction: TransactionToProcess,
        categoryMapping: any,
        mccInfo: { mccCode: string; confidence: number },
    ): any {
        const result = { ...categoryMapping };

        // Rule 1: High-value transactions in certain categories need review
        if (
            transaction.amount > 1000 &&
            ['Electronics', 'Travel'].includes(result.categoryName)
        ) {
            result.confidence = Math.min(result.confidence, 0.7);
        }

        // Rule 2: Small amounts at gas stations might be convenience store purchases
        if (mccInfo.mccCode === '5542' && transaction.amount < 20) {
            result.subCategoryName = 'Convenience Store';
            result.reasoning += ' (Small amount, likely convenience store)';
        }

        // Rule 3: Weekend restaurant transactions vs weekday (business meals)
        if (result.categoryName === 'Dining' && this.isBusinessHours(new Date())) {
            result.subCategoryName = 'Business Meals';
        }

        return result;
    }

    /**
     * Calculate overall confidence score
     */
    private calculateOverallConfidence(
        mccConfidence: number,
        categoryConfidence: number,
    ): number {
        // Weighted average with slight penalty for lower scores
        return (mccConfidence * 0.6 + categoryConfidence * 0.4) * 0.95;
    }

    /**
     * Check if transaction requires manual review
     */
    private requiresManualReview(
        transaction: TransactionToProcess,
        category: any,
    ): boolean {
        // High-value transactions
        if (transaction.amount > 2000) return true;

        // Unusual patterns
        if (category.categoryName === 'Other') return true;

        // Business-related categories might need review
        if (
            ['Professional Services', 'Business Expenses'].includes(
                category.categoryName,
            )
        )
            return true;

        return false;
    }

    /**
     * Check if transaction occurred during business hours
     */
    private isBusinessHours(date: Date): boolean {
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 8 && hour <= 17;
    }

    /**
     * Update transactions with categorization results using batched operations
     */
    private async updateTransactionCategories(
        results: CategoryResult[],
    ): Promise<void> {
        if (results.length === 0) return;

        try {
            // Process updates in smaller batches to avoid connection pool exhaustion
            const BATCH_SIZE = 5; // Reduced batch size to prevent connection overload
            const batches = [];

            for (let i = 0; i < results.length; i += BATCH_SIZE) {
                batches.push(results.slice(i, i + BATCH_SIZE));
            }

            logger.info('Updating transaction categories in batches', {
                totalResults: results.length,
                batchCount: batches.length,
                batchSize: BATCH_SIZE,
            });

            // Process batches sequentially to control connection usage
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];

                try {
                    const updates = batch.map((result) =>
                        prisma.transaction.update({
                            where: { id: result.transactionId },
                            data: {
                                mccCode: result.mccCode,
                                categoryId: result.categoryId,
                                categoryName: result.categoryName,
                                subCategoryId: result.subCategoryId,
                                subCategoryName: result.subCategoryName,
                                mccStatus: 'resolved',
                                mccConfidence: result.confidence,
                                confidence: result.confidence,
                                needsReview: result.needsReview,
                                isVerified:
                                    result.confidence >= this.HIGH_CONFIDENCE_THRESHOLD &&
                                    !result.needsReview,
                            },
                        }),
                    );

                    await Promise.all(updates);

                    logger.debug('Batch update completed', {
                        batchIndex: batchIndex + 1,
                        batchSize: batch.length,
                        transactionIds: batch.map(r => r.transactionId),
                    });

                    // Small delay between batches to prevent overwhelming the database
                    if (batchIndex < batches.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (batchError) {
                    logger.error('Failed to update transaction batch', {
                        batchIndex: batchIndex + 1,
                        batchSize: batch.length,
                        transactionIds: batch.map(r => r.transactionId),
                        error: batchError,
                    });

                    // Try to update transactions individually as fallback
                    for (const result of batch) {
                        try {
                            await prisma.transaction.update({
                                where: { id: result.transactionId },
                                data: {
                                    mccCode: result.mccCode,
                                    categoryId: result.categoryId,
                                    categoryName: result.categoryName,
                                    subCategoryId: result.subCategoryId,
                                    subCategoryName: result.subCategoryName,
                                    mccStatus: 'resolved',
                                    mccConfidence: result.confidence,
                                    confidence: result.confidence,
                                    needsReview: result.needsReview,
                                    isVerified:
                                        result.confidence >= this.HIGH_CONFIDENCE_THRESHOLD &&
                                        !result.needsReview,
                                },
                            });
                        } catch (individualError) {
                            logger.error('Failed to update individual transaction', {
                                transactionId: result.transactionId,
                                error: individualError,
                            });
                        }
                    }
                }
            }
            logger.info(
                `Updated ${results.length} transactions with categorization results`,
            );
        } catch (error) {
            logger.error('Failed to update transaction categories', { error });
            throw new ApiError(
                'Failed to save categorization results',
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Update session with categorization statistics
     */
    private async updateSessionStats(
        sessionId: string,
        stats: CategorizationStats,
    ): Promise<void> {
        try {
            // Calculate session-level statistics
            const topCategory = Object.entries(stats.byCategory).sort(
                ([, a], [, b]) => b - a,
            )[0]?.[0];

            // Calculate total spend from POSITIVE transactions only (exclude credits/refunds)
            const totalSpendResult = await prisma.transaction.aggregate({
                where: {
                    sessionId,
                    amount: { gt: 0 } // Only positive amounts
                },
                _sum: { amount: true },
            });

            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    categorizedCount: stats.successfullyCategorized,
                    unknownMccCount: stats.failed,
                    topCategory: topCategory || null,
                    totalSpend: totalSpendResult._sum.amount || 0,
                },
            });
        } catch (error) {
            logger.error('Failed to update session stats', { sessionId, error });
            // Don't throw - this is not critical
        }
    }

    /**
     * Calculate categorization statistics
     */
    private calculateStats(
        results: CategoryResult[],
        processingTime: number,
    ): CategorizationStats {
        const stats: CategorizationStats = {
            totalProcessed: results.length,
            successfullyCategorized: results.length,
            highConfidence: 0,
            mediumConfidence: 0,
            lowConfidence: 0,
            needsReview: 0,
            failed: 0,
            byCategory: {},
            bySource: {},
            averageConfidence: 0,
            processingTimeMs: processingTime,
        };

        results.forEach((result) => {
            // Confidence buckets
            if (result.confidence >= this.HIGH_CONFIDENCE_THRESHOLD) {
                stats.highConfidence++;
            } else if (result.confidence >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
                stats.mediumConfidence++;
            } else {
                stats.lowConfidence++;
            }

            if (result.needsReview) {
                stats.needsReview++;
            }

            // By category
            stats.byCategory[result.categoryName] =
                (stats.byCategory[result.categoryName] || 0) + 1;

            // By source
            stats.bySource[result.source] = (stats.bySource[result.source] || 0) + 1;
        });

        stats.averageConfidence =
            results.length > 0
                ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
                : 0;

        return stats;
    }

    /**
     * Create empty statistics object
     */
    private createEmptyStats(processingTime: number): CategorizationStats {
        return {
            totalProcessed: 0,
            successfullyCategorized: 0,
            highConfidence: 0,
            mediumConfidence: 0,
            lowConfidence: 0,
            needsReview: 0,
            failed: 0,
            byCategory: {},
            bySource: {},
            averageConfidence: 0,
            processingTimeMs: processingTime,
        };
    }

    /**
     * Report progress
     */
    private async reportProgress(
        callback: ((progress: CategorizationProgress) => Promise<void>) | undefined,
        progress: CategorizationProgress,
    ): Promise<void> {
        if (callback) {
            try {
                await callback(progress);
            } catch (error) {
                logger.warn('Categorization progress callback failed', { error });
            }
        }
    }
}

// Export singleton instance
export const categorizationService = new CategorizationService();
