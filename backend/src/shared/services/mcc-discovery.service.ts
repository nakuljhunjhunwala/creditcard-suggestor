import { prisma } from '@/database/db';
import {
    geminiAIService,
    // MCCDiscoveryBatchResult,
    MCCDiscoveryResult,
} from './gemini-ai.service';
import { categoryMappingService } from './category-mapping.service';
import { logger } from '@/shared/utils/logger.util';
// import { ApiError } from '@/shared/utils/api-error.util';
// import { StatusCodes } from '@/shared/constants/http-status.constants';
import { env } from '@/shared/config/env.config';

/**
 * MCC Discovery Service
 * Handles discovering MCC codes for unknown merchants using fuzzy matching and AI research
 */

export interface MerchantMCCResult {
    merchantName: string;
    mccCode: string;
    mccDescription: string;
    confidence: number;
    source: 'database' | 'fuzzy_match' | 'ai_discovery' | 'pattern_match';
    reasoning?: string;
    categoryName?: string;
    subCategoryName?: string;
    aliases?: string[];
}

export interface DiscoveryStats {
    totalProcessed: number;
    databaseMatches: number;
    fuzzyMatches: number;
    aiDiscovered: number;
    patternMatches: number;
    failed: number;
    averageConfidence: number;
    processingTimeMs: number;
}

export interface DiscoveryProgress {
    step: string;
    progress: number;
    processed: number;
    total: number;
    currentMerchant?: string;
    message: string;
}

export class MCCDiscoveryService {
    private readonly FUZZY_THRESHOLD = env.FUZZY_MATCH_THRESHOLD;
    private readonly MIN_CONFIDENCE = 0.6;

    /**
     * Discover MCC codes for a list of unknown merchants
     */
    async discoverMCCCodes(
        merchants: string[],
        onProgress?: (progress: DiscoveryProgress) => Promise<void>,
    ): Promise<{
        results: MerchantMCCResult[];
        stats: DiscoveryStats;
    }> {
        const startTime = Date.now();
        const results: MerchantMCCResult[] = [];
        const stats: DiscoveryStats = {
            totalProcessed: merchants.length,
            databaseMatches: 0,
            fuzzyMatches: 0,
            aiDiscovered: 0,
            patternMatches: 0,
            failed: 0,
            averageConfidence: 0,
            processingTimeMs: 0,
        };

        try {
            logger.info(`Starting MCC discovery for ${merchants.length} merchants`);

            await this.reportProgress(onProgress, {
                step: 'initializing',
                progress: 0,
                processed: 0,
                total: merchants.length,
                message: 'Initializing MCC discovery process',
            });

            // Step 1: Load existing MCC data from database (10% progress)
            const [existingMccCodes, merchantAliases, existingPatterns] =
                await Promise.all([
                    this.loadExistingMCCCodes(),
                    this.loadMerchantAliases(),
                    this.loadMerchantPatterns(),
                ]);

            await this.reportProgress(onProgress, {
                step: 'data_loaded',
                progress: 10,
                processed: 0,
                total: merchants.length,
                message: `Loaded ${Object.keys(existingMccCodes).length} MCC codes and ${merchantAliases.length} merchant aliases`,
            });

            // Step 2: Process merchants in batches
            const batchSize = 10; // Process in smaller batches for progress tracking
            let processed = 0;

            for (let i = 0; i < merchants.length; i += batchSize) {
                const batch = merchants.slice(i, i + batchSize);
                const batchResults: MerchantMCCResult[] = [];

                for (const merchant of batch) {
                    const result = await this.discoverSingleMerchant(merchant, {
                        existingMccCodes,
                        merchantAliases,
                        existingPatterns,
                    });

                    if (result) {
                        batchResults.push(result);
                        this.updateStats(stats, result);
                    } else {
                        stats.failed++;
                    }

                    processed++;

                    await this.reportProgress(onProgress, {
                        step: 'processing',
                        progress: 10 + (processed / merchants.length) * 70, // 10-80% for processing
                        processed,
                        total: merchants.length,
                        currentMerchant: merchant,
                        message: `Processing merchant: ${merchant}`,
                    });
                }

                results.push(...batchResults);

                // Use AI for remaining unknown merchants in this batch
                const unknownMerchants = batch.filter(
                    (m) => !batchResults.some((r) => r.merchantName === m),
                );

                if (unknownMerchants.length > 0) {
                    await this.reportProgress(onProgress, {
                        step: 'ai_discovery',
                        progress: 10 + (processed / merchants.length) * 70,
                        processed,
                        total: merchants.length,
                        message: `Using AI to discover MCC codes for ${unknownMerchants.length} unknown merchants`,
                    });

                    const aiResults = await this.discoverWithAI(
                        unknownMerchants,
                        existingMccCodes,
                    );
                    results.push(...aiResults);
                    aiResults.forEach((result) => this.updateStats(stats, result));
                }

                // Add small delay between batches
                if (i + batchSize < merchants.length) {
                    await this.delay(500);
                }
            }

            // Step 3: Store new discoveries (90% progress)
            await this.reportProgress(onProgress, {
                step: 'storing_results',
                progress: 90,
                processed: merchants.length,
                total: merchants.length,
                message: 'Storing newly discovered MCC codes',
            });

            await this.storeDiscoveries(results);

            // Step 4: Complete (100% progress)
            stats.processingTimeMs = Date.now() - startTime;
            stats.averageConfidence =
                results.length > 0
                    ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
                    : 0;

            await this.reportProgress(onProgress, {
                step: 'completed',
                progress: 100,
                processed: merchants.length,
                total: merchants.length,
                message: `MCC discovery completed - ${results.length} merchants processed`,
            });

            logger.info('MCC discovery completed', {
                totalProcessed: stats.totalProcessed,
                successful: results.length,
                failed: stats.failed,
                processingTimeMs: stats.processingTimeMs,
            });

            return { results, stats };
        } catch (error) {
            logger.error('MCC discovery failed', {
                error,
                merchantCount: merchants.length,
            });
            throw error;
        }
    }

