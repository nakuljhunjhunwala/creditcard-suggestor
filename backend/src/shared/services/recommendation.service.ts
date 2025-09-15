import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';

/**
 * Credit Card Recommendation Service
 * Analyzes spending patterns and suggests optimal credit cards
 */

export interface SpendingPattern {
    categoryName: string;
    subCategoryName?: string;
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    monthlyAverage: number;
    percentage: number;
    mccCodes: string[];
}

export interface RecommendationCriteria {
    totalSpending: number;
    monthlySpending: number;
    topCategories: SpendingPattern[];
    creditScore?: 'excellent' | 'good' | 'fair' | 'poor';
    preferredNetwork?: 'visa' | 'mastercard' | 'amex' | 'discover';
    maxAnnualFee?: number;
    prioritizeSignupBonus?: boolean;
    includeBusinessCards?: boolean;
}

export interface CardRecommendation {
    cardId: string;
    rank: number;
    score: number;
    potentialSavings: number;
    currentEarnings: number;
    yearlyEstimate: number;
    signupBonusValue?: number;
    feeBreakeven?: number;
    primaryReason: string;
    pros: string[];
    cons: string[];
    benefitBreakdown: {
        category: string;
        currentRate: number;
        cardRate: number;
        spentAmount: number;
        earnedPoints: number;
        dollarValue: number;
    }[];
    confidenceScore: number;
}

export interface RecommendationResult {
    sessionId: string;
    recommendations: CardRecommendation[];
    criteria: RecommendationCriteria;
    totalCards: number;
    processingTimeMs: number;
    generatedAt: Date;
    summary: {
        topRecommendation: string;
        potentialSavings: number;
        averageScore: number;
        categoriesAnalyzed: number;
    };
}

export interface RecommendationStats {
    totalRecommendations: number;
    averageProcessingTime: number;
    popularRecommendations: Array<{
        cardName: string;
        recommendationCount: number;
        averageScore: number;
    }>;
    topCategories: Array<{
        category: string;
        frequency: number;
    }>;
}

export class RecommendationService {
    private readonly MAX_RECOMMENDATIONS = 5;
    private readonly MIN_SCORE_THRESHOLD = 30; // Temporarily lowered for debugging

    // Point values (cents per point/mile)
    private readonly POINT_VALUES = {
        'Chase Ultimate Rewards': 1.25,
        'Amex Membership Rewards': 1.0,
        'Citi ThankYou Points': 1.0,
        'Capital One Miles': 1.0,
        'Discover Cashback': 1.0,
        Default: 1.0,
    };

