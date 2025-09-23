import { SpendingPattern } from '../types/recommendation.types';
import { configService } from './config.service';
import { RewardCurrency } from '../constants/recommendation.constants';
import { logger } from '../utils/logger.util';

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

    // Point values are now loaded from database configuration

    /**
     * Calculate comprehensive savings analysis for a card
     */
    async calculateCardSavings(
        card: any,
        spendingPatterns: SpendingPattern[],
        baselineCard?: any
    ): Promise<CardSavingsAnalysis> {
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
            const categorySavings = await this.calculateCategorySavings(
                card,
                pattern,
                totalPositiveSpend,
                baselineCard
            );

            categoryBreakdown.push(categorySavings);
            totalCurrentEarnings += categorySavings.currentEarnings;
            totalCardEarnings += categorySavings.cardEarnings;
        }

        // Calculate actual positive savings (excluding negative differences)
        const totalActualSavings = categoryBreakdown.reduce((sum, breakdown) => sum + breakdown.savings, 0);

        // Handle annual fee from new structure
        const annualFee = Number(card.feeStructure?.annualFee || card.annualFee || 0);
        // Use actual positive savings instead of raw difference
        const grossSavings = totalActualSavings;

        // NET SAVINGS EXCLUDES ANNUAL FEE (as per user requirement)
        // This focuses on reward earning potential rather than fee impact
        const netSavings = grossSavings;

        // Calculate ROI and breakeven for informational purposes only
        const yearlyROI = annualFee > 0 ? (grossSavings / annualFee) * 100 :
            grossSavings > 0 ? Infinity : 0;

        const monthsToBreakeven = annualFee > 0 && grossSavings > 0 ?
            (annualFee / grossSavings) * 12 : null;

        // Signup bonus calculation from additional benefits
        let signupBonusValue = 0;
        if (card.additionalBenefits?.length > 0) {
            const welcomeBenefits = card.additionalBenefits.find((b: any) => b.categoryId === 'welcome_benefits');
            if (welcomeBenefits?.benefits?.length > 0) {
                signupBonusValue = welcomeBenefits.benefits.reduce((sum: number, benefit: any) => {
                    return sum + (Number(benefit.benefitValue) || 0);
                }, 0);
            }
        }

        // Fallback to legacy signupBonus field if exists
        if (signupBonusValue === 0 && card.signupBonus) {
            const pointValueMultiplier = await this.getPointValue(card.rewardCurrency || 'default');
            signupBonusValue = Number(card.signupBonus) * pointValueMultiplier;
        }

        // First year value includes signup bonus but excludes annual fee impact on net savings
        const totalFirstYearValue = grossSavings + signupBonusValue;

        // Debug logging for card-level savings
        logger.info('Card savings calculation debug', {
            cardId: card.id,
            cardName: card.name,
            totalPositiveSpend,
            totalCurrentEarnings,
            totalCardEarnings,
            grossSavings,
            annualFee,
            netSavings,
            signupBonusValue,
            totalFirstYearValue,
            isLifetimeFree: card.isLifetimeFree,
            categoryBreakdownCount: categoryBreakdown.length
        });

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
     * Calculate savings for a specific category using new accelerated rewards structure
     */
    private async calculateCategorySavings(
        card: any,
        pattern: SpendingPattern,
        totalSpend: number,
        baselineCard?: any
    ): Promise<CategorySavings> {
        // Find best matching accelerated reward for this category
        const bestReward = this.findBestAcceleratedReward(card.acceleratedRewards || [], pattern);

        // Determine earn rates
        const currentEarnRate = this.getCurrentEarnRate(baselineCard, pattern);
        let cardEarnRate = card.baseRewardRate || this.DEFAULT_EARN_RATE;

        // Use accelerated reward rate if found and applicable
        if (bestReward && this.isRewardApplicable(bestReward, pattern)) {
            cardEarnRate = bestReward.rewardRate;
        }

        // Apply capping if exists
        let effectiveSpending = pattern.totalSpent;
        if (bestReward?.cappingLimit && bestReward.cappingPeriod) {
            effectiveSpending = Math.min(pattern.totalSpent, bestReward.cappingLimit);
        }

        // Calculate earnings with point value conversion
        const currentEarnings = pattern.totalSpent * (currentEarnRate / 100);
        const cardEarningsRaw = effectiveSpending * (cardEarnRate / 100);

        // Convert points to cash value based on reward currency
        const pointValue = await this.getPointValue(card.rewardCurrency || 'default');

        // Debug logging for calculations
        logger.info('Category savings calculation debug', {
            cardId: card.id,
            categoryName: pattern.categoryName,
            totalSpent: pattern.totalSpent,
            effectiveSpending,
            currentEarnRate,
            cardEarnRate,
            currentEarnings,
            cardEarningsRaw,
            pointValue,
            rewardCurrency: card.rewardCurrency,
            merchants: pattern.merchants,
            bestReward: bestReward ? {
                categoryId: bestReward.categoryId,
                rewardRate: bestReward.rewardRate,
                merchantPatterns: bestReward.merchantPatterns,
                description: bestReward.description,
                cappingLimit: bestReward.cappingLimit,
                cappingPeriod: bestReward.cappingPeriod
            } : null,
            isRewardApplicable: bestReward ? this.isRewardApplicable(bestReward, pattern) : false
        });

        // Safety check for NaN values
        if (isNaN(pointValue) || pointValue <= 0) {
            logger.warn(`Invalid point value for currency ${card.rewardCurrency}, using fallback`, {
                cardId: card.id,
                rewardCurrency: card.rewardCurrency,
                pointValue
            });
            const fallbackPointValue = 0.25;
            let cardEarnings = cardEarningsRaw * fallbackPointValue;

            // Add base rate earnings for spending above cap
            if (effectiveSpending < pattern.totalSpent) {
                const baseEarnings = (pattern.totalSpent - effectiveSpending) * (card.baseRewardRate / 100) * fallbackPointValue;
                cardEarnings += baseEarnings;
            }

            const savings = cardEarnings - currentEarnings;

            return {
                categoryName: pattern.categoryName,
                spentAmount: pattern.totalSpent,
                currentEarnRate,
                cardEarnRate,
                currentEarnings: isNaN(currentEarnings) ? 0 : currentEarnings,
                cardEarnings: isNaN(cardEarnings) ? 0 : cardEarnings,
                savings: isNaN(savings) ? 0 : savings,
                percentageOfTotalSpend: (pattern.totalSpent / totalSpend) * 100
            };
        }

        let cardEarnings = cardEarningsRaw * pointValue;

        // Add base rate earnings for spending above cap
        if (effectiveSpending < pattern.totalSpent) {
            const baseEarnings = (pattern.totalSpent - effectiveSpending) * (card.baseRewardRate / 100) * pointValue;
            cardEarnings += baseEarnings;
        }

        // Only show positive savings - if card earns less or equal, show 0 savings
        const rawSavings = cardEarnings - currentEarnings;
        const savings = Math.max(0, rawSavings);

        // Debug final calculation
        logger.info('Final category savings calculation', {
            cardId: card.id,
            categoryName: pattern.categoryName,
            cardEarnings,
            currentEarnings,
            rawSavings,
            savings,
            cardEarnRate,
            currentEarnRate
        });

        return {
            categoryName: pattern.categoryName,
            spentAmount: pattern.totalSpent,
            currentEarnRate,
            cardEarnRate,
            currentEarnings: isNaN(currentEarnings) ? 0 : currentEarnings,
            cardEarnings: isNaN(cardEarnings) ? 0 : cardEarnings,
            savings: isNaN(savings) ? 0 : savings,
            percentageOfTotalSpend: (pattern.totalSpent / totalSpend) * 100
        };
    }

    /**
     * Find best matching accelerated reward for the new structure
     */
    private findBestAcceleratedReward(acceleratedRewards: any[], pattern: SpendingPattern): any {
        if (!acceleratedRewards || acceleratedRewards.length === 0) {
            return null;
        }

        let bestReward = null;
        let bestMatchScore = 0;

        for (const reward of acceleratedRewards) {
            const matchScore = this.calculateRewardMatchScore(reward, pattern);

            if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                bestReward = reward;
            }
        }

        return bestReward;
    }

    /**
     * Calculate match score for accelerated reward
     */
    private calculateRewardMatchScore(reward: any, pattern: SpendingPattern): number {
        let score = 0;

        // For brand-specific rewards, prioritize merchant pattern matching
        if (reward.rewardCategory?.slug === 'brand-specific' || reward.rewardCategory?.name === 'Brand Specific') {
            // For brand-specific rewards, merchant pattern match is the primary criterion
            if (reward.merchantPatterns && Array.isArray(reward.merchantPatterns)) {
                const merchantMatch = this.checkMerchantPatternMatch(reward.merchantPatterns, pattern);
                if (merchantMatch > 0) {
                    score += merchantMatch * 100; // Very high score for brand-specific merchant matches
                    return score; // Return early for brand-specific matches
                }
            }
            // If no merchant match for brand-specific reward, don't match it
            return 0;
        }

        // Direct category match using reward category
        if (reward.rewardCategory?.name === pattern.categoryName) {
            score += 100;
        }

        // Enhanced category matching for Indian categories
        if (reward.rewardCategory?.name && pattern.categoryName) {
            const categoryMatch = this.getIndianCategoryMatch(reward.rewardCategory.name, pattern.categoryName);
            score += categoryMatch;
        }

        // MCC code match (high priority)
        if (reward.rewardCategory?.mccCodes && Array.isArray(reward.rewardCategory.mccCodes)) {
            const mccMatches = pattern.mccCodes.filter(code =>
                reward.rewardCategory.mccCodes.includes(code)
            ).length;
            score += mccMatches * 40;
        }

        // Merchant pattern matching for non-brand-specific rewards
        if (reward.merchantPatterns && Array.isArray(reward.merchantPatterns)) {
            const merchantMatch = this.checkMerchantPatternMatch(reward.merchantPatterns, pattern);
            if (merchantMatch > 0) {
                score += merchantMatch * 30; // Lower weight for non-brand-specific merchant matches
            }
        }

        // Special handling for general spends
        if (reward.rewardCategory?.slug === 'general' && pattern.categoryName === 'Other') {
            score += 20;
        }

        return score;
    }

    /**
     * Enhanced Indian category matching
     */
    private getIndianCategoryMatch(rewardCategory: string, patternCategory: string): number {
        const reward = rewardCategory.toLowerCase();
        const pattern = patternCategory.toLowerCase();

        // Exact match
        if (reward === pattern) return 80;

        // Indian-specific mappings
        const mappings: Record<string, string[]> = {
            'online shopping': ['e-commerce & online shopping', 'ecommerce', 'marketplace'],
            'dining & food': ['dining & food delivery', 'dining', 'food delivery'],
            'grocery': ['groceries & quick commerce', 'grocery', 'supermarkets'],
            'fuel & petrol': ['fuel & automotive', 'fuel', 'petrol'],
            'travel & transportation': ['travel & tourism', 'transportation', 'travel'],
            'utilities & bills': ['utilities & digital services', 'utilities', 'bills'],
            'entertainment & movies': ['entertainment & ott', 'entertainment', 'movies'],
            'brand specific': ['retail shopping', 'shopping', 'brand'],
            'general spends': ['other', 'miscellaneous', 'general'],
        };

        for (const [key, values] of Object.entries(mappings)) {
            if ((key.includes(reward) || reward.includes(key)) &&
                values.some(v => pattern.includes(v) || v.includes(pattern))) {
                return 60;
            }
        }

        // Partial match
        if (reward.includes(pattern) || pattern.includes(reward)) {
            return 30;
        }

        return 0;
    }

    /**
     * Check if reward is applicable based on conditions and merchant patterns
     */
    private isRewardApplicable(reward: any, pattern: SpendingPattern): boolean {
        // Check conditions if they exist
        if (reward.conditions && Array.isArray(reward.conditions) && reward.conditions.length > 0) {
            // For now, assume all conditions are met
            // This could be enhanced to check specific conditions like:
            // - amazon_prime_membership
            // - minimum_transaction_amount
            // - specific_merchant_patterns
        }

        // CRITICAL: For brand-specific rewards, merchant patterns must match
        if (reward.merchantPatterns && Array.isArray(reward.merchantPatterns) && reward.merchantPatterns.length > 0) {
            const merchantMatch = this.checkMerchantPatternMatch(reward.merchantPatterns, pattern);
            // Only allow brand-specific rewards if there's a merchant match
            if (merchantMatch === 0) {
                return false; // No merchant match, reward not applicable
            }
        }

        return true;
    }

    /**
     * Check merchant pattern matching - Enhanced implementation
     */
    private checkMerchantPatternMatch(merchantPatterns: string[], pattern: SpendingPattern): number {
        if (!merchantPatterns || merchantPatterns.length === 0) return 0;
        if (!pattern.merchants || pattern.merchants.length === 0) return 0;

        let matchScore = 0;
        const totalMerchants = pattern.merchants.length;

        for (const merchantPattern of merchantPatterns) {
            const normalizedPattern = this.normalizeMerchantPattern(merchantPattern);

            for (const userMerchant of pattern.merchants) {
                const normalizedMerchant = this.normalizeMerchantName(userMerchant);

                const score = this.calculateMerchantMatchScore(normalizedPattern, normalizedMerchant);
                if (score > 0) {
                    matchScore += score;
                    break; // Found a match for this pattern, move to next
                }
            }
        }

        // Return normalized score (0-1 range)
        return Math.min(1, matchScore / merchantPatterns.length);
    }

    /**
     * Normalize merchant pattern for comparison
     */
    private normalizeMerchantPattern(pattern: string): string {
        return pattern.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    /**
     * Normalize merchant name for comparison
     */
    private normalizeMerchantName(merchant: string): string {
        return merchant.toLowerCase()
            .replace(/rsp\*/g, '') // Remove RSP* prefix
            .replace(/\s+(bangalore|mumbai|delhi|pune|hyderabad|chennai|kolkata|ahmedabad|gurugram|gurgaon|noida|ghaziabad)$/g, '') // Remove city suffixes
            .replace(/\s+/g, '') // Remove remaining spaces
            .replace(/[^a-z0-9]/g, '') // Remove special characters
            .trim();
    }

    /**
     * Calculate match score between pattern and merchant
     */
    private calculateMerchantMatchScore(pattern: string, merchant: string): number {
        // Direct matches
        if (pattern === merchant) return 1.0;

        // Pattern-based matching for common merchant patterns
        const merchantMappings: Record<string, string[]> = {
            'amazon': ['amazon', 'amzn'],
            'amazonin': ['amazon', 'amzn', 'amazonin'],
            'flipkart': ['flipkart', 'fkrt'],
            'myntra': ['myntra'],
            'swiggy': ['swiggy', 'instamart', 'swiggygenie', 'swiggyinstamart', 'swiggyinstamrt'], // Include Instamart as Swiggy partner
            'zomato': ['zomato', 'blinkit', 'grofers'],
            'uber': ['uber'],
            'ola': ['ola'],
            'pvr': ['pvr', 'district', 'districtmovie', 'districtmovietik', 'districtmovietic'],
            'cultfit': ['cult', 'cultfit'],
            'cult.fit': ['cult', 'cultfit'], // Handle the exact pattern from card data
            'cleartrip': ['cleartrip'],
            'zepto': ['zepto', 'zeptomarketplace'], // Quick commerce
            'blinkit': ['blinkit', 'grofers'],
            'bigbasket': ['bigbasket', 'bbinstant'],
            'bookmyshow': ['bookmyshow', 'bms'],
            'amazon_pay_partners': ['swiggy', 'uber', 'bookmyshow', 'pvr', 'cult', 'zepto', 'blinkit', 'instamart', 'zeptomarketplace', 'swiggyinstamart'],
            'tata_neu_ecosystem': ['tatacliq', 'bigbasket', 'croma', 'westside', 'titan', 'tanishq'],
            'tata_brands': ['tata', 'tatacliq', 'bigbasket', 'croma', 'westside', 'titan', 'tanishq'],
            'google_pay_bills': [] // No direct merchant match needed for utility bills
        };

        const patternVariants = merchantMappings[pattern] || [pattern];

        for (const variant of patternVariants) {
            if (merchant.includes(variant) || variant.includes(merchant)) {
                // Calculate confidence based on length similarity
                const similarity = Math.min(variant.length, merchant.length) / Math.max(variant.length, merchant.length);
                return similarity >= 0.6 ? similarity : 0;
            }
        }

        // Special pattern matching for RSP* prefixed merchants (common in Indian transactions)
        if (merchant.startsWith('rsp')) {
            const cleanMerchant = merchant.replace('rsp', '');
            for (const variant of patternVariants) {
                if (cleanMerchant.includes(variant) || variant.includes(cleanMerchant)) {
                    const similarity = Math.min(variant.length, cleanMerchant.length) / Math.max(variant.length, cleanMerchant.length);
                    return similarity >= 0.5 ? similarity * 0.9 : 0; // Slightly lower confidence for RSP matches
                }
            }
        }

        // Fuzzy matching for partial matches
        if (pattern.length >= 3 && merchant.length >= 3) {
            if (merchant.includes(pattern) || pattern.includes(merchant)) {
                const similarity = Math.min(pattern.length, merchant.length) / Math.max(pattern.length, merchant.length);
                return similarity >= 0.7 ? similarity * 0.8 : 0; // Reduced confidence for fuzzy matches
            }
        }

        return 0;
    }

    /**
     * Find best matching benefit with improved matching logic (legacy compatibility)
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
     * Get point value multiplier for different reward programs from database
     */
    private async getPointValue(rewardCurrency: string): Promise<number> {
        try {
            logger.info('🔍 DEBUGGING: Getting point value for currency:', { rewardCurrency });
            const pointValue = await configService.getPointValue(rewardCurrency as RewardCurrency);
            logger.info('🔍 DEBUGGING: Config service returned:', { rewardCurrency, pointValue, type: typeof pointValue });

            // If config returns 0 or invalid value, use intelligent defaults
            if (!pointValue || pointValue <= 0) {
                const defaultValue = this.getDefaultPointValue(rewardCurrency);
                logger.info('Using default point value', { rewardCurrency, defaultValue });
                return defaultValue;
            }

            logger.info('🔍 DEBUGGING: Using config point value - FINAL:', { rewardCurrency, pointValue });
            return pointValue;
        } catch (error) {
            logger.warn(`🔍 DEBUGGING: ERROR in getPointValue for ${rewardCurrency}:`, error);
            const defaultValue = this.getDefaultPointValue(rewardCurrency);
            logger.info('🔍 DEBUGGING: Error fallback point value - FINAL:', { rewardCurrency, defaultValue });
            return defaultValue;
        }
    }

    /**
     * Get default point value based on reward currency type
     */
    private getDefaultPointValue(rewardCurrency: string): number {
        const currency = rewardCurrency.toLowerCase();

        // Cashback currencies should have 1:1 value
        if (currency.includes('cashback') ||
            currency.includes('statement_credit') ||
            currency.includes('amazon_pay_balance') ||
            currency === 'default') {
            return 1.0;
        }

        // Points-based currencies typically have lower values
        if (currency.includes('reward_points') ||
            currency.includes('edge_reward_points')) {
            return 0.25;
        }

        // Other currencies (neu_coins, cash_points, etc.)
        if (currency.includes('neu_coins') || currency.includes('cash_points')) {
            return 1.0; // These are typically 1:1 with rupees
        }

        // Default fallback
        return 0.25;
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
    async compareCards(
        cards: any[],
        spendingPatterns: SpendingPattern[],
        baselineCard?: any
    ): Promise<CardSavingsAnalysis[]> {
        const analyses = await Promise.all(
            cards.map(card => this.calculateCardSavings(card, spendingPatterns, baselineCard))
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
