import { SpendingPattern } from './recommendation.service';

export interface CardSavingsAnalysis {
    cardId: string;
    totalCurrentEarnings: number;
    totalPotentialEarnings: number;
    netSavings: number; // After annual fee
    grossSavings: number; // Before annual fee
    annualFee: number;
    yearlyROI: number; // Return on investment percentage
    monthsToBreakeven: number | null;
    categoryBreakdown: CategorySavings[];
    signupBonusValue: number;
    totalFirstYearValue: number; // Including signup bonus
}

export interface CategorySavings {
    categoryName: string;
    spentAmount: number;
    currentEarnRate: number;
    cardEarnRate: number;
    currentEarnings: number;
    cardEarnings: number;
    savings: number;
    percentageOfTotalSpend: number;
}

export interface BenefitMatch {
    benefit: any;
    matchScore: number;
    earnRate: number;
    category: string;
    description: string;
}

/**
 * Comprehensive savings calculator for credit card recommendations
 * This service calculates actual savings potential by comparing card benefits
 * with user spending patterns, handling all edge cases
 */
export class SavingsCalculatorService {
    // Baseline earning rates for comparison
    private readonly BASELINE_CASHBACK = 1.0; // 1% baseline
    private readonly DEFAULT_EARN_RATE = 1.0;

    // Point values in cents (for converting points to cash value)
    private readonly POINT_VALUES = {
        'Chase Ultimate Rewards': 1.25,
        'Amex Membership Rewards': 1.2,
        'Citi ThankYou Points': 1.0,
        'Capital One Miles': 1.0,
        'Discover Cashback': 1.0,
        'Cashback': 1.0,
        'Default': 1.0,
    };

    /**
     * Calculate comprehensive savings analysis for a card
     */
    calculateCardSavings(
        card: any,
        spendingPatterns: SpendingPattern[],
        baselineCard?: any
    ): CardSavingsAnalysis {
        // Filter out negative amounts (credits/refunds) for savings calculation
        const positiveSpendingPatterns = spendingPatterns.filter(
            pattern => pattern.totalSpent > 0
        );

        const totalPositiveSpend = positiveSpendingPatterns.reduce(
            (sum, pattern) => sum + pattern.totalSpent, 0
        );

        if (totalPositiveSpend === 0) {
            // Fallback for edge case with no positive spending
            return this.createEmptySavingsAnalysis(card.id, Number(card.annualFee || 0));
        }

        // Calculate category-wise savings
        const categoryBreakdown: CategorySavings[] = [];
        let totalCurrentEarnings = 0;
        let totalCardEarnings = 0;

        for (const pattern of positiveSpendingPatterns) {
            const categorySavings = this.calculateCategorySavings(
                card,
                pattern,
                totalPositiveSpend,
                baselineCard
            );

            categoryBreakdown.push(categorySavings);
            totalCurrentEarnings += categorySavings.currentEarnings;
            totalCardEarnings += categorySavings.cardEarnings;
        }

        // Handle annual fee
        const annualFee = Number(card.annualFee || 0);
        const grossSavings = totalCardEarnings - totalCurrentEarnings;
        const netSavings = grossSavings - annualFee;

        // Calculate ROI and breakeven
        const yearlyROI = annualFee > 0 ? (grossSavings / annualFee) * 100 :
            grossSavings > 0 ? Infinity : 0;

        const monthsToBreakeven = grossSavings > 0 ?
            (annualFee / grossSavings) * 12 : null;

        // Signup bonus calculation
        const signupBonus = Number(card.signupBonus || 0);
        const pointValueMultiplier = this.getPointValue(card.rewardProgram || 'Default');
        const signupBonusValue = signupBonus * pointValueMultiplier;

        const totalFirstYearValue = netSavings + signupBonusValue;

        return {
            cardId: card.id,
            totalCurrentEarnings,
            totalPotentialEarnings: totalCardEarnings,
            netSavings,
            grossSavings,
            annualFee,
            yearlyROI,
            monthsToBreakeven,
            categoryBreakdown,
            signupBonusValue,
            totalFirstYearValue
        };
    }

