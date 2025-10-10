import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';
import {
    savingsCalculatorService,
    CardSavingsAnalysis
} from './savings-calculator.service';
import { configService } from './config.service';
import {
    CreditScore,
    CardNetwork,
    CardIssuer,
    CREDIT_SCORE_VALUES,
    REWARD_RATE_TIERS,
    FIRST_YEAR_VALUE_TIERS,
    ROI_TIERS,
    DIGITAL_FEATURE_KEYWORDS,
    LIMITED_ACCEPTANCE_NETWORKS
} from '@/shared/constants/recommendation.constants';
import type {
    SpendingPattern,
    RecommendationCriteria,
    CardRecommendation,
    RecommendationResult,
    RecommendationStats,
    RecommendationOptions,
    EnhancedCreditCard,
    SpendingAnalysis,
    CategoryAnalysis,
    ScoreBreakdown,
    ConfidenceFactors,
    RecommendationConfig
} from '@/shared/types/recommendation.types';

/**
 * Advanced Credit Card Recommendation Service for Indian Market
 * Fully database-driven with configurable parameters and no hardcoded values
 */
export class RecommendationService {
    private config: RecommendationConfig | null = null;

    constructor() {
        this.initializeConfig();
    }

    /**
     * Initialize configuration from database
     */
    private async initializeConfig(): Promise<void> {
        try {
            this.config = await configService.getRecommendationConfig();
        } catch (error) {
            logger.error('Failed to initialize recommendation config', { error });
        }
    }

    /**
     * Get current configuration (with fallback)
     */
    private async getConfig(): Promise<RecommendationConfig> {
        if (!this.config) {
            this.config = await configService.getRecommendationConfig();
        }
        return this.config;
    }

    /**
     * Generate comprehensive credit card recommendations for a session
     */
    async generateRecommendations(
        sessionId: string,
        options: RecommendationOptions = {},
    ): Promise<RecommendationResult> {
        const startTime = Date.now();

        try {
            logger.info('Starting recommendation generation', { sessionId, options });

            // Get configuration
            const config = await this.getConfig();

            // Step 1: Analyze spending patterns
            const spendingPatterns = await this.analyzeSpendingPatterns(sessionId);

            // Handle edge case of no positive spending patterns
            if (spendingPatterns.length === 0) {
                logger.warn('No positive spending patterns found, generating fallback recommendations', { sessionId });
                return this.generateFallbackRecommendations(sessionId, options, startTime, config);
            }

            // Get transactions for annual projection (only positive amounts)
            const allTransactions = await prisma.transaction.findMany({
                where: { sessionId },
                select: {
                    date: true,
                    amount: true
                }
            });

            const positiveTransactionsForProjection = allTransactions.filter(t => Number(t.amount) > 0);

            // Calculate annual projection using only positive transactions
            const projectedAnnualSpending = this.projectAnnualSpending(spendingPatterns, positiveTransactionsForProjection);

            // Step 2: Calculate recommendation criteria
            const criteria = this.buildRecommendationCriteria(spendingPatterns, options);

            // Step 3: Get eligible credit cards
            const eligibleCards = await this.getEligibleCards(criteria);

            // Step 4: Score and rank cards using enhanced savings-based logic
            const scoredCards = await this.scoreAndRankCards(
                eligibleCards,
                criteria,
                spendingPatterns,
                projectedAnnualSpending,
                config
            );

            // Step 5: Get top recommendations with fallback logic
            let topRecommendations = scoredCards
                .filter((card) => card.score >= config.scoring.minScoreThreshold)
                .slice(0, config.scoring.maxRecommendations);

            // FALLBACK LOGIC: Always ensure user gets recommendations
            if (topRecommendations.length === 0) {
                logger.warn('No cards met threshold, applying fallback logic', {
                    sessionId,
                    totalCards: scoredCards.length,
                    threshold: config.scoring.minScoreThreshold
                });

                topRecommendations = scoredCards
                    .slice(0, config.scoring.fallbackRecommendations)
                    .map(card => ({
                        ...card,
                        score: Math.max(card.score, config.scoring.minScoreThreshold),
                        primaryReason: `Best available option for your spending profile - ${card.primaryReason}`
                    }));
            }

            // Step 6: Store recommendations
            await this.storeRecommendations(sessionId, topRecommendations);

            const processingTime = Date.now() - startTime;
            const analysis = await this.generateSpendingAnalysis(spendingPatterns);

            const result: RecommendationResult = {
                sessionId,
                recommendations: topRecommendations,
                criteria,
                totalCards: eligibleCards.length,
                processingTimeMs: processingTime,
                generatedAt: new Date(),
                summary: {
                    topRecommendation: topRecommendations[0]?.cardId || 'None',
                    potentialSavings: topRecommendations[0]?.potentialSavings || 0,
                    averageScore: topRecommendations.length > 0
                        ? topRecommendations.reduce((sum, r) => sum + r.score, 0) / topRecommendations.length
                        : 0,
                    categoriesAnalyzed: spendingPatterns.length,
                    confidenceLevel: this.getConfidenceLevel(topRecommendations[0]?.confidenceScore || 0)
                },
                analysis
            };

            logger.info('Recommendation generation completed', {
                sessionId,
                recommendationsCount: topRecommendations.length,
                topScore: topRecommendations[0]?.score,
                processingTimeMs: processingTime,
            });

            return result;
        } catch (error) {
            logger.error('Recommendation generation failed', { sessionId, error });
            throw error;
        }
    }

    /**
     * Generate fallback recommendations when no spending patterns are available
     */
    private async generateFallbackRecommendations(
        sessionId: string,
        options: RecommendationOptions,
        startTime: number,
        config: RecommendationConfig
    ): Promise<RecommendationResult> {
        const criteria = this.buildFallbackCriteria(options);
        const eligibleCards = await this.getEligibleCards(criteria);

        const fallbackRecommendations = eligibleCards
            .slice(0, config.scoring.fallbackRecommendations)
            .map((card, index) => ({
                cardId: card.id,
                rank: index + 1,
                score: config.scoring.baseScore - (index * 5),

                // Simplified - what users really care about
                estimatedAnnualCashback: 0,
                signupBonusValue: 0,

                // Contextual information
                primaryReason: 'Recommended for general spending and building credit history',
                pros: this.generateFallbackPros(card, config || {} as RecommendationConfig),
                cons: this.generateFallbackCons(card, config || {} as RecommendationConfig),
                benefitBreakdown: [],
                confidenceScore: 0.6,

                // Legacy fields (hidden from main response but kept for compatibility)
                statementSavings: 0,
                statementEarnings: 0,
                annualSavings: 0,
                annualEarnings: 0,
                potentialSavings: 0,
                currentEarnings: 0,
                yearlyEstimate: 0,
                feeBreakeven: 12,
            }));

        await this.storeRecommendations(sessionId, fallbackRecommendations);

        const processingTime = Date.now() - startTime;
        return {
            sessionId,
            recommendations: fallbackRecommendations,
            criteria,
            totalCards: eligibleCards.length,
            processingTimeMs: processingTime,
            generatedAt: new Date(),
            summary: {
                topRecommendation: fallbackRecommendations[0]?.primaryReason || 'No recommendations available',
                potentialSavings: 0,
                averageScore: fallbackRecommendations.reduce((sum, rec) => sum + rec.score, 0) / fallbackRecommendations.length || 0,
                categoriesAnalyzed: 0,
                confidenceLevel: 'Low'
            }
        };
    }

