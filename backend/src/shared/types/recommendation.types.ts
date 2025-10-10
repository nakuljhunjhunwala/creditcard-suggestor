/**
 * Comprehensive Type Definitions for Recommendation System
 */

import { CreditScore, CardNetwork, CardIssuer, RewardCurrency } from '../constants/recommendation.constants';

// ==================== CORE INTERFACES ====================

export interface SpendingPattern {
    categoryName: string;
    subCategoryName?: string;
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    monthlyAverage: number;
    percentage: number;
    mccCodes: string[];
    merchants?: string[];
}

export interface RecommendationCriteria {
    totalSpending: number;
    monthlySpending: number;
    topCategories: SpendingPattern[];
    creditScore?: CreditScore;
    preferredNetwork?: CardNetwork;
    maxAnnualFee?: number;
    prioritizeSignupBonus?: boolean;
    includeBusinessCards?: boolean;
    preferredIssuer?: CardIssuer;
    minIncome?: number;
}

export interface CardRecommendation {
    cardId: string;
    rank: number;
    score: number;

    // Simplified earnings - what the user really cares about (statement period only)
    estimatedAnnualCashback: number;  // Statement period earnings (not annualized)
    signupBonusValue?: number;        // Welcome bonus value
    cardType?: string;                // Card type: Entry-Level, Cashback, Travel & Fuel, Lifestyle, Premium, Super Premium

    // Contextual information
    primaryReason: string;
    pros: string[];
    cons: string[];
    benefitBreakdown: BenefitBreakdown[];
    confidenceScore: number;

    // Legacy fields (backwards compatibility - keep for now but hidden from main response)
    statementSavings?: number;
    statementEarnings?: number;
    annualSavings?: number;
    annualEarnings?: number;
    potentialSavings?: number;
    currentEarnings?: number;
    yearlyEstimate?: number;
    feeBreakeven?: number;
    scoreBreakdown?: ScoreBreakdown;
}

export interface BenefitBreakdown {
    category: string;
    currentRate: number;
    cardRate: number;
    spentAmount: number;
    earnedPoints: number;
    dollarValue: number;
    savingsAmount?: number;
    monthlyCap?: number; // Monthly capping limit for rewards
}

export interface RecommendationResult {
    sessionId: string;
    recommendations: CardRecommendation[];
    criteria: RecommendationCriteria;
    totalCards: number;
    processingTimeMs: number;
    generatedAt: Date;
    summary: RecommendationSummary;
    analysis?: SpendingAnalysis;
}

export interface RecommendationSummary {
    topRecommendation: string;
    potentialSavings: number;
    averageScore: number;
    categoriesAnalyzed: number;
    confidenceLevel: string;
}

export interface RecommendationStats {
    totalRecommendations: number;
    averageProcessingTime: number;
    popularRecommendations: PopularRecommendation[];
    topCategories: CategoryFrequency[];
}

export interface PopularRecommendation {
    cardName: string;
    recommendationCount: number;
    averageScore: number;
}

export interface CategoryFrequency {
    category: string;
    frequency: number;
}

// ==================== ENHANCED TYPES ====================

export interface EnhancedCreditCard {
    id: string;
    name: string;
    slug: string;
    issuer: CardIssuerInfo;
    network: CardNetworkInfo;
    category: CardCategoryInfo;
    subCategory?: CardSubCategoryInfo;
    feeStructure: FeeStructure;
    eligibilityRequirements: EligibilityRequirements;
    rewardStructure: RewardStructure;
    additionalBenefits: AdditionalBenefit[];
    acceleratedRewards: AcceleratedRewardInfo[];
    uniqueFeatures: string[];
    isActive: boolean;
    isLifetimeFree: boolean;
    popularityScore: number;
    customerSatisfactionScore: number;
    recommendationScore: number;
}

export interface CardIssuerInfo {
    id: string;
    name: string;
    slug: string;
    color?: string;
    marketShare?: number;
    isActive: boolean;
}

export interface CardNetworkInfo {
    id: string;
    name: string;
    slug: string;
    color?: string;
    isActive: boolean;
}

export interface CardCategoryInfo {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconName?: string;
    color?: string;
}

