import { SpendingPattern } from '../types/recommendation.types';
import { configService } from './config.service';
import { RewardCurrency } from '../constants/recommendation.constants';
import { logger } from '../utils/logger.util';

export interface CardSavingsAnalysis {
    cardId: string;
    // Statement period earnings only (no baseline subtraction, no annualization)
    statementPeriodEarnings: number; // Gross earnings for the statement period
    categoryBreakdown: CategorySavings[];
    signupBonusValue: number;
    joiningFee: number;
    annualFee: number;
}

export interface CategorySavings {
    categoryName: string;
    spentAmount: number;
    cardEarnRate: number;
    cardEarnings: number; // Gross earnings for this category in statement period
    percentageOfTotalSpend: number;
    monthlyCap?: number; // Monthly capping limit for this category
}

export interface BenefitMatch {
    benefit: any;
    matchScore: number;
    earnRate: number;
    category: string;
    description: string;
}

/**
 * Simplified savings calculator for credit card recommendations
 * This service calculates gross earnings for the statement period only
 * No baseline subtraction, no annualization
 */
export class SavingsCalculatorService {
    /**
     * Calculate statement period earnings for a card
     */
    async calculateCardSavings(
        card: any,
        spendingPatterns: SpendingPattern[],
        baselineCard?: any
    ): Promise<CardSavingsAnalysis> {
        // Filter out negative amounts (credits/refunds)
        const positiveSpendingPatterns = spendingPatterns.filter(
            pattern => pattern.totalSpent > 0
        );

        const totalPositiveSpend = positiveSpendingPatterns.reduce(
            (sum, pattern) => sum + pattern.totalSpent, 0
        );

        if (totalPositiveSpend === 0) {
            // Fallback for edge case with no positive spending
            return this.createEmptySavingsAnalysis(card.id,
                Number(card.feeStructure?.joiningFee || 0),
                Number(card.feeStructure?.annualFee || 0));
        }

        // Calculate category-wise earnings
        const categoryBreakdown: CategorySavings[] = [];
        let totalCardEarnings = 0;

        for (const pattern of positiveSpendingPatterns) {
            const categorySavings = await this.calculateCategorySavings(
                card,
                pattern,
                totalPositiveSpend
            );

            categoryBreakdown.push(categorySavings);
            totalCardEarnings += categorySavings.cardEarnings;
        }

        // Handle fees from new structure
        const joiningFee = Number(card.feeStructure?.joiningFee || 0);
        const annualFee = Number(card.feeStructure?.annualFee || card.annualFee || 0);

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

        // Debug logging for card-level earnings
        logger.info('Card earnings calculation debug', {
            cardId: card.id,
            cardName: card.name,
            totalPositiveSpend,
            totalCardEarnings,
            joiningFee,
            annualFee,
            signupBonusValue,
            isLifetimeFree: card.isLifetimeFree,
            categoryBreakdownCount: categoryBreakdown.length
        });

        return {
            cardId: card.id,
            statementPeriodEarnings: totalCardEarnings,
            categoryBreakdown,
            signupBonusValue,
            joiningFee,
            annualFee
        };
    }