    /**
     * Discover MCC for a single merchant
     */
    async discoverSingleMerchant(
        merchant: string,
        context: {
            existingMccCodes: Record<string, any>;
            merchantAliases: any[];
            existingPatterns: any[];
        },
    ): Promise<MerchantMCCResult | null> {
        try {
            const cleanMerchant = this.cleanMerchantName(merchant);

            // Strategy 1: Direct database match
            const directMatch = context.existingMccCodes[cleanMerchant.toUpperCase()];
            if (directMatch) {
                return {
                    merchantName: merchant,
                    mccCode: directMatch.mccCode,
                    mccDescription: directMatch.description,
                    confidence: 0.98,
                    source: 'database',
                    categoryName: directMatch.categoryName,
                    subCategoryName: directMatch.subCategoryName,
                };
            }

            // Strategy 2: Fuzzy matching against aliases
            const fuzzyMatch = this.findFuzzyMatch(
                cleanMerchant,
                context.merchantAliases,
            );
            if (fuzzyMatch && fuzzyMatch.confidence >= this.FUZZY_THRESHOLD) {
                return {
                    merchantName: merchant,
                    mccCode: fuzzyMatch.mccCode,
                    mccDescription: fuzzyMatch.description,
                    confidence: fuzzyMatch.confidence,
                    source: 'fuzzy_match',
                    reasoning: `Fuzzy matched with: ${fuzzyMatch.matchedAlias}`,
                    aliases: fuzzyMatch.aliases,
                };
            }

            // Strategy 3: Pattern matching
            const patternMatch = this.findPatternMatch(
                cleanMerchant,
                context.existingPatterns,
            );
            if (patternMatch && patternMatch.confidence >= this.MIN_CONFIDENCE) {
                return {
                    merchantName: merchant,
                    mccCode: patternMatch.mccCode,
                    mccDescription: patternMatch.description,
                    confidence: patternMatch.confidence,
                    source: 'pattern_match',
                    reasoning: `Matched pattern: ${patternMatch.pattern}`,
                };
            }

            return null; // Will be handled by AI discovery
        } catch (error) {
            logger.error('Failed to discover MCC for single merchant', {
                merchant,
                error,
            });
            return null;
        }
    }

