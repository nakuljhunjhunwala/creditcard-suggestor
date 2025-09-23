/**
 * Configuration Service
 * Manages dynamic configuration from database with caching
 */

import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';
import { CONFIG_KEYS, DEFAULT_CONFIG_VALUES, RewardCurrency } from '@/shared/constants/recommendation.constants';
import type {
    RecommendationConfig,
    ScoringConfig,
    ThresholdConfig,
    WeightConfig,
    PointValueConfig,
    BonusFactorConfig,
    PenaltyFactorConfig,
    CachedConfig
} from '@/shared/types/recommendation.types';

export class ConfigService {
    private static instance: ConfigService;
    private cachedConfig: CachedConfig | null = null;
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    private constructor() { }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Get complete recommendation configuration
     */
    async getRecommendationConfig(): Promise<RecommendationConfig> {
        try {
            // Check cache first
            if (this.isCacheValid()) {
                return this.cachedConfig!.config;
            }

            // Load from database
            const config = await this.loadConfigFromDatabase();

            // Cache the result
            this.cachedConfig = {
                config,
                lastUpdated: new Date(),
                version: '1.0'
            };

            return config;
        } catch (error) {
            logger.error('Failed to load recommendation config', { error });
            return this.getDefaultConfig();
        }
    }

    /**
     * Get specific configuration value
     */
    async getConfigValue(key: string): Promise<string> {
        try {
            const configItem = await prisma.appConfig.findUnique({
                where: { key }
            });

            return configItem?.value || DEFAULT_CONFIG_VALUES[key] || '0';
        } catch (error) {
            logger.error('Failed to get config value', { key, error });
            return DEFAULT_CONFIG_VALUES[key] || '0';
        }
    }

    /**
     * Get numeric configuration value
     */
    async getNumericConfig(key: string): Promise<number> {
        const value = await this.getConfigValue(key);
        const numericValue = parseFloat(value);
        return isNaN(numericValue) ? 0 : numericValue;
    }

    /**
     * Update configuration value
     */
    async updateConfigValue(key: string, value: string, description?: string): Promise<void> {
        try {
            await prisma.appConfig.upsert({
                where: { key },
                update: { value, description },
                create: { key, value, description }
            });

            // Invalidate cache
            this.cachedConfig = null;

            logger.info('Configuration updated', { key, value });
        } catch (error) {
            logger.error('Failed to update config value', { key, value, error });
            throw error;
        }
    }

    /**
     * Initialize default configuration values
     */
    async initializeDefaultConfig(): Promise<void> {
        try {
            const existingKeys = await prisma.appConfig.findMany({
                select: { key: true }
            });

            const existingKeySet = new Set(existingKeys.map(item => item.key));
            const configEntries = Object.entries(DEFAULT_CONFIG_VALUES)
                .filter(([key]) => !existingKeySet.has(key))
                .map(([key, value]) => ({
                    key,
                    value,
                    description: this.getConfigDescription(key)
                }));

            if (configEntries.length > 0) {
                await prisma.appConfig.createMany({
                    data: configEntries,
                    skipDuplicates: true
                });

                logger.info(`Initialized ${configEntries.length} default config values`);
            }
        } catch (error) {
            logger.error('Failed to initialize default config', { error });
            throw error;
        }
    }

    /**
     * Get point value for reward currency
     */
    async getPointValue(currency: RewardCurrency | string): Promise<number> {
        const configKey = this.getPointValueConfigKey(currency);
        return this.getNumericConfig(configKey);
    }

