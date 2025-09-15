import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';
import {
    savingsCalculatorService,
    CardSavingsAnalysis
} from './savings-calculator.service';

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
    private readonly MIN_SCORE_THRESHOLD = 10; // Much lower threshold to ensure recommendations
    private readonly FALLBACK_RECOMMENDATIONS = 3; // Always show at least 3 cards

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

            // Handle edge case of no positive spending patterns
            if (spendingPatterns.length === 0) {
                logger.warn('No positive spending patterns found, generating fallback recommendations', { sessionId });

                // Generate basic recommendations even without spending data
                const eligibleCards = await this.getEligibleCards({
                    totalSpending: 0,
                    monthlySpending: 0,
                    topCategories: [],
                    creditScore: options.creditScore || 'good',
                    preferredNetwork: options.preferredNetwork as "visa" | "mastercard" | "amex" | "discover" | undefined,
                    maxAnnualFee: options.maxAnnualFee || 500,
                    prioritizeSignupBonus: false,
                    includeBusinessCards: options.includeBusinessCards || false,
                });

                const fallbackRecommendations = eligibleCards.slice(0, this.FALLBACK_RECOMMENDATIONS).map((card, index) => ({
                    cardId: card.id,
                    rank: index + 1,
                    score: 30 - (index * 5), // Decreasing scores from 30
                    potentialSavings: 0,
                    currentEarnings: 0,
                    yearlyEstimate: 0,
                    primaryReason: 'Recommended for general spending and building credit history',
                    pros: this.getGeneralCardPros(card),
                    cons: this.getGeneralCardCons(card),
                    benefitBreakdown: [],
                    confidenceScore: 0.6,
                    signupBonusValue: Number(card.signupBonus || 0),
                    feeBreakeven: card.annualFee > 0 ? 12 : undefined,
                }));

                await this.storeRecommendations(sessionId, fallbackRecommendations);

                const processingTime = Date.now() - startTime;
                return {
                    sessionId,
                    recommendations: fallbackRecommendations,
                    criteria: {
                        totalSpending: 0,
                        monthlySpending: 0,
                        topCategories: [],
                        creditScore: options.creditScore || 'good',
                        preferredNetwork: options.preferredNetwork as "visa" | "mastercard" | "amex" | "discover" | undefined,
                        maxAnnualFee: options.maxAnnualFee || 500,
                        prioritizeSignupBonus: false,
                        includeBusinessCards: options.includeBusinessCards || false,
                    },
                    totalCards: eligibleCards.length,
                    processingTimeMs: processingTime,
                    generatedAt: new Date(),
                    summary: {
                        topRecommendation: fallbackRecommendations[0]?.primaryReason || 'No recommendations available',
                        potentialSavings: 0,
                        averageScore: fallbackRecommendations.reduce((sum, rec) => sum + rec.score, 0) / fallbackRecommendations.length || 0,
                        categoriesAnalyzed: 0
                    }
                };
            }

            // Step 2: Calculate recommendation criteria
            const criteria = this.buildRecommendationCriteria(
                spendingPatterns,
                options,
            );

            // Step 3: Get eligible credit cards
            const eligibleCards = await this.getEligibleCards(criteria);

            // Step 4: Score and rank cards using enhanced savings-based logic
            const scoredCards = await this.scoreAndRankCardsRobust(
                eligibleCards,
                criteria,
                spendingPatterns,
            );

            // Step 5: Get top recommendations with fallback logic
            let topRecommendations = scoredCards
                .filter((card) => card.score >= this.MIN_SCORE_THRESHOLD)
                .slice(0, this.MAX_RECOMMENDATIONS);

            // FALLBACK LOGIC: Always ensure user gets recommendations
            if (topRecommendations.length === 0) {
                logger.warn('No cards met threshold, applying fallback logic', {
                    sessionId,
                    totalCards: scoredCards.length,
                    threshold: this.MIN_SCORE_THRESHOLD
                });

                // Take top cards regardless of score, but boost their scores
                topRecommendations = scoredCards
                    .slice(0, this.FALLBACK_RECOMMENDATIONS)
                    .map(card => ({
                        ...card,
                        score: Math.max(card.score, this.MIN_SCORE_THRESHOLD),
                        primaryReason: `Best available option for your spending profile - ${card.primaryReason}`
                    }));
            }

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

        // Separate positive and negative transactions for better analysis
        const positiveTransactions = transactions.filter(t => Number(t.amount) > 0);
        const negativeTransactions = transactions.filter(t => Number(t.amount) < 0);

        logger.info('Transaction analysis', {
            total: transactions.length,
            positive: positiveTransactions.length,
            negative: negativeTransactions.length,
            sessionId
        });

        // Process only positive transactions for spending pattern analysis
        positiveTransactions.forEach((t) => {
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

        // Get benefits with category details
        const cardIds = cards.map((c) => c.id);
        const benefits = await prisma.cardBenefit.findMany({
            where: { cardId: { in: cardIds } },
        });

        // Get all categories and subcategories for benefit resolution
        const [categories, subCategories] = await Promise.all([
            prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
            prisma.subCategory.findMany({ select: { id: true, name: true, slug: true } }),
        ]);

        const categoryMap = categories.reduce((acc, cat) => {
            acc[cat.id] = cat;
            return acc;
        }, {} as Record<string, any>);

        const subCategoryMap = subCategories.reduce((acc, sub) => {
            acc[sub.id] = sub;
            return acc;
        }, {} as Record<string, any>);

        // Enhance benefits with category details
        const enhancedBenefits = benefits.map((benefit) => ({
            ...benefit,
            category: benefit.categoryId ? categoryMap[benefit.categoryId] : null,
            subCategory: benefit.subCategoryId ? subCategoryMap[benefit.subCategoryId] : null,
            earnRate: Number(benefit.rate) * 100, // Convert 0.03 to 3 for easier display
        }));

        // Map benefits to cards
        const cardsWithBenefits = cards.map((card) => ({
            ...card,
            benefits: enhancedBenefits.filter((b) => b.cardId === card.id),
        }));

        return cardsWithBenefits;
    }

    /**
     * Enhanced robust scoring and ranking using savings calculator
     */
    private async scoreAndRankCardsRobust(
        cards: any[],
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[],
    ): Promise<CardRecommendation[]> {
        const recommendations: CardRecommendation[] = [];

        // Handle edge case: no positive spending
        if (patterns.length === 0 || patterns.every(p => p.totalSpent <= 0)) {
            logger.warn('No positive spending patterns found, using fallback logic');

            // Return basic recommendations based on card features
            return cards.slice(0, this.MAX_RECOMMENDATIONS).map((card, index) => ({
                cardId: card.id,
                rank: index + 1,
                score: 25 + (index * 5), // Decreasing scores starting from 25
                potentialSavings: 0,
                currentEarnings: 0,
                yearlyEstimate: 0,
                primaryReason: 'Recommended for general use',
                pros: this.getGeneralCardPros(card),
                cons: this.getGeneralCardCons(card),
                benefitBreakdown: [],
                confidenceScore: 0.5,
                signupBonusValue: Number(card.signupBonus || 0),
                feeBreakeven: card.annualFee > 0 ? 12 : undefined,
            }));
        }

        // Use savings calculator for comprehensive analysis
        const savingsAnalyses = savingsCalculatorService.compareCards(cards, patterns);

        for (const savings of savingsAnalyses) {
            const card = cards.find(c => c.id === savings.cardId);
            if (!card) continue;

            const recommendation = this.buildRecommendationFromSavings(
                card,
                savings,
                criteria,
                patterns
            );

            if (recommendation) {
                recommendations.push(recommendation);
            }
        }

        // Sort by score (descending) and assign ranks
        return recommendations
            .sort((a, b) => b.score - a.score)
            .map((rec, index) => ({
                ...rec,
                rank: index + 1,
            }));
    }

    /**
     * Score and rank credit cards (legacy method kept for compatibility)
     */
    private async scoreAndRankCards(
        cards: any[],
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[],
    ): Promise<CardRecommendation[]> {
        // Delegate to robust method
        return this.scoreAndRankCardsRobust(cards, criteria, patterns);
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
     * Build recommendation from savings analysis
     */
    private buildRecommendationFromSavings(
        card: any,
        savings: CardSavingsAnalysis,
        criteria: RecommendationCriteria,
        patterns: SpendingPattern[]
    ): CardRecommendation | null {
        try {
            // Calculate score based on savings potential
            let score = 50; // Base score

            // Primary scoring based on first-year value
            if (savings.totalFirstYearValue > 0) {
                score += Math.min(40, savings.totalFirstYearValue / 10); // Up to 40 points
            } else if (savings.totalFirstYearValue < 0) {
                score -= Math.abs(savings.totalFirstYearValue) / 20; // Penalty for negative value
            }

            // ROI bonus (up to 20 points)
            if (savings.yearlyROI > 0) {
                score += Math.min(20, savings.yearlyROI / 10);
            }

            // Category match bonus
            const categoryMatchBonus = this.calculateCategoryMatchBonus(card, patterns);
            score += categoryMatchBonus;

            // Special handling for "Other" category dominance
            const otherCategoryPenalty = this.calculateOtherCategoryHandling(patterns);
            score -= otherCategoryPenalty;

            // Network and tier bonuses
            if (card.network === criteria.preferredNetwork) {
                score += 5;
            }
            if (card.tier === 'premium') {
                score += 10;
            }

            // Generate pros and cons
            const pros = this.generatePros(card, savings, patterns);
            const cons = this.generateCons(card, savings);

            // Determine primary reason based on best savings category
            const primaryReason = this.generatePrimaryReason(card, savings, patterns);

            // Ensure minimum score for valid recommendations
            score = Math.max(score, 5); // Always at least 5 points

            return {
                cardId: card.id,
                rank: 0, // Will be set later
                score: Math.min(100, Math.max(0, score)),
                potentialSavings: savings.netSavings,
                currentEarnings: savings.totalCurrentEarnings,
                yearlyEstimate: savings.totalPotentialEarnings,
                signupBonusValue: savings.signupBonusValue,
                feeBreakeven: savings.monthsToBreakeven || undefined,
                primaryReason,
                pros,
                cons,
                benefitBreakdown: this.convertSavingsToBreakdown(savings),
                confidenceScore: Math.min(1.0, score / 100),
            };
        } catch (error) {
            logger.error('Error building recommendation from savings', {
                cardId: card.id,
                error
            });
            return null;
        }
    }

    /**
     * Calculate category match bonus for scoring
     */
    private calculateCategoryMatchBonus(card: any, patterns: SpendingPattern[]): number {
        let bonus = 0;
        const benefits = card.benefits || [];

        for (const pattern of patterns) {
            const matchingBenefit = this.findBestBenefit(benefits, pattern);
            if (matchingBenefit) {
                const earnRate = Number(matchingBenefit.earnRate || 1);
                if (earnRate >= 5) bonus += 10;
                else if (earnRate >= 3) bonus += 7;
                else if (earnRate >= 2) bonus += 5;
            }
        }

        return Math.min(bonus, 25); // Cap at 25 points
    }

    /**
     * Handle "Other" category dominance with fallback logic
     */
    private calculateOtherCategoryHandling(patterns: SpendingPattern[]): number {
        const otherCategory = patterns.find(p => p.categoryName === 'Other');
        if (!otherCategory) return 0;

        const otherPercentage = otherCategory.percentage;

        // If "Other" dominates (>50%), slightly penalize but don't exclude
        if (otherPercentage > 50) {
            return 5; // Small penalty for uncertainty
        }

        return 0;
    }

    /**
     * Generate pros based on card features and savings
     */
    private generatePros(card: any, savings: CardSavingsAnalysis, patterns: SpendingPattern[]): string[] {
        const pros: string[] = [];

        // Savings-based pros
        if (savings.netSavings > 0) {
            pros.push(`Save $${savings.netSavings.toFixed(2)} annually based on your spending`);
        }

        if (savings.signupBonusValue > 0) {
            pros.push(`Signup bonus worth $${savings.signupBonusValue.toFixed(2)}`);
        }

        if (savings.totalFirstYearValue > 100) {
            pros.push(`Excellent first-year value: $${savings.totalFirstYearValue.toFixed(2)}`);
        }

        // Annual fee handling
        if (card.annualFee === 0) {
            pros.push('No annual fee');
        } else if (savings.monthsToBreakeven && savings.monthsToBreakeven <= 12) {
            pros.push(`Annual fee pays for itself in ${Math.ceil(savings.monthsToBreakeven)} months`);
        }

        // Category-specific pros
        const topCategory = patterns[0];
        if (topCategory && savings.categoryBreakdown.length > 0) {
            const topCategoryBreakdown = savings.categoryBreakdown.find(
                c => c.categoryName === topCategory.categoryName
            );
            if (topCategoryBreakdown && topCategoryBreakdown.cardEarnRate >= 2) {
                pros.push(`${topCategoryBreakdown.cardEarnRate}% rewards on ${topCategory.categoryName}`);
            }
        }

        // Card features
        if (card.tier === 'premium') {
            pros.push('Premium card benefits and perks');
        }

        // Ensure at least one pro
        if (pros.length === 0) {
            pros.push('Solid rewards earning potential');
        }

        return pros;
    }

    /**
     * Generate cons based on card features and savings
     */
    private generateCons(card: any, savings: CardSavingsAnalysis): string[] {
        const cons: string[] = [];

        // Annual fee concerns
        if (card.annualFee > 0) {
            if (!savings.monthsToBreakeven || savings.monthsToBreakeven > 24) {
                cons.push(`High annual fee of $${card.annualFee}`);
            } else if (savings.monthsToBreakeven > 12) {
                cons.push(`Takes ${Math.ceil(savings.monthsToBreakeven)} months to break even on annual fee`);
            }
        }

        // Low savings warning
        if (savings.netSavings < 0) {
            cons.push('May not provide significant savings based on current spending');
        }

        // Credit requirements
        if (card.creditRequirement === 'excellent') {
            cons.push('Requires excellent credit (750+ FICO)');
        }

        return cons;
    }

    /**
     * Generate primary reason for recommendation
     */
    private generatePrimaryReason(
        card: any,
        savings: CardSavingsAnalysis,
        patterns: SpendingPattern[]
    ): string {
        // Best savings category
        const bestSavingsCategory = savings.categoryBreakdown
            .filter(c => c.savings > 0)
            .sort((a, b) => b.savings - a.savings)[0];

        if (bestSavingsCategory && bestSavingsCategory.cardEarnRate >= 2) {
            return `Excellent ${bestSavingsCategory.categoryName} rewards (${bestSavingsCategory.cardEarnRate}% earning rate)`;
        }

        // First-year value
        if (savings.totalFirstYearValue > 200) {
            return `Outstanding first-year value of $${savings.totalFirstYearValue.toFixed(2)}`;
        }

        // General earning potential
        if (savings.netSavings > 50) {
            return `Strong earning potential with $${savings.netSavings.toFixed(2)} annual savings`;
        }

        // Fallback reasons
        if (card.annualFee === 0) {
            return 'No annual fee with solid rewards earning';
        }

        return 'Good overall rewards earning for your spending profile';
    }

    /**
     * Convert savings analysis to benefit breakdown format
     */
    private convertSavingsToBreakdown(savings: CardSavingsAnalysis): any[] {
        return savings.categoryBreakdown.map(category => ({
            category: category.categoryName,
            currentRate: category.currentEarnRate,
            cardRate: category.cardEarnRate,
            spentAmount: category.spentAmount,
            earnedPoints: category.cardEarnings,
            dollarValue: category.cardEarnings,
            savingsAmount: category.savings,
        }));
    }

    /**
     * Get general pros for fallback scenarios
     */
    private getGeneralCardPros(card: any): string[] {
        const pros: string[] = [];

        if (card.annualFee === 0) {
            pros.push('No annual fee');
        }

        if (card.signupBonus > 0) {
            pros.push(`Signup bonus available`);
        }

        if (card.tier === 'premium') {
            pros.push('Premium card benefits');
        } else {
            pros.push('Simple and straightforward rewards');
        }

        return pros;
    }

    /**
     * Get general cons for fallback scenarios
     */
    private getGeneralCardCons(card: any): string[] {
        const cons: string[] = [];

        if (card.annualFee > 100) {
            cons.push(`Annual fee of $${card.annualFee}`);
        }

        if (card.creditRequirement === 'excellent') {
            cons.push('Requires excellent credit');
        }

        return cons;
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