    /**
     * Use AI to discover MCC codes for unknown merchants
     */
    private async discoverWithAI(
        merchants: string[],
        existingMccCodes: Record<string, any>,
    ): Promise<MerchantMCCResult[]> {
        if (merchants.length === 0) return [];

        try {
            logger.info(
                `Using AI to discover MCC codes for ${merchants.length} merchants`,
            );

            const aiResult = await geminiAIService.discoverMCCCodes(merchants, {
                existingMccCodes: Object.fromEntries(
                    Object.entries(existingMccCodes).map(([k, v]) => [k, v.mccCode]),
                ),
            });

            // Validate and map categories for each result
            const validatedResults = await Promise.all(
                aiResult.results.map(async (result: MCCDiscoveryResult): Promise<MerchantMCCResult | null> => {
                    // Map AI categories to our predefined categories
                    const mappingResult = await categoryMappingService.mapCategory(
                        result.category,
                        result.subCategory,
                        result.mccCode
                    );

                    if (!mappingResult.mapping) {
                        logger.warn('Failed to map AI category to predefined categories', {
                            merchantName: result.merchantName,
                            aiCategory: result.category,
                            aiSubCategory: result.subCategory,
                            mccCode: result.mccCode,
                        });

                        // Use fallback mapping
                        const fallbackMapping = await categoryMappingService.mapCategory(
                            'Other',
                            undefined,
                            result.mccCode
                        );

                        if (fallbackMapping.mapping) {
                            return {
                                merchantName: result.merchantName,
                                mccCode: result.mccCode,
                                mccDescription: result.mccDescription,
                                confidence: Math.min(result.confidence, 0.3), // Lower confidence for fallback
                                source: 'ai_discovery' as const,
                                reasoning: `${result.reasoning} (Category mapped to fallback)`,
                                categoryName: fallbackMapping.mapping.categoryName,
                                subCategoryName: fallbackMapping.mapping.subCategoryName,
                            };
                        }
                        return null; // Skip if even fallback fails
                    }

                    // Adjust confidence based on mapping quality
                    const adjustedConfidence = mappingResult.isExactMatch
                        ? result.confidence
                        : Math.min(result.confidence, 0.8);

                    return {
                        merchantName: result.merchantName,
                        mccCode: result.mccCode,
                        mccDescription: result.mccDescription,
                        confidence: adjustedConfidence,
                        source: 'ai_discovery' as const,
                        reasoning: mappingResult.fallbackUsed
                            ? `${result.reasoning} (Category mapping used fallback)`
                            : result.reasoning,
                        categoryName: mappingResult.mapping.categoryName,
                        subCategoryName: mappingResult.mapping.subCategoryName,
                    };
                })
            );

            // Filter out null results and return valid MerchantMCCResult array
            return validatedResults.filter((result): result is MerchantMCCResult => result !== null);
        } catch (error) {
            logger.error('AI MCC discovery failed', {
                error,
                merchantCount: merchants.length,
            });
            return []; // Return empty array instead of throwing
        }
    }

    /**
     * Load existing MCC codes from database
     */
    private async loadExistingMCCCodes(): Promise<Record<string, any>> {
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

        const result: Record<string, any> = {};

        mccCodes.forEach((mcc: any) => {
            // Add primary merchant names
            if (mcc.merchantPatterns && Array.isArray(mcc.merchantPatterns)) {
                mcc.merchantPatterns.forEach((pattern: string) => {
                    result[pattern.toUpperCase()] = {
                        mccCode: mcc.code,
                        description: mcc.description,
                        categoryName: categoryMap[mcc.categoryId] || null,
                        subCategoryName: mcc.subCategoryId
                            ? subCategoryMap[mcc.subCategoryId]
                            : null,
                    };
                });
            }
        });

        return result;
    }

    /**
     * Load merchant aliases from database
     */
    private async loadMerchantAliases(): Promise<any[]> {
        return await prisma.merchantAlias.findMany({
            select: {
                merchantName: true,
                aliases: true,
                mccCode: true,
                confidence: true,
            },
        });
    }

    /**
     * Load merchant patterns from MCC codes
     */
    private async loadMerchantPatterns(): Promise<any[]> {
        const mccCodes = await prisma.mCCCode.findMany({
            where: {
                merchantPatterns: {
                    isEmpty: false,
                },
            },
            select: {
                code: true,
                description: true,
                merchantPatterns: true,
            },
        });

        return mccCodes.flatMap((mcc: any) =>
            ((mcc.merchantPatterns as string[]) || []).map((pattern: string) => ({
                pattern,
                mccCode: mcc.code,
                description: mcc.description,
                isRegex: pattern.includes('*') || pattern.includes('?'),
            })),
        );
    }

    /**
     * Find fuzzy match using similarity algorithms
     */
    private findFuzzyMatch(
        merchant: string,
        aliases: any[],
    ): {
        mccCode: string;
        description: string;
        confidence: number;
        matchedAlias: string;
        aliases: string[];
    } | null {
        let bestMatch = null;
        let bestScore = 0;

        const merchantUpper = merchant.toUpperCase();

        for (const alias of aliases) {
            if (!alias.aliases || !Array.isArray(alias.aliases)) continue;

            for (const aliasName of alias.aliases) {
                const aliasUpper = aliasName.toUpperCase();
                const score = this.calculateSimilarity(merchantUpper, aliasUpper);

                if (score > bestScore && score >= this.FUZZY_THRESHOLD) {
                    bestScore = score;
                    bestMatch = {
                        mccCode: alias.mccCode,
                        description: `MCC ${alias.mccCode}`,
                        confidence: score,
                        matchedAlias: aliasName,
                        aliases: alias.aliases,
                    };
                }
            }
        }

        return bestMatch;
    }