    /**
     * Calculate savings for a specific category
     */
    private calculateCategorySavings(
        card: any,
        pattern: SpendingPattern,
        totalSpend: number,
        baselineCard?: any
    ): CategorySavings {
        // Find best matching benefit for this category
        const bestBenefit = this.findBestBenefit(card.benefits || [], pattern);

        // Determine earn rates
        const currentEarnRate = this.getCurrentEarnRate(baselineCard, pattern);
        const cardEarnRate = bestBenefit ?
            bestBenefit.earnRate :
            (Number(card.defaultCashback || card.defaultPoints || this.DEFAULT_EARN_RATE) * 100);

        // Calculate earnings
        const currentEarnings = pattern.totalSpent * (currentEarnRate / 100);
        const cardEarnings = pattern.totalSpent * (cardEarnRate / 100);
        const savings = cardEarnings - currentEarnings;

        return {
            categoryName: pattern.categoryName,
            spentAmount: pattern.totalSpent,
            currentEarnRate,
            cardEarnRate,
            currentEarnings,
            cardEarnings,
            savings,
            percentageOfTotalSpend: (pattern.totalSpent / totalSpend) * 100
        };
    }

    /**
     * Find best matching benefit with improved matching logic
     */
    private findBestBenefit(benefits: any[], pattern: SpendingPattern): BenefitMatch | null {
        if (!benefits || benefits.length === 0) {
            return null;
        }

        let bestBenefit = null;
        let bestMatchScore = 0;

        for (const benefit of benefits) {
            const matchScore = this.calculateBenefitMatchScore(benefit, pattern);

            if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                bestBenefit = {
                    benefit,
                    matchScore,
                    earnRate: Number(benefit.earnRate || this.DEFAULT_EARN_RATE),
                    category: benefit.category?.name || 'General',
                    description: benefit.description || `${benefit.earnRate}% on ${benefit.category?.name || 'purchases'}`
                };
            }
        }