    /**
     * Get stored recommendations for a session
     */
    async getSessionRecommendations(sessionId: string): Promise<CardRecommendation[]> {
        try {
            const recommendations = await prisma.recommendation.findMany({
                where: { sessionId },
                orderBy: { rank: 'asc' },
            });

            return recommendations.map((rec) => ({
                cardId: rec.cardId,
                rank: rec.rank,
                score: Number(rec.score),

                // Simplified - what users really care about
                estimatedAnnualCashback: Number(rec.yearlyEstimate || 0),
                signupBonusValue: rec.signupBonusValue ? Number(rec.signupBonusValue) : undefined,

                // Contextual information
                primaryReason: rec.primaryReason,
                pros: rec.pros as string[],
                cons: rec.cons as string[],
                benefitBreakdown: rec.benefitBreakdown as any[],
                confidenceScore: Number(rec.score) * 0.01,

                // Legacy fields (hidden from main response but kept for compatibility)
                statementSavings: 0,
                statementEarnings: 0,
                annualSavings: 0,
                annualEarnings: 0,
                potentialSavings: Number(rec.potentialSavings),
                currentEarnings: Number(rec.currentEarnings),
                yearlyEstimate: Number(rec.yearlyEstimate),
                feeBreakeven: rec.feeBreakeven ? Number(rec.feeBreakeven) : undefined,
            }));
        } catch (error) {
            logger.error('Failed to get session recommendations', { sessionId, error });
            return [];
        }
    }

    /**
     * Recalculate recommendations with new criteria
     */
    async recalculateRecommendations(
        sessionId: string,
        newOptions: RecommendationOptions,
    ): Promise<RecommendationResult> {
        await prisma.recommendation.deleteMany({
            where: { sessionId },
        });

        return this.generateRecommendations(sessionId, newOptions);
    }