export interface CardSubCategoryInfo {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

export interface FeeStructure {
    annualFee: number;
    joiningFee?: number;
    renewalFee?: number;
    foreignTransactionFee?: number;
    cashAdvanceFee?: number;
    overlimitFee?: number;
    lateFee?: number;
}

export interface EligibilityRequirements {
    minimumAge: number;
    maximumAge?: number;
    minimumIncome: {
        salaried: number;
        selfEmployed: number;
    };
    minimumCreditScore: number;
    employmentType: string[];
    documents: string[];
}

export interface RewardStructure {
    rewardType: string;
    rewardCurrency: RewardCurrency;
    baseRewardRate: number;
    pointsExpiry?: number;
    redemptionOptions: string[];
}

export interface AdditionalBenefit {
    categoryId: string;
    categoryName: string;
    benefits: BenefitDetail[];
}

export interface BenefitDetail {
    benefitType: string;
    benefitValue: string;
    description: string;
    conditions?: string[];
}

export interface AcceleratedRewardInfo {
    id: string;
    rewardCategory?: RewardCategoryInfo;
    merchantPatterns: string[];
    rewardRate: number;
    conditions: string[];
    cappingLimit?: number;
    cappingPeriod?: string;
    description: string;
}

export interface RewardCategoryInfo {
    id: string;
    name: string;
    slug: string;
    description?: string;
    mccCodes: string[];
}

// ==================== ANALYSIS TYPES ====================

export interface SpendingAnalysis {
    totalSpending: number;
    totalTransactions: number;
    averageTransactionAmount: number;
    spendingDistribution: CategoryAnalysis[];
    topMerchants: MerchantAnalysis[];
    monthlyTrends?: MonthlyTrend[];
}

export interface CategoryAnalysis {
    categoryName: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
    averageAmount: number;
    mccCodes: string[];
    topMerchants: string[];
}

export interface MerchantAnalysis {
    merchantName: string;
    totalAmount: number;
    transactionCount: number;
    category: string;
    mccCode?: string;
}

export interface MonthlyTrend {
    month: string;
    totalSpending: number;
    transactionCount: number;
    topCategory: string;
}

// ==================== SCORING TYPES ====================

export interface ScoreBreakdown {
    totalScore: number;
    firstYearValueScore: number;
    categoryAlignmentScore: number;
    feeEfficiencyScore: number;
    brandPreferenceScore: number;
    accessibilityScore: number;
    bonusFactors: number;
    penaltyFactors: number;
    confidenceFactors: ConfidenceFactors;
}

export interface ConfidenceFactors {
    dataQuality: number;
    cardDataCompleteness: number;
    savingsReliability: number;
    categoryMatchAccuracy: number;
    overallConfidence: number;
}

// ==================== CONFIGURATION TYPES ====================

export interface RecommendationConfig {
    scoring: ScoringConfig;
    thresholds: ThresholdConfig;
    weights: WeightConfig;
    pointValues: PointValueConfig;
    bonusFactors: BonusFactorConfig;
    penaltyFactors: PenaltyFactorConfig;
}

export interface ScoringConfig {
    minScoreThreshold: number;
    maxRecommendations: number;
    fallbackRecommendations: number;
    baseScore: number;
}

export interface ThresholdConfig {
    minTotalSpending: number;
    minCategoryPercentage: number;
    minCategoryAmount: number;
    maxCategoriesToAnalyze: number;
    largeTransactionThreshold: number;
    highSpendingThreshold: number;
    multipleCategoriesThreshold: number;
    quickBreakevenMonths: number;
    highAnnualFee: number;
    highIncome: number;
    excellentCreditScore: number;
    goodCustomerSatisfaction: number;
    poorCustomerSatisfaction: number;
    highRecommendationScore: number;
    mediumRecommendationScore: number;
}

export interface WeightConfig {
    firstYearValue: number;
    categoryAlignment: number;
    feeEfficiency: number;
    brandPreference: number;
    accessibility: number;
}

export interface PointValueConfig {
    [RewardCurrency.REWARD_POINTS]: number;
    [RewardCurrency.EDGE_REWARD_POINTS]: number;
    [RewardCurrency.CASHBACK]: number;
    [RewardCurrency.NEU_COINS]: number;
    [RewardCurrency.CASH_POINTS]: number;
    [RewardCurrency.AMAZON_PAY_BALANCE]: number;
    [RewardCurrency.STATEMENT_CREDIT]: number;
    [RewardCurrency.MILES]: number;
    default: number;
}

export interface BonusFactorConfig {
    lifetimeFree: number;
    preferredNetwork: number;
    preferredIssuer: number;
    popularIssuer: number;
    highRecommendationScore: number;
    mediumRecommendationScore: number;
    highCustomerSatisfaction: number;
    digitalFeaturesMax: number;
}

export interface PenaltyFactorConfig {
    inactiveCard: number;
    highFeeLowBenefit: number;
    poorCustomerSatisfaction: number;
    limitedAcceptance: number;
}

// ==================== VALIDATION TYPES ====================

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}

// ==================== OPTIONS TYPES ====================

export interface RecommendationOptions {
    creditScore?: CreditScore;
    maxAnnualFee?: number;
    preferredNetwork?: CardNetwork;
    includeBusinessCards?: boolean;
    preferredIssuer?: CardIssuer;
    minIncome?: number;
    prioritizeSignupBonus?: boolean;
    includeInactiveCards?: boolean;
    customWeights?: Partial<WeightConfig>;
}

// ==================== DATABASE QUERY TYPES ====================

export interface CardQueryFilters {
    isActive?: boolean;
    maxAnnualFee?: number;
    networkSlug?: string;
    issuerSlug?: string;
    minIncome?: number;
    maxCreditScore?: number;
    includeBusinessCards?: boolean;
}

export interface SpendingPatternQuery {
    sessionId: string;
    minAmount?: number;
    minPercentage?: number;
    maxCategories?: number;
}

// ==================== CACHE TYPES ====================

export interface CachedRecommendation {
    sessionId: string;
    recommendations: CardRecommendation[];
    criteria: RecommendationCriteria;
    generatedAt: Date;
    expiresAt: Date;
}

export interface CachedConfig {
    config: RecommendationConfig;
    lastUpdated: Date;
    version: string;
}