    /**
     * Generate credit card recommendations for a session
     */
    async generateRecommendations(
        sessionId: string,
        options: {
            creditScore?: 'excellent' | 'good' | 'fair' | 'poor';
            maxAnnualFee?: number;
            preferredNetwork?: string;
            includeBusinessCards?: boolean;
        } = {},
    ): Promise<RecommendationResult> {
        const startTime = Date.now();

        try {
            logger.info('Starting recommendation generation', { sessionId, options });

            // Step 1: Analyze spending patterns
            const spendingPatterns = await this.analyzeSpendingPatterns(sessionId);

            if (spendingPatterns.length === 0) {
                throw new ApiError(
                    'No spending data available for recommendations',
                    StatusCodes.BAD_REQUEST,
                );
            }

            // Step 2: Calculate recommendation criteria
            const criteria = this.buildRecommendationCriteria(
                spendingPatterns,
                options,
            );

            // Step 3: Get eligible credit cards
            const eligibleCards = await this.getEligibleCards(criteria);

            // Step 4: Score and rank cards
            const scoredCards = await this.scoreAndRankCards(
                eligibleCards,
                criteria,
                spendingPatterns,
            );

            // Step 5: Filter top recommendations
            const topRecommendations = scoredCards
                .filter((card) => card.score >= this.MIN_SCORE_THRESHOLD)
                .slice(0, this.MAX_RECOMMENDATIONS);

            // Step 6: Store recommendations
            await this.storeRecommendations(sessionId, topRecommendations);

            const processingTime = Date.now() - startTime;

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
                    averageScore:
                        topRecommendations.length > 0
                            ? topRecommendations.reduce((sum, r) => sum + r.score, 0) /
                            topRecommendations.length
                            : 0,
                    categoriesAnalyzed: spendingPatterns.length,
                },
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
     * Get stored recommendations for a session
     */
    async getSessionRecommendations(
        sessionId: string,
    ): Promise<CardRecommendation[]> {
        try {
            const recommendations = await prisma.recommendation.findMany({
                where: { sessionId },
                orderBy: { rank: 'asc' },
            });

            // Get cards separately to avoid include issues
            const cardIds = [...new Set(recommendations.map((r) => r.cardId))];
            const cards = await prisma.creditCard.findMany({
                where: { id: { in: cardIds } },
                select: {
                    id: true,
                    name: true,
                    issuer: true,
                    network: true,
                    annualFee: true,
                    signupBonus: true,
                    tier: true,
                    description: true,
                    applyUrl: true,
                },
            });

            // const cardMap = cards.reduce(
            //   (acc, card) => {
            //     acc[card.id] = card;
            //     return acc;
            //   },
            //   {} as Record<string, (typeof cards)[0]>,
            // );

            return recommendations.map((rec) => ({
                cardId: rec.cardId,
                rank: rec.rank,
                score: Number(rec.score),
                potentialSavings: Number(rec.potentialSavings),
                currentEarnings: Number(rec.currentEarnings),
                yearlyEstimate: Number(rec.yearlyEstimate),
                signupBonusValue: rec.signupBonusValue
                    ? Number(rec.signupBonusValue)
                    : undefined,
                feeBreakeven: rec.feeBreakeven ? Number(rec.feeBreakeven) : undefined,
                primaryReason: rec.primaryReason,
                pros: rec.pros as string[],
                cons: rec.cons as string[],
                benefitBreakdown: rec.benefitBreakdown as any[],
                confidenceScore: Number(rec.score) * 0.01, // Convert to 0-1 scale
            }));
        } catch (error) {
            logger.error('Failed to get session recommendations', {
                sessionId,
                error,
            });
            return [];
        }
    }

    /**
     * Recalculate recommendations with new criteria
     */
    async recalculateRecommendations(
        sessionId: string,
        newOptions: {
            creditScore?: 'excellent' | 'good' | 'fair' | 'poor';
            maxAnnualFee?: number;
            preferredNetwork?: string;
            includeBusinessCards?: boolean;
        },
    ): Promise<RecommendationResult> {
        // Delete existing recommendations
        await prisma.recommendation.deleteMany({
            where: { sessionId },
        });

        // Generate new recommendations
        return this.generateRecommendations(sessionId, newOptions);
    }

    /**
     * Get recommendation statistics
     */
    async getRecommendationStats(
        timeRangeHours: number = 24,
    ): Promise<RecommendationStats> {
        const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

        try {
            const [recommendations, sessions] = await Promise.all([
                prisma.recommendation.findMany({
                    where: {
                        createdAt: { gte: since },
                    },
                }),
                prisma.session.findMany({
                    where: {
                        updatedAt: { gte: since },
                        status: 'completed',
                    },
                    select: {
                        id: true,
                        topCategory: true,
                    },
                }),
            ]);

            // Get card names separately
            const cardIds = [...new Set(recommendations.map((r) => r.cardId))];
            const cards = await prisma.creditCard.findMany({
                where: { id: { in: cardIds } },
                select: { id: true, name: true },
            });
            const cardNameMap = cards.reduce(
                (acc, card) => {
                    acc[card.id] = card.name;
                    return acc;
                },
                {} as Record<string, string>,
            );

            // Popular recommendations
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
                    averageScore:
                        data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
                }))
                .sort((a, b) => b.recommendationCount - a.recommendationCount)
                .slice(0, 10);

            // Top categories
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
                averageProcessingTime: 0, // TODO: Track this if needed
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
     * Analyze spending patterns from transactions
     */
    private async analyzeSpendingPatterns(
        sessionId: string,
    ): Promise<SpendingPattern[]> {
        const transactions = await prisma.transaction.findMany({
            where: { sessionId },
            select: {
                amount: true,
                categoryName: true,
                subCategoryName: true,
                mccCode: true,
                date: true,
            },
        });

        if (transactions.length === 0) {
            return [];
        }

        // Group by category
        const categoryMap = new Map<
            string,
            {
                amounts: number[];
                subCategory?: string;
                mccCodes: Set<string>;
            }
        >();

        transactions.forEach((t) => {
            const category = t.categoryName || 'Other';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    amounts: [],
                    subCategory: t.subCategoryName || undefined,
                    mccCodes: new Set(),
                });
            }