    /**
     * Calculate earnings for a specific category using accelerated rewards structure
     */
    private async calculateCategorySavings(
        card: any,
        pattern: SpendingPattern,
        totalSpend: number
    ): Promise<CategorySavings> {
        // Find best matching accelerated reward for this category
        const bestReward = this.findBestAcceleratedReward(card.acceleratedRewards || [], pattern);

        // Determine card earn rate
        let cardEarnRate = card.rewardStructure?.baseRewardRate || card.baseRewardRate || 1.0;

        // Use accelerated reward rate if found and applicable
        if (bestReward && this.isRewardApplicable(bestReward, pattern)) {
            cardEarnRate = bestReward.rewardRate;
        }

        // Calculate uncapped earnings first
        const uncappedEarningsRaw = pattern.totalSpent * (cardEarnRate / 100);

        // Apply capping to EARNINGS (not spending)
        let monthlyCap: number | undefined = undefined;
        let cardEarningsRaw = uncappedEarningsRaw;

        if (bestReward?.cappingLimit && bestReward.cappingPeriod) {
            monthlyCap = bestReward.cappingLimit;
            // Cap is applied to the EARNINGS amount, not the spending
            cardEarningsRaw = Math.min(uncappedEarningsRaw, bestReward.cappingLimit);
        }

        // Convert points to cash value based on reward currency with better fallback logic
        let rewardCurrency = card.rewardCurrency;

        // If no reward currency is set, try to infer from rewardStructure
        if (!rewardCurrency && card.rewardStructure?.rewardCurrency) {
            rewardCurrency = card.rewardStructure.rewardCurrency;
        }

        // If still no currency, use the reward type to determine appropriate currency
        if (!rewardCurrency && card.rewardStructure?.rewardType) {
            if (card.rewardStructure.rewardType === 'cashback') {
                rewardCurrency = 'statement_credit';
            } else if (card.rewardStructure.rewardType === 'points') {
                rewardCurrency = 'reward_points';
            } else {
                rewardCurrency = 'default';
            }
        }

        const pointValue = await this.getPointValue(rewardCurrency || 'default');

        // Safety check for NaN values
        if (isNaN(pointValue) || pointValue <= 0) {
            logger.warn(`Invalid point value for currency ${card.rewardCurrency}, using fallback`, {
                cardId: card.id,
                rewardCurrency: card.rewardCurrency,
                pointValue
            });
            const fallbackPointValue = 0.25;
            let cardEarnings = cardEarningsRaw * fallbackPointValue;

            return {
                categoryName: pattern.categoryName,
                spentAmount: pattern.totalSpent,
                cardEarnRate,
                cardEarnings: isNaN(cardEarnings) ? 0 : cardEarnings,
                percentageOfTotalSpend: (pattern.totalSpent / totalSpend) * 100,
                monthlyCap
            };
        }

        // Convert earnings to dollar value based on point value
        let cardEarnings = cardEarningsRaw * pointValue;

        return {
            categoryName: pattern.categoryName,
            spentAmount: pattern.totalSpent,
            cardEarnRate,
            cardEarnings: isNaN(cardEarnings) ? 0 : cardEarnings,
            percentageOfTotalSpend: (pattern.totalSpent / totalSpend) * 100,
            monthlyCap
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

        // For brand-specific rewards, they should only match if there's explicit merchant match
        // BUT don't return early - let category matching also contribute to score
        const isBrandSpecific = reward.rewardCategory?.slug === 'brand-specific' || reward.rewardCategory?.name === 'Brand Specific';
        let brandSpecificPenalty = 0;

        if (isBrandSpecific) {
            if (reward.merchantPatterns && Array.isArray(reward.merchantPatterns)) {
                const merchantMatch = this.checkMerchantPatternMatch(reward.merchantPatterns, pattern);
                if (merchantMatch > 0) {
                    score += merchantMatch * 100; // Very high score for brand-specific merchant matches
                } else {
                    // Apply penalty for brand-specific without merchant match
                    brandSpecificPenalty = 60; // Will be subtracted later
                }
            } else {
                // Apply penalty for brand-specific without merchant patterns
                brandSpecificPenalty = 60;
            }
        }

        // Direct category match using reward category
        if (reward.rewardCategory?.name === pattern.categoryName) {
            score += 100;

            // Bonus for non-brand-specific category matches (better for general spending)
            if (!isBrandSpecific) {
                score += 20; // Prefer general category rewards over brand-specific
            }
        }

        // Enhanced category matching for Indian categories
        if (reward.rewardCategory?.name && pattern.categoryName) {
            const categoryMatch = this.getIndianCategoryMatch(reward.rewardCategory.name, pattern.categoryName);
            score += categoryMatch;

            // Additional bonus for non-brand-specific enhanced matches
            if (categoryMatch > 0 && !isBrandSpecific) {
                score += 15;
            }
        }

        // MCC code match (high priority) - Enhanced with flexible matching
        if (reward.rewardCategory?.mccCodes && Array.isArray(reward.rewardCategory.mccCodes)) {
            let mccScore = 0;

            // Exact MCC matches
            const exactMatches = pattern.mccCodes.filter(code =>
                reward.rewardCategory.mccCodes.includes(code)
            ).length;
            mccScore += exactMatches * 40;

            // Flexible MCC matching for similar categories
            if (exactMatches === 0) {
                for (const patternMcc of pattern.mccCodes) {
                    for (const rewardMcc of reward.rewardCategory.mccCodes) {
                        const flexScore = this.getMccSimilarityScore(patternMcc, rewardMcc);
                        if (flexScore > 0) {
                            mccScore += flexScore;
                            break; // Only count best match per pattern MCC
                        }
                    }
                }
            }

            score += mccScore;
        }

        // Merchant pattern matching for non-brand-specific rewards
        if (!isBrandSpecific && reward.merchantPatterns && Array.isArray(reward.merchantPatterns)) {
            const merchantMatch = this.checkMerchantPatternMatch(reward.merchantPatterns, pattern);
            if (merchantMatch > 0) {
                score += merchantMatch * 20; // Lower bonus for merchant matches on general rewards
            }
        }

        // Special handling for general spends
        if (reward.rewardCategory?.slug === 'general' && pattern.categoryName === 'Other') {
            score += 20;
        }

        // Apply brand-specific penalty if applicable
        score = Math.max(0, score - brandSpecificPenalty);

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
            'online shopping': ['e-commerce & online shopping', 'ecommerce', 'marketplace', 'online', 'retail shopping'],
            'dining & food': ['dining & food delivery', 'dining', 'food delivery'],
            'grocery': ['groceries & quick commerce', 'grocery', 'supermarkets'],
            'fuel & petrol': ['fuel & automotive', 'fuel', 'petrol'],
            'travel & transportation': ['travel & tourism', 'transportation', 'travel', 'tourism'],
            'utilities & bills': ['utilities & digital services', 'utilities', 'bills'],
            'entertainment & movies': ['entertainment & ott', 'entertainment', 'movies'],
            'retail shopping': ['retail shopping', 'shopping', 'retail', 'stores', 'malls'],
            'brand specific': ['brand'],
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
        // Handle special patterns first
        if (pattern === 'allonlinetransactions' || pattern === 'all_online_transactions') {
            return this.isOnlineTransaction(merchant) ? 1.0 : 0;
        }

        // Direct matches
        if (pattern === merchant) return 1.0;

        // Pattern-based matching for common merchant patterns
        const merchantMappings: Record<string, string[]> = {
            'amazon': ['amazon', 'amzn', 'amazonpay', 'amazonpayindia'],
            'amazonin': ['amazon', 'amzn', 'amazonin', 'amazonpay', 'amazonpayindia'],
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
     * Calculate how many months needed to recover annual fee through extra cashback
     */
    private calculateFeeBreakevenSpending(
        card: any,
        spendingPatterns: SpendingPattern[],
        annualFee: number,
        totalSpending: number
    ): number | null {
        if (annualFee <= 0 || card.isLifetimeFree) {
            return null; // No breakeven needed for free cards
        }

        // Calculate total extra cashback per statement period (month/quarter based on user data)
        let totalExtraCashback = 0;

        for (const pattern of spendingPatterns) {
            if (pattern.totalSpent <= 0) continue;

            // Baseline rate (what user currently gets - typically 1%)
            const baselineRate = 1;

            // Get card's rate for this category
            const bestReward = this.findBestAcceleratedReward(card.acceleratedRewards || [], pattern);
            const cardRate = bestReward ? bestReward.rewardRate : (card.rewardStructure?.baseRewardRate || 1);

            // Calculate extra cashback for this category
            const extraRate = Math.max(0, cardRate - baselineRate);
            const extraCashback = (pattern.totalSpent * extraRate) / 100;
            totalExtraCashback += extraCashback;
        }

        if (totalExtraCashback <= 0) {
            return null; // No extra benefit to justify fee
        }

        // Convert to monthly extra cashback (assuming data represents monthly spending)
        const monthlyExtraCashback = totalExtraCashback;

        // Calculate months to recover annual fee
        // Formula: Annual Fee ÷ Monthly Extra Cashback = Months to Break Even
        const monthsToBreakeven = annualFee / monthlyExtraCashback;

        return Math.round(monthsToBreakeven);
    }

    /**
     * Determine if a transaction is online based on merchant name and patterns
     */
    private isOnlineTransaction(merchant: string): boolean {
        const normalizedMerchant = this.normalizeMerchantName(merchant);

        // Online indicators in merchant names
        const onlineIndicators = [
            // E-commerce platforms
            'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'lenskart', 'zivame',
            'tatacliq', 'meesho', 'paytmmall', 'shopclues', 'firstcry', 'pepperfry',

            // Travel booking platforms
            'makemytrip', 'goibibo', 'cleartrip', 'yatra', 'expedia', 'booking',
            'agoda', 'ixigo', 'redbus', 'easemytrip', 'klook', 'airbnb',

            // Food delivery & online services
            'swiggy', 'zomato', 'uber', 'ola', 'dominos', 'pizzahut', 'kfc',
            'mcdonalds', 'burgerking', 'subway', 'foodpanda',

            // Digital services & streaming
            'netflix', 'amazonprime', 'hotstar', 'spotify', 'gaana', 'jiosaavn',
            'youtube', 'google', 'microsoft', 'adobe', 'zoom', 'canva',

            // Payment gateways & fintech
            'paytm', 'phonepe', 'googlepay', 'amazonpay', 'mobikwik', 'freecharge',
            'paypal', 'razorpay', 'payu', 'billdesk', 'ccavenue',

            // Online indicators in merchant descriptions
            'online', 'ecommerce', 'digital', 'web', 'app', 'mobile',
            'internet', 'portal', 'platform', 'marketplace',

            // International online merchants (common in India)
            'paypal', 'stripe', 'square', 'apple', 'microsoft', 'adobe',
            'zoom', 'dropbox', 'github', 'atlassian', 'slack',

            // Cryptocurrency & fintech
            'coinbase', 'binance', 'wazirx', 'coindcx', 'zebpay',

            // Online education & courses
            'coursera', 'udemy', 'skillshare', 'masterclass', 'byjus',
            'unacademy', 'vedantu', 'toppr', 'whitehatjr'
        ];

        // Geographic indicators (travel tech companies often have location indicators)
        const onlineGeoIndicators = [
            'singapore', 'hongkong', 'usa', 'uk', 'ireland', 'netherlands',
            'techltd', 'pvtltd', 'inc', 'llc', 'ltd', 'corp', 'technologies'
        ];

        // Check for direct online indicators
        for (const indicator of onlineIndicators) {
            if (normalizedMerchant.includes(indicator)) {
                return true;
            }
        }

        // Check for geographic indicators suggesting online/tech companies
        for (const geoIndicator of onlineGeoIndicators) {
            if (normalizedMerchant.includes(geoIndicator)) {
                return true;
            }
        }

        // Additional heuristics for online transactions
        // Companies with "tech", "digital", "online" in name
        if (normalizedMerchant.includes('tech') ||
            normalizedMerchant.includes('digital') ||
            normalizedMerchant.includes('online') ||
            normalizedMerchant.includes('ecom') ||
            normalizedMerchant.includes('cyber') ||
            normalizedMerchant.includes('web') ||
            normalizedMerchant.includes('app') ||
            normalizedMerchant.includes('mobile')) {
            return true;
        }

        // If merchant name contains common online patterns
        if (normalizedMerchant.includes('pvtltd') ||
            normalizedMerchant.includes('pvt') ||
            normalizedMerchant.includes('ltd') ||
            normalizedMerchant.includes('inc') ||
            normalizedMerchant.includes('corp')) {
            // These could be online, but let's be more specific
            // Only consider as online if they also have tech/digital indicators
            return normalizedMerchant.includes('solutions') ||
                normalizedMerchant.includes('services') ||
                normalizedMerchant.includes('systems') ||
                normalizedMerchant.includes('software');
        }

        return false;
    }

    /**
     * Calculate similarity score between MCC codes for flexible matching
     */
    private getMccSimilarityScore(patternMcc: string, rewardMcc: string): number {
        // MCC code groupings for similar merchant types
        const mccGroups: Record<string, string[]> = {
            // Retail & Shopping (53xx range)
            'retail_shopping': ['5300', '5309', '5310', '5311', '5331', '5399', '5651', '5732', '5941', '5945', '5977'],

            // Travel & Transportation (4xxx, 7xxx range)
            'travel': ['3000', '4112', '4121', '4131', '4722', '7011', '7012', '7032', '7033'],

            // Dining & Food (58xx range)
            'dining': ['5812', '5813', '5814'],

            // Grocery & Supermarkets (54xx range)
            'grocery': ['5411', '5422', '5441', '5499'],

            // Fuel & Gas (55xx range)
            'fuel': ['5541', '5542'],

            // Utilities & Bills (48xx, 49xx range)
            'utilities': ['4814', '4815', '4816', '4899', '4900'],

            // Entertainment (78xx, 58xx range)
            'entertainment': ['7832', '7841', '5815', '5816', '5817'],

            // Healthcare (80xx range)
            'healthcare': ['8011', '8021', '8031', '8041', '8049', '8050', '8062', '8071', '8099'],

            // Financial Services (60xx range)
            'financial': ['6010', '6011', '6012', '6050', '6051'],

            // Government & Taxes (93xx range)
            'government': ['9311', '9399', '9401', '9402', '9403']
        };

        // Find which groups each MCC belongs to
        let patternGroup = '';
        let rewardGroup = '';

        for (const [group, mccs] of Object.entries(mccGroups)) {
            if (mccs.includes(patternMcc)) {
                patternGroup = group;
            }
            if (mccs.includes(rewardMcc)) {
                rewardGroup = group;
            }
        }

        // If both MCCs are in the same group, give a similarity score
        if (patternGroup && rewardGroup && patternGroup === rewardGroup) {
            return 25; // Moderate score for same-group MCCs
        }

        // Check if MCCs are in adjacent ranges (might be related)
        const patternPrefix = patternMcc.substring(0, 2);
        const rewardPrefix = rewardMcc.substring(0, 2);

        if (patternPrefix === rewardPrefix) {
            return 10; // Small bonus for same prefix
        }

        return 0; // No similarity
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
                    earnRate: Number(benefit.earnRate || 1.0),
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
    private createEmptySavingsAnalysis(cardId: string, joiningFee: number, annualFee: number): CardSavingsAnalysis {
        return {
            cardId,
            statementPeriodEarnings: 0,
            categoryBreakdown: [],
            signupBonusValue: 0,
            joiningFee,
            annualFee
        };
    }

    /**
     * Calculate total value including signup bonus for statement period
     */
    calculateStatementPeriodValue(
        savings: CardSavingsAnalysis
    ): number {
        // Just return earnings + signup bonus for the statement period
        return savings.statementPeriodEarnings + savings.signupBonusValue;
    }

    /**
     * Compare multiple cards and rank by earnings potential
     */
    async compareCards(
        cards: any[],
        spendingPatterns: SpendingPattern[],
        baselineCard?: any
    ): Promise<CardSavingsAnalysis[]> {
        const analyses = await Promise.all(
            cards.map(card => this.calculateCardSavings(card, spendingPatterns, baselineCard))
        );

        // Sort by statement period earnings
        return analyses.sort((a, b) => b.statementPeriodEarnings - a.statementPeriodEarnings);
    }

    /**
     * Get recommendations based on different criteria
     */
    getTopRecommendations(
        analyses: CardSavingsAnalysis[],
        criteria: {
            maxAnnualFee?: number;
            prioritizeNoFee?: boolean;
            prioritizeSignupBonus?: boolean;
        } = {}
    ): CardSavingsAnalysis[] {
        let filtered = analyses;

        // Apply filters
        if (criteria.maxAnnualFee !== undefined) {
            filtered = filtered.filter(a => a.annualFee <= (criteria.maxAnnualFee || 0));
        }

        // Apply sorting preferences
        if (criteria.prioritizeNoFee) {
            filtered.sort((a, b) => {
                if (a.annualFee === 0 && b.annualFee > 0) return -1;
                if (a.annualFee > 0 && b.annualFee === 0) return 1;
                return b.statementPeriodEarnings - a.statementPeriodEarnings;
            });
        } else if (criteria.prioritizeSignupBonus) {
            filtered.sort((a, b) => {
                if (Math.abs(a.signupBonusValue - b.signupBonusValue) > 50) {
                    return b.signupBonusValue - a.signupBonusValue;
                }
                return b.statementPeriodEarnings - a.statementPeriodEarnings;
            });
        }

        return filtered;
    }
}

// Export singleton instance
export const savingsCalculatorService = new SavingsCalculatorService();