    /**
     * Find pattern match using regex and wildcard patterns
     */
    private findPatternMatch(
        merchant: string,
        patterns: any[],
    ): {
        mccCode: string;
        description: string;
        confidence: number;
        pattern: string;
    } | null {
        const merchantUpper = merchant.toUpperCase();

        for (const patternInfo of patterns) {
            const pattern = patternInfo.pattern.toUpperCase();

            if (patternInfo.isRegex) {
                // Convert wildcard pattern to regex
                const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');

                try {
                    const regex = new RegExp(regexPattern, 'i');
                    if (regex.test(merchant)) {
                        return {
                            mccCode: patternInfo.mccCode,
                            description: patternInfo.description,
                            confidence: 0.85, // High confidence for pattern matches
                            pattern: patternInfo.pattern,
                        };
                    }
                } catch {
                    // Invalid regex, skip
                    continue;
                }
            } else {
                // Simple substring match
                if (
                    merchantUpper.includes(pattern) ||
                    pattern.includes(merchantUpper)
                ) {
                    const confidence =
                        pattern.length === merchantUpper.length ? 0.95 : 0.75;
                    return {
                        mccCode: patternInfo.mccCode,
                        description: patternInfo.description,
                        confidence,
                        pattern: patternInfo.pattern,
                    };
                }
            }
        }

        return null;
    }

    /**
     * Calculate similarity between two strings using Levenshtein distance
     */
    private calculateSimilarity(str1: string, str2: string): number {
        if (str1 === str2) return 1.0;

        const len1 = str1.length;
        const len2 = str2.length;

        if (len1 === 0) return 0;
        if (len2 === 0) return 0;

        // Create matrix
        const matrix = Array(len2 + 1)
            .fill(null)
            .map(() => Array(len1 + 1).fill(null));

        // Initialize first row and column
        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        // Fill matrix
        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j - 1][i] + 1, // deletion
                    matrix[j][i - 1] + 1, // insertion
                    matrix[j - 1][i - 1] + cost, // substitution
                );
            }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        return 1 - distance / maxLen;
    }

    /**
     * Clean merchant name for matching
     */
    private cleanMerchantName(merchant: string): string {
        return merchant
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^a-zA-Z0-9\s&'-]/g, '')
            .replace(/\b(INC|LLC|CORP|LTD|CO)\b/gi, '')
            .replace(/\b\d+\b/g, '') // Remove standalone numbers
            .trim();
    }

    /**
     * Store discovered MCC codes in database
     */
    private async storeDiscoveries(results: MerchantMCCResult[]): Promise<void> {
        const newDiscoveries = results.filter(
            (r) => r.source === 'ai_discovery' && r.confidence >= 0.8,
        );

        if (newDiscoveries.length === 0) return;

        try {
            // Store as merchant aliases for future fuzzy matching
            const aliasesToCreate = newDiscoveries.map((result) => ({
                id: `ai_discovery_${result.merchantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                merchantName: result.merchantName.toUpperCase(),
                aliases: [result.merchantName],
                mccCode: result.mccCode,
                confidence: result.confidence,
                usageCount: 0,
                createdBy: 'ai_discovery',
            }));

            // Use upsert to avoid duplicates
            for (const alias of aliasesToCreate) {
                await prisma.merchantAlias.upsert({
                    where: { id: alias.id },
                    update: {
                        confidence: Math.max(alias.confidence, 0.8), // Don't lower existing confidence
                        usageCount: { increment: 1 },
                    },
                    create: alias,
                });
            }

            logger.info(
                `Stored ${aliasesToCreate.length} new merchant aliases from AI discovery`,
            );
        } catch (error) {
            logger.error('Failed to store discovered MCC codes', { error });
            // Don't throw - this is not critical for the main process
        }
    }

    /**
     * Update statistics
     */
    private updateStats(stats: DiscoveryStats, result: MerchantMCCResult): void {
        switch (result.source) {
            case 'database':
                stats.databaseMatches++;
                break;
            case 'fuzzy_match':
                stats.fuzzyMatches++;
                break;
            case 'ai_discovery':
                stats.aiDiscovered++;
                break;
            case 'pattern_match':
                stats.patternMatches++;
                break;
        }
    }

    /**
     * Report progress
     */
    private async reportProgress(
        callback: ((progress: DiscoveryProgress) => Promise<void>) | undefined,
        progress: DiscoveryProgress,
    ): Promise<void> {
        if (callback) {
            try {
                await callback(progress);
            } catch (error) {
                logger.warn('Discovery progress callback failed', { error });
            }
        }
    }

    /**
     * Add delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const mccDiscoveryService = new MCCDiscoveryService();