            const entry = categoryMap.get(category)!;
            entry.amounts.push(Number(t.amount));
            if (t.mccCode) entry.mccCodes.add(t.mccCode);
        });

        // Calculate totals and averages (only positive spending for recommendations)
        const patterns: SpendingPattern[] = [];
        let totalPositiveSpending = 0;

        // First pass: calculate positive spending patterns
        categoryMap.forEach((data, categoryName) => {
            const totalSpent = data.amounts.reduce((sum, amount) => sum + amount, 0);
            const transactionCount = data.amounts.length;
            const averageTransaction = totalSpent / transactionCount;

            // Only include categories with positive spending for recommendations
            if (totalSpent > 0) {
                totalPositiveSpending += totalSpent;

                // Estimate monthly average (simple approach)
                const monthlyAverage = totalSpent; // Assuming one month of data

                patterns.push({
                    categoryName,
                    subCategoryName: data.subCategory,
                    totalSpent,
                    transactionCount,
                    averageTransaction,
                    monthlyAverage,
                    percentage: 0, // Will be calculated in second pass
                    mccCodes: Array.from(data.mccCodes),
                });
            }
        });

        // Second pass: calculate correct percentages based on positive spending only
        patterns.forEach(pattern => {
            pattern.percentage = (pattern.totalSpent / totalPositiveSpending) * 100;
        });

        return patterns.sort((a, b) => b.totalSpent - a.totalSpent);
    }

    /**
     * Build recommendation criteria from spending patterns
     */
    private buildRecommendationCriteria(
        patterns: SpendingPattern[],
        options: any,
    ): RecommendationCriteria {
        const totalSpending = patterns.reduce((sum, p) => sum + p.totalSpent, 0);

        return {
            totalSpending,
            monthlySpending: totalSpending, // Assuming one month of data
            topCategories: patterns.slice(0, 5), // Top 5 categories
            creditScore: options.creditScore || 'good',
            preferredNetwork: options.preferredNetwork,
            maxAnnualFee: options.maxAnnualFee || 500,
            prioritizeSignupBonus: totalSpending >= 3000, // If high spending
            includeBusinessCards: options.includeBusinessCards || false,
        };
    }

    /**
     * Get eligible credit cards based on criteria
     */
    private async getEligibleCards(
        criteria: RecommendationCriteria,
    ): Promise<any[]> {
        const filters: any = {};

        // Filter by annual fee
        if (criteria.maxAnnualFee !== undefined) {
            filters.annualFee = { lte: criteria.maxAnnualFee };
        }

        // Filter by network
        if (criteria.preferredNetwork) {
            filters.network = criteria.preferredNetwork;
        }

        // Filter by credit requirement based on credit score
        if (criteria.creditScore) {
            const creditRequirements = {
                excellent: ['excellent'],
                good: ['excellent', 'good'],
                fair: ['excellent', 'good', 'fair'],
                poor: ['excellent', 'good', 'fair', 'poor'],
            };
            filters.creditRequirement = {
                in: creditRequirements[criteria.creditScore],
            };
        }

        // Filter business cards
        if (!criteria.includeBusinessCards) {
            filters.tier = { not: 'business' };
        }

        const cards = await prisma.creditCard.findMany({
            where: filters,
        });

        // Get benefits separately to avoid deep include issues
        const cardIds = cards.map((c) => c.id);
        const benefits = await prisma.cardBenefit.findMany({
            where: { cardId: { in: cardIds } },
        });

        // Map benefits to cards
        const cardsWithBenefits = cards.map((card) => ({
            ...card,
            benefits: benefits.filter((b) => b.cardId === card.id),
        }));

        return cardsWithBenefits;
    }

    /**
     * Score and rank credit cards
     */
    private async scoreAndRankCards(
        cards: any[],
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[],
    ): Promise<CardRecommendation[]> {
        const recommendations: CardRecommendation[] = [];

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const recommendation = await this.scoreCard(card, criteria, patterns);

            if (recommendation) {
                recommendation.rank = i + 1;
                recommendations.push(recommendation);
            }
        }

        // Sort by score (descending)
        return recommendations
            .sort((a, b) => b.score - a.score)
            .map((rec, index) => ({
                ...rec,
                rank: index + 1,
            }));
    }

    /**
     * Score a single credit card
     */
    private async scoreCard(
        card: any,
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[],
    ): Promise<CardRecommendation | null> {
        try {
            let totalScore = 0;
            let currentEarnings = 0;
            let potentialEarnings = 0;
            const benefitBreakdown: any[] = [];
            const pros: string[] = [];
            const cons: string[] = [];

            // Calculate earnings for each spending category
            for (const pattern of patterns) {
                const matchingBenefit = this.findBestBenefit(card.benefits, pattern);

                if (matchingBenefit) {
                    const earnRate =
                        matchingBenefit.earnRate || card.defaultCashback || 1.0;
                    const categoryEarnings =
                        pattern.totalSpent * (Number(earnRate) / 100);

                    potentialEarnings += categoryEarnings;

                    benefitBreakdown.push({
                        category: pattern.categoryName,
                        currentRate: 1.0, // Assume 1% baseline
                        cardRate: Number(earnRate),
                        spentAmount: pattern.totalSpent,
                        earnedPoints: categoryEarnings,
                        dollarValue:
                            categoryEarnings * (this.POINT_VALUES['Default'] || 1.0),
                    });

                    // Scoring based on earn rate and spending
                    const categoryWeight = pattern.percentage / 100;
                    totalScore += Number(earnRate) * categoryWeight * 20; // Scale factor
                }
            }

            // Calculate baseline earnings (1% on everything)
            currentEarnings = criteria.totalSpending * 0.01;

            // Adjust for annual fee
            const annualFee = Number(card.annualFee);
            const feeAdjustedEarnings = potentialEarnings - annualFee;
            const potentialSavings = feeAdjustedEarnings - currentEarnings;

            // Fee impact on score
            if (annualFee > 0) {
                const feeBreakeven =
                    annualFee / (potentialEarnings - currentEarnings || 1);
                if (feeBreakeven > 1) {
                    pros.push(
                        `Annual fee pays for itself in ${feeBreakeven.toFixed(1)} years`,
                    );
                } else {
                    cons.push(`High annual fee of $${annualFee}`);
                    totalScore -= annualFee * 0.1; // Penalty for high fees
                }
            } else {
                pros.push('No annual fee');
                totalScore += 10; // Bonus for no fee
            }

            // Signup bonus impact
            const signupBonus = Number(card.signupBonus || 0);
            if (signupBonus > 0 && criteria.prioritizeSignupBonus) {
                const bonusValue = signupBonus * (this.POINT_VALUES['Default'] || 1.0);
                pros.push(`Signup bonus worth $${bonusValue}`);
                totalScore += bonusValue * 0.05; // 5% of bonus value
            }

            // Network and tier bonuses
            if (card.network === criteria.preferredNetwork) {
                totalScore += 5;
                pros.push(`Preferred ${card.network} network`);
            }

            if (card.tier === 'premium') {
                pros.push('Premium card benefits');
                totalScore += 10;
            }

            // Determine primary reason
            let primaryReason = 'General rewards earning';
            const topCategory = patterns[0];
            if (topCategory) {
                const topBenefit = this.findBestBenefit(card.benefits, topCategory);
                if (topBenefit && Number(topBenefit.earnRate) >= 2) {
                    primaryReason = `Excellent ${topCategory.categoryName} rewards (${topBenefit.earnRate}%)`;
                }
            }

            // Quality checks
            if (totalScore < this.MIN_SCORE_THRESHOLD) {
                return null;
            }

            return {
                cardId: card.id,
                rank: 0, // Will be set later
                score: Math.min(100, totalScore), // Cap at 100
                potentialSavings: Math.max(0, potentialSavings),
                currentEarnings,
                yearlyEstimate: potentialEarnings,
                signupBonusValue:
                    signupBonus > 0
                        ? signupBonus * (this.POINT_VALUES['Default'] || 1.0)
                        : undefined,
                feeBreakeven:
                    annualFee > 0 ? annualFee / Math.max(potentialSavings, 1) : undefined,
                primaryReason,
                pros,
                cons,
                benefitBreakdown,
                confidenceScore: Math.min(1.0, totalScore / 100),
            };
        } catch (error) {
            logger.error('Error scoring card', { cardId: card.id, error });
            return null;
        }
    }

    /**
     * Find best matching benefit for a spending pattern
     */
    private findBestBenefit(benefits: any[], pattern: SpendingPattern): any {
        let bestBenefit = null;
        let bestMatch = 0;

        for (const benefit of benefits) {
            let matchScore = 0;

            // Direct category match
            if (benefit.category?.name === pattern.categoryName) {
                matchScore += 10;
            }

            // Subcategory match
            if (benefit.subCategory?.name === pattern.subCategoryName) {
                matchScore += 5;
            }

            // MCC code match
            if (benefit.mccCodes && Array.isArray(benefit.mccCodes)) {
                const mccMatches = pattern.mccCodes.filter((code) =>
                    benefit.mccCodes.includes(code),
                ).length;
                matchScore += mccMatches * 2;
            }

            if (matchScore > bestMatch) {
                bestMatch = matchScore;
                bestBenefit = benefit;
            }
        }

        return bestBenefit;
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
            // Delete existing recommendations
            await prisma.recommendation.deleteMany({
                where: { sessionId },
            });

            // Insert new recommendations
            await prisma.recommendation.createMany({
                data: recommendations.map((rec) => ({
                    sessionId,
                    cardId: rec.cardId,
                    rank: rec.rank,
                    score: rec.score,
                    potentialSavings: rec.potentialSavings,
                    currentEarnings: rec.currentEarnings,
                    yearlyEstimate: rec.yearlyEstimate,
                    signupBonusValue: rec.signupBonusValue,
                    feeBreakeven: rec.feeBreakeven,
                    primaryReason: rec.primaryReason,
                    pros: rec.pros,
                    cons: rec.cons,
                    benefitBreakdown: rec.benefitBreakdown,
                })),
            });

            logger.info(
                `Stored ${recommendations.length} recommendations for session ${sessionId}`,
            );
        } catch (error) {
            logger.error('Failed to store recommendations', { sessionId, error });
            throw new ApiError(
                'Failed to save recommendations',
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