    /**
     * Get recommendation statistics
     */
    async getRecommendationStats(timeRangeHours: number = 24): Promise<RecommendationStats> {
        const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

        try {
            const [recommendations, sessions] = await Promise.all([
                prisma.recommendation.findMany({
                    where: { createdAt: { gte: since } },
                }),
                prisma.session.findMany({
                    where: {
                        updatedAt: { gte: since },
                        status: 'completed',
                    },
                    select: { id: true, topCategory: true },
                }),
            ]);

            const cardIds = [...new Set(recommendations.map((r) => r.cardId))];
            const cards = await prisma.creditCard.findMany({
                where: { id: { in: cardIds } },
                select: { id: true, name: true },
            });
            const cardNameMap = cards.reduce((acc, card) => {
                acc[card.id] = card.name;
                return acc;
            }, {} as Record<string, string>);

            const cardCounts = new Map<string, { count: number; scores: number[] }>();
            recommendations.forEach((rec) => {
                const cardName = cardNameMap[rec.cardId] || 'Unknown';
                if (!cardCounts.has(cardName)) {
                    cardCounts.set(cardName, { count: 0, scores: [] });
                }
                const entry = cardCounts.get(cardName)!;
                entry.count++;
                entry.scores.push(Number(rec.score));
            });

            const popularRecommendations = Array.from(cardCounts.entries())
                .map(([cardName, data]) => ({
                    cardName,
                    recommendationCount: data.count,
                    averageScore: data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
                }))
                .sort((a, b) => b.recommendationCount - a.recommendationCount)
                .slice(0, 10);

            const categoryCounts = new Map<string, number>();
            sessions.forEach((session) => {
                if (session.topCategory) {
                    categoryCounts.set(
                        session.topCategory,
                        (categoryCounts.get(session.topCategory) || 0) + 1,
                    );
                }
            });

            const topCategories = Array.from(categoryCounts.entries())
                .map(([category, frequency]) => ({ category, frequency }))
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 10);

            return {
                totalRecommendations: recommendations.length,
                averageProcessingTime: 0,
                popularRecommendations,
                topCategories,
            };
        } catch (error) {
            logger.error('Failed to get recommendation stats', { error });
            return {
                totalRecommendations: 0,
                averageProcessingTime: 0,
                popularRecommendations: [],
                topCategories: [],
            };
        }
    }

    /**
     * Analyze spending patterns from transactions with comprehensive edge case handling
     */
    private async analyzeSpendingPatterns(sessionId: string): Promise<SpendingPattern[]> {
        try {
            const config = await this.getConfig();

            const transactions = await prisma.transaction.findMany({
                where: { sessionId },
                select: {
                    amount: true,
                    categoryName: true,
                    subCategoryName: true,
                    mccCode: true,
                    date: true,
                    merchant: true,
                },
            });

            if (transactions.length === 0) {
                logger.warn('No transactions found for session', { sessionId });
                return [];
            }

            const validTransactions = transactions.filter(t => {
                const amount = Number(t.amount);
                return !isNaN(amount) && isFinite(amount) && amount !== 0;
            });

            if (validTransactions.length === 0) {
                logger.warn('No valid transactions after filtering', { sessionId });
                return [];
            }

            // Get category mappings from database
            const categoryMappings = await this.getCategoryMappings();

            const categoryMap = new Map<string, {
                amounts: number[];
                subCategory?: string;
                mccCodes: Set<string>;
                merchants: Set<string>;
            }>();

            // Process ONLY positive transactions (debited amounts) - ignore credits/refunds completely
            const positiveTransactions = validTransactions.filter(t => Number(t.amount) > 0);

            positiveTransactions.forEach((t) => {
                let category = t.categoryName || 'Other';
                category = this.normalizeCategory(category, categoryMappings);

                if (!categoryMap.has(category)) {
                    categoryMap.set(category, {
                        amounts: [],
                        subCategory: t.subCategoryName || undefined,
                        mccCodes: new Set(),
                        merchants: new Set(),
                    });
                }

                const entry = categoryMap.get(category)!;
                entry.amounts.push(Number(t.amount));
                if (t.mccCode) entry.mccCodes.add(t.mccCode);
                if (t.merchant) entry.merchants.add(t.merchant);
            });

            const patterns: SpendingPattern[] = [];
            let totalPositiveSpending = 0;

            categoryMap.forEach((data, categoryName) => {
                const amounts = data.amounts;
                const totalSpent = amounts.reduce((sum, amount) => sum + amount, 0);
                const transactionCount = amounts.length;

                if (transactionCount === 1 && totalSpent > config.thresholds.largeTransactionThreshold) {
                    logger.info('Large single transaction detected', {
                        category: categoryName,
                        amount: totalSpent,
                        sessionId
                    });
                }

                // Only include categories with positive net spending
                if (totalSpent > 0 && transactionCount > 0) {
                    totalPositiveSpending += totalSpent;

                    // For average calculation, use absolute values of all transactions
                    const absoluteAmounts = amounts.map(Math.abs);
                    const averageTransaction = absoluteAmounts.reduce((sum, amt) => sum + amt, 0) / transactionCount;
                    const monthlyAverage = this.estimateMonthlySpending(amounts, totalSpent);

                    patterns.push({
                        categoryName,
                        subCategoryName: data.subCategory,
                        totalSpent,
                        transactionCount,
                        averageTransaction,
                        monthlyAverage,
                        percentage: 0,
                        mccCodes: Array.from(data.mccCodes),
                        merchants: Array.from(data.merchants),
                    });
                }
            });

            // Calculate totals using only positive transactions (debited amounts)
            const totalPositiveTransactions = positiveTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
            const totalAllTransactions = validTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

            logger.info('Spending calculation summary', {
                sessionId,
                totalAllTransactions, // Includes negatives for reference
                totalPositiveTransactions, // Only positive amounts used for calculations
                totalPositiveSpending,
                validTransactionCount: validTransactions.length,
                positiveTransactionCount: positiveTransactions.length,
                categoriesFound: categoryMap.size
            });

            if (totalPositiveSpending < config.thresholds.minTotalSpending) {
                logger.warn('Very low total positive spending detected', {
                    totalPositiveSpending,
                    totalAllTransactions,
                    sessionId
                });
                return [];
            }

            if (patterns.length === 0) {
                logger.warn('No positive spending patterns found after processing', {
                    totalPositiveSpending,
                    categoriesProcessed: categoryMap.size,
                    sessionId
                });
                return [];
            }

            const significantPatterns = patterns
                .map(pattern => ({
                    ...pattern,
                    percentage: (pattern.totalSpent / totalPositiveSpending) * 100
                }))
                .filter(pattern => {
                    return pattern.percentage >= config.thresholds.minCategoryPercentage ||
                        pattern.totalSpent >= config.thresholds.minCategoryAmount;
                })
                .sort((a, b) => b.totalSpent - a.totalSpent);

            if (significantPatterns.length === 0) {
                logger.warn('No significant spending patterns found', { sessionId });
                return patterns.slice(0, 1);
            }

            const finalPatterns = significantPatterns.slice(0, config.thresholds.maxCategoriesToAnalyze);

            logger.info('Spending pattern analysis completed', {
                totalPatterns: finalPatterns.length,
                totalSpending: totalPositiveSpending,
                topCategory: finalPatterns[0]?.categoryName,
                sessionId
            });

            return finalPatterns;

        } catch (error) {
            logger.error('Error analyzing spending patterns', { sessionId, error });
            return [];
        }
    }

    /**
     * Get category mappings from database
     */
    private async getCategoryMappings(): Promise<Map<string, string>> {
        try {
            const categories = await prisma.category.findMany({
                select: { name: true, slug: true }
            });

            const mappings = new Map<string, string>();

            categories.forEach(category => {
                const variations = this.generateCategoryVariations(category.name);
                variations.forEach(variation => {
                    mappings.set(variation.toLowerCase(), category.name);
                });
            });

            return mappings;
        } catch (error) {
            logger.error('Failed to load category mappings', { error });
            return new Map();
        }
    }

    /**
     * Generate category name variations for better matching
     */
    private generateCategoryVariations(categoryName: string): string[] {
        const variations = [categoryName];
        const lower = categoryName.toLowerCase();

        // Add common variations
        if (lower.includes('e-commerce')) {
            variations.push('ecommerce', 'online shopping', 'marketplace');
        }
        if (lower.includes('dining')) {
            variations.push('food delivery', 'restaurant', 'food');
        }
        if (lower.includes('grocery')) {
            variations.push('groceries', 'supermarket', 'quick commerce');
        }
        if (lower.includes('fuel')) {
            variations.push('petrol', 'gas');
        }
        if (lower.includes('transport')) {
            variations.push('transportation');
        }
        if (lower.includes('entertainment')) {
            variations.push('movie', 'ott', 'streaming');
        }
        if (lower.includes('utilities')) {
            variations.push('utility', 'bill', 'recharge');
        }
        if (lower.includes('healthcare')) {
            variations.push('medical', 'hospital');
        }
        if (lower.includes('shopping')) {
            variations.push('retail');
        }
        if (lower.includes('finance')) {
            variations.push('banking');
        }
        if (lower.includes('home')) {
            variations.push('lifestyle');
        }

        return variations;
    }

    /**
     * Normalize category using database mappings
     */
    private normalizeCategory(category: string, mappings: Map<string, string>): string {
        if (!category) return 'Other';

        const normalized = category.toLowerCase().trim();
        return mappings.get(normalized) || category;
    }

    /**
     * Estimate monthly spending from transaction data and project annual spending
     */
    private estimateMonthlySpending(amounts: number[], totalSpent: number): number {
        // For now, return the total spent as monthly average
        // This will be improved with proper date-based analysis
        return totalSpent;
    }

    /**
     * Project annual spending based on statement duration
     */
    private projectAnnualSpending(patterns: SpendingPattern[], transactions: any[]): number {
        if (transactions.length === 0) return 0;

        // Get date range from transactions
        const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        // Calculate duration in months
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMonths = Math.max(1, durationMs / (1000 * 60 * 60 * 24 * 30.44)); // 30.44 days per month average

        // Total positive spending
        const totalSpending = patterns.reduce((sum, pattern) => sum + Math.max(0, pattern.totalSpent), 0);

        // Project to 12 months
        const projectedAnnualSpending = (totalSpending / durationMonths) * 12;

        logger.info('Annual spending projection', {
            totalSpending,
            durationMonths: durationMonths.toFixed(2),
            projectedAnnualSpending: projectedAnnualSpending.toFixed(2),
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            }
        });

        return projectedAnnualSpending;
    }

    /**
     * Build recommendation criteria from spending patterns
     */
    private buildRecommendationCriteria(
        patterns: SpendingPattern[],
        options: RecommendationOptions,
    ): RecommendationCriteria {
        const totalSpending = patterns.reduce((sum, p) => sum + p.totalSpent, 0);

        // Calculate dynamic maxAnnualFee based on spending
        // For high spenders (>2L annually), allow premium cards up to 12.5k
        // For medium spenders (50k-2L), allow mid-tier cards up to 5k
        // For low spenders (<50k), stick to low/no fee cards
        const annualSpending = Math.abs(totalSpending) * 12; // Rough annual projection
        let defaultMaxAnnualFee = 500; // Conservative default

        if (annualSpending >= 200000) { // 2L+ annual spending
            defaultMaxAnnualFee = 12500;
        } else if (annualSpending >= 50000) { // 50k-2L annual spending
            defaultMaxAnnualFee = 5000;
        } else if (annualSpending >= 20000) { // 20k-50k annual spending
            defaultMaxAnnualFee = 2500;
        }

        return {
            totalSpending,
            monthlySpending: totalSpending,
            topCategories: patterns.slice(0, 5),
            creditScore: options.creditScore || CreditScore.GOOD,
            preferredNetwork: options.preferredNetwork,
            maxAnnualFee: options.maxAnnualFee || defaultMaxAnnualFee,
            prioritizeSignupBonus: totalSpending >= 3000,
            includeBusinessCards: options.includeBusinessCards || false,
            preferredIssuer: options.preferredIssuer,
            minIncome: options.minIncome,
        };
    }

    /**
     * Build fallback criteria when no spending data is available
     */
    private buildFallbackCriteria(options: RecommendationOptions): RecommendationCriteria {
        return {
            totalSpending: 0,
            monthlySpending: 0,
            topCategories: [],
            creditScore: options.creditScore || CreditScore.GOOD,
            preferredNetwork: options.preferredNetwork,
            maxAnnualFee: options.maxAnnualFee || 500,
            prioritizeSignupBonus: false,
            includeBusinessCards: options.includeBusinessCards || false,
            preferredIssuer: options.preferredIssuer,
            minIncome: options.minIncome,
        };
    }

    /**
     * Get eligible credit cards based on criteria
     */
    private async getEligibleCards(criteria: RecommendationCriteria): Promise<EnhancedCreditCard[]> {
        const filters: any = { isActive: true };

        if (criteria.maxAnnualFee !== undefined) {
            filters.feeStructure = {
                path: ['annualFee'],
                lte: criteria.maxAnnualFee
            };
        }

        if (criteria.preferredNetwork) {
            filters.network = { slug: criteria.preferredNetwork };
        }

        if (criteria.preferredIssuer) {
            filters.issuer = { slug: criteria.preferredIssuer };
        }

        // Build eligibility requirements filter properly without overwriting
        const eligibilityFilters: any[] = [];

        if (criteria.minIncome) {
            eligibilityFilters.push({
                path: ['minimumIncome', 'salaried'],
                lte: criteria.minIncome
            });
        }

        if (criteria.creditScore) {
            const minScore = CREDIT_SCORE_VALUES[criteria.creditScore];
            eligibilityFilters.push({
                path: ['minimumCreditScore'],
                lte: minScore
            });
        }

        // Apply eligibility filters using AND logic if we have any
        if (eligibilityFilters.length > 0) {
            if (eligibilityFilters.length === 1) {
                filters.eligibilityRequirements = eligibilityFilters[0];
            } else {
                filters.AND = eligibilityFilters.map(filter => ({
                    eligibilityRequirements: filter
                }));
            }
        }

        // Log the filters being applied for debugging
        logger.info('Applying card filters', {
            filters: JSON.stringify(filters, null, 2),
            maxAnnualFee: criteria.maxAnnualFee,
            creditScore: criteria.creditScore,
            minIncome: criteria.minIncome
        });

        const cards = await prisma.creditCard.findMany({
            where: filters,
            include: {
                issuer: true,
                network: true,
                category: true,
                subCategory: true,
                acceleratedRewards: {
                    include: {
                        rewardCategory: true
                    }
                }
            }
        });

        logger.info('Eligible cards found', {
            totalCards: cards.length,
            cardNames: cards.map(c => c.name)
        });

        return cards.map(card => ({
            ...card,
            issuer: {
                ...card.issuer,
                color: card.issuer.color || undefined,
                marketShare: card.issuer.marketShare ? Number(card.issuer.marketShare) : undefined
            },
            network: {
                ...card.network,
                color: card.network.color || undefined
            },
            customerSatisfactionScore: Number(card.customerSatisfactionScore),
            feeStructure: card.feeStructure as any,
            eligibilityRequirements: card.eligibilityRequirements as any,
            rewardStructure: card.rewardStructure as any,
            additionalBenefits: card.additionalBenefits as any,
            acceleratedRewards: card.acceleratedRewards.map(reward => ({
                ...reward,
                rewardRate: Number(reward.rewardRate),
                cappingLimit: reward.cappingLimit ? Number(reward.cappingLimit) : undefined
            }))
        })) as EnhancedCreditCard[];
    }

    /**
     * Score and rank credit cards using configuration-driven logic
     */
    private async scoreAndRankCards(
        cards: EnhancedCreditCard[],
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[],
        projectedAnnualSpending?: number,
        config?: RecommendationConfig
    ): Promise<CardRecommendation[]> {
        const recommendations: CardRecommendation[] = [];

        if (patterns.length === 0 || patterns.every(p => p.totalSpent <= 0)) {
            logger.warn('No positive spending patterns found, using fallback logic');
            return cards.slice(0, config?.scoring?.maxRecommendations || 3).map((card, index) => ({
                cardId: card.id,
                rank: index + 1,
                score: 25 + (index * 5),

                // Simplified - what users really care about
                estimatedAnnualCashback: 0,
                signupBonusValue: 0,

                // Contextual information
                primaryReason: 'Recommended for general use',
                pros: this.generateFallbackPros(card, config || {} as RecommendationConfig),
                cons: this.generateFallbackCons(card, config || {} as RecommendationConfig),
                benefitBreakdown: [],
                confidenceScore: 0.5,

                // Legacy fields (hidden from main response but kept for compatibility)
                statementSavings: 0,
                statementEarnings: 0,
                annualSavings: 0,
                annualEarnings: 0,
                potentialSavings: 0,
                currentEarnings: 0,
                yearlyEstimate: 0,
                feeBreakeven: 12,
            }));
        }

        const savingsAnalyses = await savingsCalculatorService.compareCards(cards, patterns);

        logger.info('Savings analysis results', {
            totalCards: cards.length,
            savingsAnalyses: savingsAnalyses.length,
            cardIds: savingsAnalyses.map(s => s.cardId)
        });

        // Process all recommendations in parallel for better performance
        const recommendationPromises = savingsAnalyses.map(async (savings) => {
            const card = cards.find(c => c.id === savings.cardId);
            if (!card) {
                logger.warn('Card not found for savings analysis', { cardId: savings.cardId });
                return null;
            }

            const recommendation = await this.buildRecommendationFromSavings(
                card,
                savings,
                criteria,
                patterns,
                config || {} as RecommendationConfig,
                projectedAnnualSpending
            );

            if (recommendation) {
                logger.info('Built recommendation', {
                    cardId: card.id,
                    cardName: card.name,
                    score: recommendation.score,
                    potentialSavings: recommendation.potentialSavings
                });
                return recommendation;
            } else {
                logger.warn('Failed to build recommendation', { cardId: card.id, cardName: card.name });
                return null;
            }
        });

        // Wait for all recommendations to complete and filter out nulls
        const allRecommendations = await Promise.all(recommendationPromises);
        const validRecommendations = allRecommendations.filter(rec => rec !== null) as CardRecommendation[];

        // PRIMARY SORT: Statement period earnings (most important for user value)
        // User wants to see cards ranked by how much they would have earned
        const sortedRecommendations = validRecommendations
            .sort((a, b) => {
                // Sort by statement period earnings (estimatedAnnualCashback)
                const aEarnings = a.estimatedAnnualCashback || 0;
                const bEarnings = b.estimatedAnnualCashback || 0;

                // Higher earnings first
                if (Math.abs(aEarnings - bEarnings) > 0.01) {
                    return bEarnings - aEarnings;
                }

                // If earnings are equal, sort by score as tiebreaker
                return b.score - a.score;
            })
            .map((rec, index) => ({ ...rec, rank: index + 1 }));

        // Log for debugging
        logger.info('Final recommendation rankings', {
            recommendations: sortedRecommendations.map(r => ({
                cardId: r.cardId,
                rank: r.rank,
                score: r.score,
                potentialSavings: r.potentialSavings
            }))
        });

        return sortedRecommendations;
    }

    /**
     * Build recommendation from savings analysis using configuration
     */
    private async buildRecommendationFromSavings(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[],
        config: RecommendationConfig,
        projectedAnnualSpending?: number
    ): Promise<CardRecommendation | null> {
        try {
            const score = await this.calculateOptimizedScore(card, savings, criteria, patterns, config);
            const pros = await this.generateEnhancedPros(card, savings, patterns, config);
            const cons = await this.generateEnhancedCons(card, savings, criteria, config);
            const primaryReason = this.generatePrimaryReason(card, savings, patterns);
            const confidenceScore = this.calculateConfidenceScore(card, savings, patterns, config);

            // Determine card type based on category and fee structure
            const cardType = this.determineCardType(card);

            return {
                cardId: card.id,
                rank: 0,
                score: Math.min(100, Math.max(0, score)),

                // Statement period earnings (no annualization)
                estimatedAnnualCashback: Math.max(0, savings.statementPeriodEarnings),
                signupBonusValue: savings.signupBonusValue,
                cardType,

                // Contextual information
                primaryReason,
                pros,
                cons,
                benefitBreakdown: this.convertSavingsToBreakdown(savings),
                confidenceScore,

                // Legacy fields for backward compatibility
                statementSavings: 0,
                statementEarnings: savings.statementPeriodEarnings,
                annualSavings: 0,
                annualEarnings: 0,
                potentialSavings: 0,
                currentEarnings: 0,
                yearlyEstimate: savings.statementPeriodEarnings,
                feeBreakeven: undefined,
            };
        } catch (error) {
            logger.error('Error building recommendation from savings', { cardId: card.id, error });
            return null;
        }
    }

    /**
     * Determine card type based on category and fee structure
     */
    private determineCardType(card: EnhancedCreditCard): string {
        const annualFee = card.feeStructure?.annualFee || 0;
        const categoryName = card.category?.name?.toLowerCase() || '';

        // Super Premium
        if (annualFee >= 10000 || categoryName.includes('super premium') || categoryName.includes('black')) {
            return 'Super Premium';
        }

        // Premium
        if (annualFee >= 2500 || categoryName.includes('premium') || categoryName.includes('gold')) {
            return 'Premium';
        }

        // Lifestyle
        if (categoryName.includes('lifestyle') || categoryName.includes('shopping')) {
            return 'Lifestyle';
        }

        // Travel & Fuel
        if (categoryName.includes('travel') || categoryName.includes('fuel') || categoryName.includes('miles')) {
            return 'Travel & Fuel';
        }

        // Cashback
        if (categoryName.includes('cashback') || card.rewardStructure?.rewardType === 'cashback') {
            return 'Cashback';
        }

        // Entry-Level (default for low/no fee cards)
        return 'Entry-Level';
    }

    /**
     * Calculate optimized score using configuration
     */
    private async calculateOptimizedScore(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[],
        config: RecommendationConfig
    ): Promise<number> {
        let score = config.scoring.baseScore;

        // 1. CATEGORY ALIGNMENT SCORE (50% weight) - Most important for feature matching
        const categoryScore = this.calculateCategoryAlignmentScore(card, patterns, config);
        score += categoryScore * 0.5;

        // 2. BRAND PREFERENCE SCORE (25% weight) - User preference and trust
        const brandScore = this.calculateBrandPreferenceScore(card, criteria, config);
        score += brandScore * 0.25;

        // 3. ACCESSIBILITY SCORE (15% weight) - Network acceptance and usability
        const accessibilityScore = this.calculateAccessibilityScore(card, criteria, config);
        score += accessibilityScore * 0.15;

        // 4. BONUS FACTORS (10% weight) - Additional benefits and features
        const bonusFactors = await this.calculateBonusFactors(card, patterns, config);
        score += bonusFactors * 0.1;

        // 5. PENALTY FACTORS - Deduct for limitations (but not fees)
        const penaltyFactors = await this.calculateNonFeePenaltyFactors(card, patterns, config);
        score -= penaltyFactors;

        // 6. LIFETIME FREE BONUS - Significant boost for no-fee cards
        if (card.isLifetimeFree) {
            score += await this.getConfigValue('BONUS_LIFETIME_FREE', 10);
        }

        // 7. CUSTOMER SATISFACTION BONUS
        if (card.customerSatisfactionScore >= 4.5) {
            score += await this.getConfigValue('BONUS_HIGH_CUSTOMER_SATISFACTION', 5);
        } else if (card.customerSatisfactionScore >= 4.0) {
            score += await this.getConfigValue('BONUS_MEDIUM_CUSTOMER_SATISFACTION', 3);
        }

        return Math.max(5, Math.min(100, score));
    }

    /**
     * Calculate penalty factors excluding fees (database-driven)
     */
    private async calculateNonFeePenaltyFactors(
        card: EnhancedCreditCard,
        patterns: SpendingPattern[],
        config: RecommendationConfig
    ): Promise<number> {
        let penalty = 0;

        // Network acceptance penalty
        if (card.network?.slug === CardNetwork.AMEX || card.network?.slug === CardNetwork.DINERS) {
            penalty += await this.getConfigValue('PENALTY_LIMITED_ACCEPTANCE', 5);
        }

        // Inactive card penalty
        if (!card.isActive) {
            penalty += await this.getConfigValue('PENALTY_INACTIVE_CARD', 15);
        }

        // Low customer satisfaction penalty
        if (card.customerSatisfactionScore < 3.5) {
            penalty += await this.getConfigValue('PENALTY_LOW_CUSTOMER_SATISFACTION', 8);
        }

        // Low recommendation score penalty
        if (card.recommendationScore < 70) {
            penalty += await this.getConfigValue('PENALTY_LOW_RECOMMENDATION_SCORE', 5);
        }

        return penalty;
    }

    /**
     * Get configuration value with fallback (database-driven)
     */
    private async getConfigValue(key: string, fallback: number): Promise<number> {
        try {
            const { configService } = await import('@/shared/services/config.service');
            return await configService.getNumericConfig(key);
        } catch (error) {
            logger.warn(`Failed to get config value for ${key}, using fallback`, { error });
            return fallback;
        }
    }

    /**
     * Calculate statement period value score using configuration
     */
    private calculateStatementPeriodValueScore(savings: CardSavingsAnalysis, config: RecommendationConfig): number {
        const periodValue = savings.statementPeriodEarnings + savings.signupBonusValue;

        // Use relative thresholds for statement period
        if (periodValue >= 5000) return 100;
        if (periodValue >= 3000) return 80;
        if (periodValue >= 2000) return 60;
        if (periodValue >= 1000) return 40;
        if (periodValue >= 500) return 20;

        return Math.max(0, 20 + (periodValue / 50));
    }

    /**
     * Calculate category alignment score using configuration
     */
    private calculateCategoryAlignmentScore(
        card: EnhancedCreditCard,
        patterns: SpendingPattern[],
        config: RecommendationConfig
    ): number {
        if (!patterns.length) return 20;

        let alignmentScore = 0;
        let totalWeight = 0;

        for (const pattern of patterns.slice(0, 5)) {
            const weight = pattern.percentage / 100;
            totalWeight += weight;

            const bestReward = this.findBestAcceleratedReward(card.acceleratedRewards, pattern);

            if (bestReward) {
                const rewardRate = bestReward.rewardRate;
                let categoryScore = 0;

                if (rewardRate >= REWARD_RATE_TIERS.OUTSTANDING) categoryScore = 100;
                else if (rewardRate >= REWARD_RATE_TIERS.EXCELLENT) categoryScore = 90;
                else if (rewardRate >= REWARD_RATE_TIERS.VERY_GOOD) categoryScore = 80;
                else if (rewardRate >= REWARD_RATE_TIERS.GOOD) categoryScore = 70;
                else if (rewardRate >= REWARD_RATE_TIERS.FAIR) categoryScore = 60;
                else if (rewardRate >= REWARD_RATE_TIERS.BASIC) categoryScore = 40;
                else categoryScore = 20;

                alignmentScore += categoryScore * weight;
            } else {
                // No accelerated reward found - score based on general value proposition
                const baseRate = (card.rewardStructure as any)?.baseRewardRate || 1;
                let generalScore = baseRate * 15; // Better base scoring

                // Bonus for lifetime free cards when no accelerated rewards
                if (card.isLifetimeFree) {
                    generalScore += 25; // Significant bonus for no annual fee
                }

                // Bonus for low annual fee cards
                const annualFee = card.feeStructure?.annualFee || 0;
                if (annualFee <= 500 && !card.isLifetimeFree) {
                    generalScore += 15; // Moderate bonus for low fees
                } else if (annualFee <= 1000 && !card.isLifetimeFree) {
                    generalScore += 10;
                } else if (annualFee > 2000) {
                    generalScore -= 10; // Penalty for high fees without matching rewards
                }

                // Bonus for high customer satisfaction (trust factor)
                const customerSat = card.customerSatisfactionScore || 0;
                if (customerSat >= 4.5) {
                    generalScore += 10;
                } else if (customerSat >= 4.0) {
                    generalScore += 5;
                }

                alignmentScore += Math.min(60, Math.max(5, generalScore)) * weight;
            }
        }

        return totalWeight > 0 ? alignmentScore / totalWeight : 20;
    }

    /**
     * Calculate fee efficiency score using configuration
     */
    private calculateFeeEfficiencyScore(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        config: RecommendationConfig
    ): number {
        const annualFee = savings.annualFee;
        const earnings = savings.statementPeriodEarnings;

        if (annualFee === 0) {
            return earnings > 0 ? 100 : 60;
        }

        if (earnings <= 0) {
            return Math.max(0, 50 - (annualFee / 100));
        }

        // For statement period, estimate ROI based on earnings vs fee
        const estimatedAnnualEarnings = earnings * 12; // Simple projection
        const roi = (estimatedAnnualEarnings / annualFee) * 100;

        if (roi >= ROI_TIERS.EXCELLENT) return 100;
        if (roi >= ROI_TIERS.VERY_GOOD) return 90;
        if (roi >= ROI_TIERS.GOOD) return 80;
        if (roi >= ROI_TIERS.FAIR) return 70;
        if (roi >= ROI_TIERS.POOR) return 50;

        return Math.max(10, 50 - ((100 - roi) / 2));
    }

    /**
     * Calculate brand preference score using configuration
     */
    private calculateBrandPreferenceScore(
        card: EnhancedCreditCard,
        criteria: RecommendationCriteria,
        config: RecommendationConfig
    ): number {
        let score = 50;

        if (criteria.preferredNetwork && card.network?.slug === criteria.preferredNetwork) {
            score += config.bonusFactors.preferredNetwork;
        }

        if (criteria.preferredIssuer && card.issuer?.slug === criteria.preferredIssuer) {
            score += config.bonusFactors.preferredIssuer;
        }

        // Check if issuer is popular based on market share
        if (card.issuer?.marketShare && Number(card.issuer.marketShare) > 10) {
            score += config.bonusFactors.popularIssuer;
        }

        return Math.min(100, score);
    }

    /**
     * Calculate accessibility score using configuration
     */
    private calculateAccessibilityScore(
        card: EnhancedCreditCard,
        criteria: RecommendationCriteria,
        config: RecommendationConfig
    ): number {
        let score = 50;

        const eligibility = card.eligibilityRequirements as any;
        const minIncome = eligibility?.minimumIncome?.salaried || 0;
        if (criteria.minIncome && minIncome <= criteria.minIncome) {
            score += 30;
        }

        const minCreditScore = eligibility?.minimumCreditScore || 600;
        const userCreditScore = CREDIT_SCORE_VALUES[criteria.creditScore || CreditScore.GOOD];

        if (userCreditScore >= minCreditScore) {
            score += 20;
        }

        return Math.min(100, score);
    }

    /**
     * Calculate bonus factors using configuration
     */
    private async calculateBonusFactors(
        card: EnhancedCreditCard,
        patterns: SpendingPattern[],
        config: RecommendationConfig
    ): Promise<number> {
        let bonus = 0;

        if (card.isLifetimeFree) {
            bonus += config.bonusFactors.lifetimeFree;
        }

        if (card.recommendationScore >= config.thresholds.highRecommendationScore) {
            bonus += config.bonusFactors.highRecommendationScore;
        } else if (card.recommendationScore >= config.thresholds.mediumRecommendationScore) {
            bonus += config.bonusFactors.mediumRecommendationScore;
        }

        if (Number(card.customerSatisfactionScore) >= config.thresholds.goodCustomerSatisfaction) {
            bonus += config.bonusFactors.highCustomerSatisfaction;
        }

        // Welcome bonus scoring - important for first-year value
        const welcomeBenefits = card.additionalBenefits?.find(benefit => benefit.categoryId === 'welcome_benefits');
        if (welcomeBenefits?.benefits && welcomeBenefits.benefits.length > 0) {
            const totalWelcomeValue = welcomeBenefits.benefits.reduce((sum, benefit) => {
                const value = typeof benefit.benefitValue === 'number' ? benefit.benefitValue : 0;
                return sum + value;
            }, 0);

            // Scale welcome bonus impact based on value
            if (totalWelcomeValue >= 2000) {
                bonus += 15; // High welcome bonus
            } else if (totalWelcomeValue >= 1000) {
                bonus += 10; // Medium welcome bonus
            } else if (totalWelcomeValue >= 500) {
                bonus += 5; // Basic welcome bonus
            }
        }

        const digitalFeatures = card.uniqueFeatures?.filter((f: string) =>
            DIGITAL_FEATURE_KEYWORDS.some(keyword => f.includes(keyword))
        ).length || 0;
        bonus += Math.min(config.bonusFactors.digitalFeaturesMax, digitalFeatures);

        return bonus;
    }

    /**
     * Calculate penalty factors using configuration
     */
    private calculatePenaltyFactors(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        patterns: SpendingPattern[],
        config: RecommendationConfig
    ): number {
        let penalty = 0;

        if (!card.isActive) {
            penalty += config.penaltyFactors.inactiveCard;
        }

        // Penalize high fee with low earnings
        const estimatedAnnualEarnings = savings.statementPeriodEarnings * 12;
        if (savings.annualFee > config.thresholds.highAnnualFee && estimatedAnnualEarnings < savings.annualFee) {
            penalty += config.penaltyFactors.highFeeLowBenefit;
        }

        if (Number(card.customerSatisfactionScore) < config.thresholds.poorCustomerSatisfaction) {
            penalty += config.penaltyFactors.poorCustomerSatisfaction;
        }

        if (card.network?.slug === CardNetwork.AMEX || card.network?.slug === CardNetwork.DINERS) {
            penalty += config.penaltyFactors.limitedAcceptance;
        }

        return penalty;
    }

    /**
     * Calculate confidence score using configuration
     */
    private calculateConfidenceScore(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        patterns: SpendingPattern[],
        config: RecommendationConfig
    ): number {
        let confidence = 0.5; // Base confidence from config

        const totalSpending = patterns.reduce((sum, p) => sum + p.totalSpent, 0);
        if (totalSpending > config.thresholds.highSpendingThreshold) confidence += 0.2;
        if (patterns.length >= config.thresholds.multipleCategoriesThreshold) confidence += 0.1;

        if (card.acceleratedRewards?.length > 0) confidence += 0.1;
        if ((card.additionalBenefits as any)?.length > 0) confidence += 0.05;

        if (savings.statementPeriodEarnings > 0) confidence += 0.1;
        if (savings.annualFee === 0) confidence += 0.05; // No-fee cards are safer recommendations

        return Math.min(1.0, confidence);
    }

    /**
     * Find best accelerated reward for spending pattern
     */
    private findBestAcceleratedReward(acceleratedRewards: any[], pattern: SpendingPattern): any {
        if (!acceleratedRewards || acceleratedRewards.length === 0) {
            return null;
        }

        let bestReward = null;
        let bestMatchScore = 0;

        for (const reward of acceleratedRewards) {
            // Use the same sophisticated matching logic as the savings calculator
            let score = 0;

            // Check for brand-specific vs general category alignment
            const isBrandSpecific = reward.rewardCategory?.slug === 'brand-specific' ||
                reward.rewardCategory?.name === 'Brand Specific';
            let brandSpecificPenalty = 0;

            if (isBrandSpecific) {
                if (reward.merchantPatterns && Array.isArray(reward.merchantPatterns)) {
                    const merchantMatch = this.checkMerchantPatternMatch(reward.merchantPatterns, pattern);
                    if (merchantMatch > 0) {
                        score += merchantMatch * 100; // High score for exact brand matches
                    } else {
                        brandSpecificPenalty = 60; // Penalty for brand-specific without merchant match
                    }
                } else {
                    brandSpecificPenalty = 60;
                }
            }

            // Direct category match
            if (reward.rewardCategory?.name === pattern.categoryName) {
                score += 100;

                // Bonus for non-brand-specific category matches
                if (!isBrandSpecific) {
                    score += 20;
                }
            }

            // MCC code match
            if (reward.rewardCategory?.mccCodes && Array.isArray(reward.rewardCategory.mccCodes)) {
                const mccMatches = pattern.mccCodes.filter(code =>
                    reward.rewardCategory.mccCodes.includes(code)
                ).length;
                score += mccMatches * 40;
            }

            // Apply brand-specific penalty
            score = Math.max(0, score - brandSpecificPenalty);

            if (score > bestMatchScore) {
                bestMatchScore = score;
                bestReward = reward;
            }
        }

        return bestReward;
    }

    /**
     * Helper function to check merchant pattern matches
     */
    private checkMerchantPatternMatch(merchantPatterns: string[], pattern: SpendingPattern): number {
        if (!pattern.merchants) return 0;

        let maxMatch = 0;
        for (const merchant of pattern.merchants) {
            for (const merchantPattern of merchantPatterns) {
                const similarity = this.calculateMerchantSimilarity(merchant.toLowerCase(), merchantPattern.toLowerCase());
                maxMatch = Math.max(maxMatch, similarity);
            }
        }

        return maxMatch;
    }

    /**
     * Calculate similarity between merchant and pattern
     */
    private calculateMerchantSimilarity(merchant: string, pattern: string): number {
        // Exact match
        if (merchant === pattern) return 1.0;

        // Contains match
        if (merchant.includes(pattern) || pattern.includes(merchant)) return 0.8;

        // Fuzzy matching for common variations
        const merchantWords = merchant.split(/\s+/);
        const patternWords = pattern.split(/\s+/);

        let matches = 0;
        for (const merchantWord of merchantWords) {
            for (const patternWord of patternWords) {
                if (merchantWord.includes(patternWord) || patternWord.includes(merchantWord)) {
                    matches++;
                    break;
                }
            }
        }

        const similarity = matches / Math.max(merchantWords.length, patternWords.length);
        return similarity >= 0.5 ? similarity * 0.6 : 0; // Lower confidence for fuzzy matches
    }

    /**
     * Generate enhanced pros using configuration
     */
    private async generateEnhancedPros(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        patterns: SpendingPattern[],
        config: RecommendationConfig
    ): Promise<string[]> {
        const pros: string[] = [];

        // Statement period earnings
        if (savings.statementPeriodEarnings > 500) {
            pros.push(`Earn ₹${Math.round(savings.statementPeriodEarnings)} with this card for this statement period`);
        } else if (savings.statementPeriodEarnings > 0) {
            pros.push(`Extra earnings: ₹${Math.round(savings.statementPeriodEarnings)} for this period`);
        }

        if (savings.signupBonusValue > 500) {
            pros.push(`Welcome benefits worth ₹${Math.round(savings.signupBonusValue)}`);
        }

        if (card.isLifetimeFree) {
            pros.push('Lifetime free - no annual fee ever');
        } else if ((card.feeStructure as any)?.annualFee === 0) {
            pros.push('No annual fee');
        }

        const topCategory = patterns[0];
        if (topCategory && savings.categoryBreakdown.length > 0) {
            const topCategoryBreakdown = savings.categoryBreakdown.find(
                c => c.categoryName === topCategory.categoryName
            );
            if (topCategoryBreakdown && topCategoryBreakdown.cardEarnRate >= 3) {
                pros.push(`${topCategoryBreakdown.cardEarnRate}% rewards on ${topCategory.categoryName}`);
            }
        }

        if (card.network?.slug === CardNetwork.RUPAY) {
            pros.push('RuPay network with UPI integration');
        }

        if (card.uniqueFeatures?.includes('contactless_payments')) {
            pros.push('Contactless payments supported');
        }

        if (card.uniqueFeatures?.includes('instant_digital_card_approval')) {
            pros.push('Instant digital card on approval');
        }

        if (card.issuer?.marketShare && Number(card.issuer.marketShare) > 10) {
            pros.push(`${card.issuer?.name} - trusted Indian bank`);
        }

        if (Number(card.customerSatisfactionScore) >= config.thresholds.goodCustomerSatisfaction) {
            pros.push('Highly rated by customers');
        }

        if (pros.length === 0) {
            pros.push('Solid rewards earning potential for Indian spending');
        }

        return pros.slice(0, 5);
    }

    /**
     * Generate enhanced cons using configuration
     */
    private async generateEnhancedCons(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        criteria: RecommendationCriteria,
        config: RecommendationConfig
    ): Promise<string[]> {
        const cons: string[] = [];

        const annualFee = (card.feeStructure as any)?.annualFee || 0;
        if (annualFee > 2000) {
            cons.push(`High annual fee of ₹${annualFee}`);
        } else if (annualFee > 0 && annualFee <= 2000) {
            cons.push(`Annual fee: ₹${annualFee}`);
        }

        if (savings.statementPeriodEarnings < 100) {
            cons.push('Limited earnings potential based on current spending');
        }

        const eligibility = card.eligibilityRequirements as any;
        const minIncome = eligibility?.minimumIncome?.salaried;
        if (minIncome > config.thresholds.highIncome) {
            cons.push(`Requires high income (₹${Math.round(minIncome / 100000)} lakh+ annually)`);
        }

        const minCreditScore = eligibility?.minimumCreditScore;
        if (minCreditScore >= config.thresholds.excellentCreditScore) {
            cons.push('Requires excellent credit score (750+)');
        }

        if (card.network?.slug === CardNetwork.AMEX) {
            cons.push('American Express - limited acceptance in India');
        } else if (card.network?.slug === CardNetwork.DINERS) {
            cons.push('Diners Club - limited acceptance compared to Visa/Mastercard');
        }

        if (!card.isActive) {
            cons.push('Card is currently not available for new applications');
        }

        if (Number(card.customerSatisfactionScore) < config.thresholds.poorCustomerSatisfaction) {
            cons.push('Below average customer satisfaction ratings');
        }

        if (card.acceleratedRewards?.length > 5) {
            cons.push('Complex reward structure with multiple categories');
        }

        return cons.slice(0, 4);
    }

    /**
     * Generate fallback pros using configuration
     */
    private generateFallbackPros(card: EnhancedCreditCard, config: RecommendationConfig): string[] {
        const pros: string[] = [];

        if (card.isLifetimeFree || (card.feeStructure as any)?.annualFee === 0) {
            pros.push('No annual fee');
        }

        if ((card.additionalBenefits as any)?.length > 0) {
            pros.push('Welcome benefits available');
        }

        if (card.issuer?.marketShare && Number(card.issuer.marketShare) > 10) {
            pros.push(`${card.issuer?.name} - trusted Indian bank`);
        }

        if (card.network?.slug === CardNetwork.RUPAY) {
            pros.push('RuPay network with UPI integration');
        }

        pros.push('Good for building credit history');
        return pros.slice(0, 3);
    }

    /**
     * Generate fallback cons using configuration
     */
    private generateFallbackCons(card: EnhancedCreditCard, config: RecommendationConfig): string[] {
        const cons: string[] = [];

        const annualFee = (card.feeStructure as any)?.annualFee || 0;
        if (annualFee > 500) {
            cons.push(`Annual fee of ₹${annualFee}`);
        }

        if (card.network?.slug === CardNetwork.AMEX || card.network?.slug === CardNetwork.DINERS) {
            cons.push(`${card.network?.name} - limited acceptance in India`);
        }

        if (!card.isActive) {
            cons.push('Currently not available for new applications');
        }

        return cons.slice(0, 2);
    }

    /**
     * Generate primary reason for recommendation
     */
    private generatePrimaryReason(
        card: EnhancedCreditCard,
        savings: CardSavingsAnalysis,
        patterns: SpendingPattern[]
    ): string {
        const bestEarningsCategory = savings.categoryBreakdown
            .sort((a, b) => b.cardEarnings - a.cardEarnings)[0];

        if (bestEarningsCategory && bestEarningsCategory.cardEarnRate >= 5) {
            return `Outstanding ${bestEarningsCategory.cardEarnRate}% rewards on ${bestEarningsCategory.categoryName}`;
        }

        if (savings.statementPeriodEarnings > 1000) {
            return `Earn ₹${Math.round(savings.statementPeriodEarnings)} for this statement period`;
        }

        if (card.isLifetimeFree && savings.statementPeriodEarnings > 200) {
            return `Lifetime free card with ₹${Math.round(savings.statementPeriodEarnings)} earnings`;
        }

        const topPattern = patterns[0];
        if (topPattern && bestEarningsCategory) {
            const categoryName = topPattern.categoryName;
            if (categoryName.includes('E-commerce') || categoryName.includes('Online')) {
                return `Perfect for online shopping with ${bestEarningsCategory.cardEarnRate}% rewards`;
            } else if (categoryName.includes('Dining') || categoryName.includes('Food')) {
                return `Excellent for food lovers with ${bestEarningsCategory.cardEarnRate}% on dining`;
            } else if (categoryName.includes('Travel')) {
                return `Ideal travel companion with ${bestEarningsCategory.cardEarnRate}% on travel`;
            }
        }

        if (card.isLifetimeFree) {
            return 'Lifetime free card with solid rewards earning';
        }

        if (Number(card.customerSatisfactionScore) >= 4.5) {
            return 'Highly rated card with excellent customer satisfaction';
        }

        return 'Well-suited for your spending profile with good rewards earning';
    }

    /**
     * Convert savings analysis to benefit breakdown format
     */
    private convertSavingsToBreakdown(savings: CardSavingsAnalysis): any[] {
        return savings.categoryBreakdown.map(category => {
            return {
                category: category.categoryName,
                currentRate: 0, // No baseline comparison
                cardRate: category.cardEarnRate,
                spentAmount: category.spentAmount, // Statement period amount
                earnedPoints: category.cardEarnings, // Statement period earnings
                dollarValue: category.cardEarnings, // Statement period earnings
                savingsAmount: 0, // No savings calculation
                monthlyCap: category.monthlyCap // Include monthly cap info
            };
        });
    }

    /**
     * Generate spending analysis
     */
    private async generateSpendingAnalysis(patterns: SpendingPattern[]): Promise<SpendingAnalysis> {
        const totalSpending = patterns.reduce((sum, p) => sum + p.totalSpent, 0);
        const totalTransactions = patterns.reduce((sum, p) => sum + p.transactionCount, 0);

        return {
            totalSpending,
            totalTransactions,
            averageTransactionAmount: totalSpending / totalTransactions,
            spendingDistribution: patterns.map(pattern => ({
                categoryName: pattern.categoryName,
                totalAmount: pattern.totalSpent,
                transactionCount: pattern.transactionCount,
                percentage: pattern.percentage,
                averageAmount: pattern.averageTransaction,
                mccCodes: pattern.mccCodes,
                topMerchants: pattern.merchants?.slice(0, 5) || []
            })),
            topMerchants: []
        };
    }

    /**
     * Get confidence level string
     */
    private getConfidenceLevel(score: number): string {
        if (score >= 0.9) return 'Very High';
        if (score >= 0.8) return 'High';
        if (score >= 0.7) return 'Medium';
        if (score >= 0.6) return 'Low';
        return 'Very Low';
    }

    /**
     * Store recommendations in database
     */
    private async storeRecommendations(
        sessionId: string,
        recommendations: CardRecommendation[],
    ): Promise<void> {
        if (recommendations.length === 0) return;

        try {
            await prisma.recommendation.deleteMany({
                where: { sessionId },
            });

            await prisma.recommendation.createMany({
                data: recommendations.map((rec) => ({
                    sessionId,
                    cardId: rec.cardId,
                    rank: rec.rank,
                    score: rec.score,
                    potentialSavings: isNaN(rec.potentialSavings || 0) ? 0 : (rec.potentialSavings || 0),
                    currentEarnings: isNaN(rec.currentEarnings || 0) ? 0 : (rec.currentEarnings || 0),
                    yearlyEstimate: isNaN(rec.yearlyEstimate || 0) ? 0 : (rec.yearlyEstimate || 0),
                    signupBonusValue: rec.signupBonusValue || null,
                    feeBreakeven: rec.feeBreakeven || null,
                    primaryReason: rec.primaryReason,
                    pros: rec.pros,
                    cons: rec.cons,
                    benefitBreakdown: rec.benefitBreakdown as any,
                })),
            });

            logger.info(`Stored ${recommendations.length} recommendations for session ${sessionId}`);
        } catch (error) {
            logger.error('Failed to store recommendations', { sessionId, error });
            throw new ApiError('Failed to save recommendations', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}

export const recommendationService = new RecommendationService();