    /**
     * Get all point values
     */
    async getPointValues(): Promise<PointValueConfig> {
        const [
            rewardPoints,
            edgeRewardPoints,
            cashback,
            neuCoins,
            cashPoints,
            amazonPayBalance,
            statementCredit,
            miles,
            defaultValue
        ] = await Promise.all([
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_REWARD_POINTS),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_EDGE_REWARD_POINTS),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_CASHBACK),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_NEU_COINS),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_CASH_POINTS),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_AMAZON_PAY_BALANCE),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_STATEMENT_CREDIT),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_MILES),
            this.getNumericConfig(CONFIG_KEYS.POINT_VALUE_DEFAULT)
        ]);

        return {
            [RewardCurrency.REWARD_POINTS]: rewardPoints,
            [RewardCurrency.EDGE_REWARD_POINTS]: edgeRewardPoints,
            [RewardCurrency.CASHBACK]: cashback,
            [RewardCurrency.NEU_COINS]: neuCoins,
            [RewardCurrency.CASH_POINTS]: cashPoints,
            [RewardCurrency.AMAZON_PAY_BALANCE]: amazonPayBalance,
            [RewardCurrency.STATEMENT_CREDIT]: statementCredit,
            [RewardCurrency.MILES]: miles,
            default: defaultValue
        };
    }

    /**
     * Clear configuration cache
     */
    clearCache(): void {
        this.cachedConfig = null;
        logger.info('Configuration cache cleared');
    }

    // ==================== PRIVATE METHODS ====================

    private async loadConfigFromDatabase(): Promise<RecommendationConfig> {
        const [scoring, thresholds, weights, pointValues, bonusFactors, penaltyFactors] = await Promise.all([
            this.loadScoringConfig(),
            this.loadThresholdConfig(),
            this.loadWeightConfig(),
            this.getPointValues(),
            this.loadBonusFactorConfig(),
            this.loadPenaltyFactorConfig()
        ]);

        return {
            scoring,
            thresholds,
            weights,
            pointValues,
            bonusFactors,
            penaltyFactors
        };
    }

    private async loadScoringConfig(): Promise<ScoringConfig> {
        const [minScoreThreshold, maxRecommendations, fallbackRecommendations] = await Promise.all([
            this.getNumericConfig(CONFIG_KEYS.MIN_SCORE_THRESHOLD),
            this.getNumericConfig(CONFIG_KEYS.MAX_RECOMMENDATIONS),
            this.getNumericConfig(CONFIG_KEYS.FALLBACK_RECOMMENDATIONS)
        ]);

        return {
            minScoreThreshold,
            maxRecommendations,
            fallbackRecommendations,
            baseScore: 30
        };
    }

    private async loadThresholdConfig(): Promise<ThresholdConfig> {
        const configPromises = [
            this.getNumericConfig(CONFIG_KEYS.MIN_TOTAL_SPENDING),
            this.getNumericConfig(CONFIG_KEYS.MIN_CATEGORY_PERCENTAGE),
            this.getNumericConfig(CONFIG_KEYS.MIN_CATEGORY_AMOUNT),
            this.getNumericConfig(CONFIG_KEYS.MAX_CATEGORIES_TO_ANALYZE),
            this.getNumericConfig(CONFIG_KEYS.LARGE_TRANSACTION_THRESHOLD),
            this.getNumericConfig(CONFIG_KEYS.HIGH_SPENDING_THRESHOLD),
            this.getNumericConfig(CONFIG_KEYS.MULTIPLE_CATEGORIES_THRESHOLD),
            this.getNumericConfig(CONFIG_KEYS.QUICK_BREAKEVEN_MONTHS),
            this.getNumericConfig(CONFIG_KEYS.THRESHOLD_HIGH_ANNUAL_FEE),
            this.getNumericConfig(CONFIG_KEYS.THRESHOLD_HIGH_INCOME),
            this.getNumericConfig(CONFIG_KEYS.THRESHOLD_EXCELLENT_CREDIT_SCORE),
            this.getNumericConfig(CONFIG_KEYS.THRESHOLD_GOOD_CUSTOMER_SATISFACTION),
            this.getNumericConfig(CONFIG_KEYS.THRESHOLD_POOR_CUSTOMER_SATISFACTION),
            this.getNumericConfig(CONFIG_KEYS.THRESHOLD_HIGH_RECOMMENDATION_SCORE),
            this.getNumericConfig(CONFIG_KEYS.THRESHOLD_MEDIUM_RECOMMENDATION_SCORE)
        ];

        const [
            minTotalSpending,
            minCategoryPercentage,
            minCategoryAmount,
            maxCategoriesToAnalyze,
            largeTransactionThreshold,
            highSpendingThreshold,
            multipleCategoriesThreshold,
            quickBreakevenMonths,
            highAnnualFee,
            highIncome,
            excellentCreditScore,
            goodCustomerSatisfaction,
            poorCustomerSatisfaction,
            highRecommendationScore,
            mediumRecommendationScore
        ] = await Promise.all(configPromises);

        return {
            minTotalSpending,
            minCategoryPercentage,
            minCategoryAmount,
            maxCategoriesToAnalyze,
            largeTransactionThreshold,
            highSpendingThreshold,
            multipleCategoriesThreshold,
            quickBreakevenMonths,
            highAnnualFee,
            highIncome,
            excellentCreditScore,
            goodCustomerSatisfaction,
            poorCustomerSatisfaction,
            highRecommendationScore,
            mediumRecommendationScore
        };
    }

    private async loadWeightConfig(): Promise<WeightConfig> {
        const [firstYearValue, categoryAlignment, feeEfficiency, brandPreference, accessibility] = await Promise.all([
            this.getNumericConfig(CONFIG_KEYS.FIRST_YEAR_VALUE_WEIGHT),
            this.getNumericConfig(CONFIG_KEYS.CATEGORY_ALIGNMENT_WEIGHT),
            this.getNumericConfig(CONFIG_KEYS.FEE_EFFICIENCY_WEIGHT),
            this.getNumericConfig(CONFIG_KEYS.BRAND_PREFERENCE_WEIGHT),
            this.getNumericConfig(CONFIG_KEYS.ACCESSIBILITY_WEIGHT)
        ]);

        return {
            firstYearValue,
            categoryAlignment,
            feeEfficiency,
            brandPreference,
            accessibility
        };
    }

    private async loadBonusFactorConfig(): Promise<BonusFactorConfig> {
        const configPromises = [
            this.getNumericConfig(CONFIG_KEYS.BONUS_LIFETIME_FREE),
            this.getNumericConfig(CONFIG_KEYS.BONUS_PREFERRED_NETWORK),
            this.getNumericConfig(CONFIG_KEYS.BONUS_PREFERRED_ISSUER),
            this.getNumericConfig(CONFIG_KEYS.BONUS_POPULAR_ISSUER),
            this.getNumericConfig(CONFIG_KEYS.BONUS_HIGH_RECOMMENDATION_SCORE),
            this.getNumericConfig(CONFIG_KEYS.BONUS_MEDIUM_RECOMMENDATION_SCORE),
            this.getNumericConfig(CONFIG_KEYS.BONUS_HIGH_CUSTOMER_SATISFACTION),
            this.getNumericConfig(CONFIG_KEYS.BONUS_DIGITAL_FEATURES_MAX)
        ];

        const [
            lifetimeFree,
            preferredNetwork,
            preferredIssuer,
            popularIssuer,
            highRecommendationScore,
            mediumRecommendationScore,
            highCustomerSatisfaction,
            digitalFeaturesMax
        ] = await Promise.all(configPromises);

        return {
            lifetimeFree,
            preferredNetwork,
            preferredIssuer,
            popularIssuer,
            highRecommendationScore,
            mediumRecommendationScore,
            highCustomerSatisfaction,
            digitalFeaturesMax
        };
    }

    private async loadPenaltyFactorConfig(): Promise<PenaltyFactorConfig> {
        const [inactiveCard, highFeeLowBenefit, poorCustomerSatisfaction, limitedAcceptance] = await Promise.all([
            this.getNumericConfig(CONFIG_KEYS.PENALTY_INACTIVE_CARD),
            this.getNumericConfig(CONFIG_KEYS.PENALTY_HIGH_FEE_LOW_BENEFIT),
            this.getNumericConfig(CONFIG_KEYS.PENALTY_POOR_CUSTOMER_SATISFACTION),
            this.getNumericConfig(CONFIG_KEYS.PENALTY_LIMITED_ACCEPTANCE)
        ]);

        return {
            inactiveCard,
            highFeeLowBenefit,
            poorCustomerSatisfaction,
            limitedAcceptance
        };
    }

    private getDefaultConfig(): RecommendationConfig {
        return {
            scoring: {
                minScoreThreshold: 10,
                maxRecommendations: 5,
                fallbackRecommendations: 3,
                baseScore: 30
            },
            thresholds: {
                minTotalSpending: 100,
                minCategoryPercentage: 1.0,
                minCategoryAmount: 50,
                maxCategoriesToAnalyze: 10,
                largeTransactionThreshold: 50000,
                highSpendingThreshold: 10000,
                multipleCategoriesThreshold: 3,
                quickBreakevenMonths: 12,
                highAnnualFee: 2000,
                highIncome: 1000000,
                excellentCreditScore: 750,
                goodCustomerSatisfaction: 4.5,
                poorCustomerSatisfaction: 3.5,
                highRecommendationScore: 85,
                mediumRecommendationScore: 75
            },
            weights: {
                firstYearValue: 0.4,
                categoryAlignment: 0.25,
                feeEfficiency: 0.2,
                brandPreference: 0.1,
                accessibility: 0.05
            },
            pointValues: {
                [RewardCurrency.REWARD_POINTS]: 0.25,
                [RewardCurrency.EDGE_REWARD_POINTS]: 0.20,
                [RewardCurrency.CASHBACK]: 1.0,
                [RewardCurrency.NEU_COINS]: 1.0,
                [RewardCurrency.CASH_POINTS]: 1.0,
                [RewardCurrency.AMAZON_PAY_BALANCE]: 1.0,
                [RewardCurrency.STATEMENT_CREDIT]: 1.0,
                [RewardCurrency.MILES]: 0.5,
                default: 0.25
            },
            bonusFactors: {
                lifetimeFree: 15,
                preferredNetwork: 30,
                preferredIssuer: 20,
                popularIssuer: 10,
                highRecommendationScore: 10,
                mediumRecommendationScore: 5,
                highCustomerSatisfaction: 5,
                digitalFeaturesMax: 5
            },
            penaltyFactors: {
                inactiveCard: 50,
                highFeeLowBenefit: 20,
                poorCustomerSatisfaction: 10,
                limitedAcceptance: 5
            }
        };
    }

    private isCacheValid(): boolean {
        if (!this.cachedConfig) return false;

        const now = new Date();
        const cacheAge = now.getTime() - this.cachedConfig.lastUpdated.getTime();
        return cacheAge < this.CACHE_TTL_MS;
    }

    private getPointValueConfigKey(currency: string): string {
        switch (currency) {
            case RewardCurrency.REWARD_POINTS:
                return CONFIG_KEYS.POINT_VALUE_REWARD_POINTS;
            case RewardCurrency.EDGE_REWARD_POINTS:
                return CONFIG_KEYS.POINT_VALUE_EDGE_REWARD_POINTS;
            case RewardCurrency.CASHBACK:
                return CONFIG_KEYS.POINT_VALUE_CASHBACK;
            case RewardCurrency.NEU_COINS:
                return CONFIG_KEYS.POINT_VALUE_NEU_COINS;
            case RewardCurrency.CASH_POINTS:
                return CONFIG_KEYS.POINT_VALUE_CASH_POINTS;
            case RewardCurrency.AMAZON_PAY_BALANCE:
                return CONFIG_KEYS.POINT_VALUE_AMAZON_PAY_BALANCE;
            case RewardCurrency.STATEMENT_CREDIT:
                return CONFIG_KEYS.POINT_VALUE_STATEMENT_CREDIT;
            case RewardCurrency.MILES:
                return CONFIG_KEYS.POINT_VALUE_MILES;
            default:
                return CONFIG_KEYS.POINT_VALUE_DEFAULT;
        }
    }

    private getConfigDescription(key: string): string {
        const descriptions: Record<string, string> = {
            [CONFIG_KEYS.MIN_SCORE_THRESHOLD]: 'Minimum score threshold for recommendations',
            [CONFIG_KEYS.MAX_RECOMMENDATIONS]: 'Maximum number of recommendations to return',
            [CONFIG_KEYS.FALLBACK_RECOMMENDATIONS]: 'Number of fallback recommendations when no good matches',
            [CONFIG_KEYS.MIN_TOTAL_SPENDING]: 'Minimum total spending to analyze (INR)',
            [CONFIG_KEYS.MIN_CATEGORY_PERCENTAGE]: 'Minimum category percentage to include',
            [CONFIG_KEYS.MIN_CATEGORY_AMOUNT]: 'Minimum category amount to include (INR)',
            [CONFIG_KEYS.MAX_CATEGORIES_TO_ANALYZE]: 'Maximum categories to analyze',
            [CONFIG_KEYS.LARGE_TRANSACTION_THRESHOLD]: 'Threshold for large transaction detection (INR)',
            [CONFIG_KEYS.POINT_VALUE_REWARD_POINTS]: 'Value of HDFC Reward Points in INR',
            [CONFIG_KEYS.POINT_VALUE_EDGE_REWARD_POINTS]: 'Value of Axis EDGE Reward Points in INR',
            [CONFIG_KEYS.POINT_VALUE_CASHBACK]: 'Value of cashback in INR (1:1)',
            [CONFIG_KEYS.POINT_VALUE_NEU_COINS]: 'Value of Tata Neu Coins in INR',
            [CONFIG_KEYS.POINT_VALUE_CASH_POINTS]: 'Value of HDFC CashPoints in INR',
            [CONFIG_KEYS.POINT_VALUE_AMAZON_PAY_BALANCE]: 'Value of Amazon Pay Balance in INR',
            [CONFIG_KEYS.POINT_VALUE_STATEMENT_CREDIT]: 'Value of statement credit in INR',
            [CONFIG_KEYS.POINT_VALUE_MILES]: 'Value of airline miles in INR',
            [CONFIG_KEYS.POINT_VALUE_DEFAULT]: 'Default point value in INR'
        };

        return descriptions[key] || 'Configuration value';
    }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