        return bestBenefit;
    }

    /**
     * Enhanced benefit matching with multiple criteria
     */
    private calculateBenefitMatchScore(benefit: any, pattern: SpendingPattern): number {
        let score = 0;

        // Direct category name match (highest priority)
        if (benefit.category?.name?.toLowerCase() === pattern.categoryName?.toLowerCase()) {
            score += 100;
        }

        // Handle common category name variations
        if (benefit.category?.name && pattern.categoryName) {
            const benefitCategory = benefit.category.name.toLowerCase();
            const patternCategory = pattern.categoryName.toLowerCase();

            // Exact matches with common variations
            const categoryMappings = {
                'dining': ['dining & food delivery', 'restaurants', 'food'],
                'dining & food delivery': ['dining', 'restaurants', 'food'],
                'travel': ['transportation', 'airlines', 'hotels'],
                'grocery': ['groceries', 'supermarket', 'food'],
                'gas': ['gasoline', 'fuel', 'gas stations'],
                'healthcare': ['healthcare & wellness', 'medical'],
                'healthcare & wellness': ['healthcare', 'medical', 'wellness'],
            };

            if (benefitCategory === patternCategory) {
                score += 100;
            } else if ((categoryMappings as any)[benefitCategory]?.includes(patternCategory) ||
                (categoryMappings as any)[patternCategory]?.includes(benefitCategory)) {
                score += 90;
            } else if (benefitCategory.includes(patternCategory) || patternCategory.includes(benefitCategory)) {
                score += 60;
            }
        }

        // Subcategory match
        if (benefit.subCategory?.name?.toLowerCase() === pattern.subCategoryName?.toLowerCase()) {
            score += 80;
        }

        // MCC code match (very reliable)
        if (benefit.mccCodes && Array.isArray(benefit.mccCodes) && pattern.mccCodes) {
            const mccMatches = pattern.mccCodes.filter(code =>
                benefit.mccCodes.includes(code)
            ).length;
            score += mccMatches * 40; // Higher weight for MCC matches
        }

        // Special handling for "Other" category - only match with general benefits that don't have specific categories
        if (pattern.categoryName === 'Other' && !benefit.category) {
            score += 30;
        }

        // Keyword matching in descriptions and titles
        if (benefit.description && pattern.categoryName) {
            const description = benefit.description.toLowerCase();
            const title = benefit.title?.toLowerCase() || '';
            const category = pattern.categoryName.toLowerCase();

            if (description.includes(category) || title.includes(category)) {
                score += 25;
            }
        }

        // Penalize benefits that have very specific categories that don't match
        if (benefit.category && pattern.categoryName !== 'Other' &&
            benefit.category.name.toLowerCase() !== pattern.categoryName.toLowerCase() &&
            !this.isRelatedCategory(benefit.category.name, pattern.categoryName)) {
            score -= 20;
        }

        return Math.max(0, score);
    }

    /**
     * Check if two categories are related
     */
    private isRelatedCategory(benefitCategory: string, patternCategory: string): boolean {
        const related: Record<string, string[]> = {
            'dining': ['food', 'restaurants', 'delivery'],
            'travel': ['transportation', 'airlines', 'hotels', 'transit'],
            'grocery': ['food', 'supermarket'],
            'entertainment': ['streaming', 'movies', 'games'],
            'gas': ['fuel', 'gasoline'],
            'healthcare': ['medical', 'wellness', 'pharmacy'],
        };

        const benefit = benefitCategory.toLowerCase();
        const pattern = patternCategory.toLowerCase();

        return related[benefit]?.some((r: any) => pattern.includes(r)) ||
            related[pattern]?.some((r: any) => benefit.includes(r)) || false;
    }

    /**
     * Get current earning rate for baseline comparison
     */
    private getCurrentEarnRate(baselineCard: any, pattern: SpendingPattern): number {
        if (baselineCard) {
            const baseline = this.findBestBenefit(baselineCard.benefits || [], pattern);
            return baseline ? baseline.earnRate : this.BASELINE_CASHBACK;
        }
        return this.BASELINE_CASHBACK;
    }

    /**
     * Get point value multiplier for different reward programs
     */
    private getPointValue(rewardProgram: string): number {
        return (this.POINT_VALUES as any)[rewardProgram] || this.POINT_VALUES.Default;
    }

    /**
     * Create empty savings analysis for edge cases
     */
    private createEmptySavingsAnalysis(cardId: string, annualFee: number): CardSavingsAnalysis {
        return {
            cardId,
            totalCurrentEarnings: 0,
            totalPotentialEarnings: 0,
            netSavings: -annualFee,
            grossSavings: 0,
            annualFee,
            yearlyROI: annualFee > 0 ? -100 : 0,
            monthsToBreakeven: null,
            categoryBreakdown: [],
            signupBonusValue: 0,
            totalFirstYearValue: -annualFee
        };
    }

    /**
     * Calculate total value including signup bonus for first year
     */
    calculateFirstYearValue(
        savings: CardSavingsAnalysis,
        projectedAnnualSpend?: number
    ): number {
        let firstYearSavings = savings.netSavings;

        // If we have projected annual spend and current data is partial
        if (projectedAnnualSpend && projectedAnnualSpend > savings.totalCurrentEarnings * 100) {
            const spendMultiplier = projectedAnnualSpend / (savings.totalCurrentEarnings * 100);
            firstYearSavings = savings.grossSavings * spendMultiplier - savings.annualFee;
        }

        return firstYearSavings + savings.signupBonusValue;
    }

    /**
     * Compare multiple cards and rank by savings potential
     */
    compareCards(
        cards: any[],
        spendingPatterns: SpendingPattern[],
        baselineCard?: any
    ): CardSavingsAnalysis[] {
        const analyses = cards.map(card =>
            this.calculateCardSavings(card, spendingPatterns, baselineCard)
        );

        // Sort by total first year value (net savings + signup bonus)
        return analyses.sort((a, b) => b.totalFirstYearValue - a.totalFirstYearValue);
    }

    /**
     * Get recommendations based on different criteria
     */
    getTopRecommendations(
        analyses: CardSavingsAnalysis[],
        criteria: {
            maxAnnualFee?: number;
            minROI?: number;
            prioritizeNoFee?: boolean;
            prioritizeSignupBonus?: boolean;
        } = {}
    ): CardSavingsAnalysis[] {
        let filtered = analyses;

        // Apply filters
        if (criteria.maxAnnualFee !== undefined) {
            filtered = filtered.filter(a => a.annualFee <= (criteria.maxAnnualFee || 0));
        }

        if (criteria.minROI) {
            filtered = filtered.filter(a =>
                a.yearlyROI >= (criteria.minROI || 0) || a.annualFee === 0
            );
        }

        // Apply sorting preferences
        if (criteria.prioritizeNoFee) {
            filtered.sort((a, b) => {
                if (a.annualFee === 0 && b.annualFee > 0) return -1;
                if (a.annualFee > 0 && b.annualFee === 0) return 1;
                return b.totalFirstYearValue - a.totalFirstYearValue;
            });
        } else if (criteria.prioritizeSignupBonus) {
            filtered.sort((a, b) => {
                if (Math.abs(a.signupBonusValue - b.signupBonusValue) > 50) {
                    return b.signupBonusValue - a.signupBonusValue;
                }
                return b.totalFirstYearValue - a.totalFirstYearValue;
            });
        }

        return filtered;
    }
}

// Export singleton instance
export const savingsCalculatorService = new SavingsCalculatorService();
