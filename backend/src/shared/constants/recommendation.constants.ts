/**
 * Recommendation System Constants and Enums
 * Database-driven configuration for the credit card recommendation engine
 */

// ==================== ENUMS ====================

export enum CreditScore {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor'
}

export enum CardNetwork {
    VISA = 'visa',
    MASTERCARD = 'mastercard',
    AMEX = 'amex',
    RUPAY = 'rupay',
    DINERS = 'diners'
}

export enum CardIssuer {
    HDFC = 'hdfc',
    ICICI = 'icici',
    AXIS = 'axis',
    SBI = 'sbi',
    AMEX = 'amex'
}

export enum RewardCurrency {
    REWARD_POINTS = 'reward_points',
    EDGE_REWARD_POINTS = 'edge_reward_points',
    CASHBACK = 'cashback',
    NEU_COINS = 'neu_coins',
    CASH_POINTS = 'cash_points',
    AMAZON_PAY_BALANCE = 'amazon_pay_balance',
    STATEMENT_CREDIT = 'statement_credit',
    MILES = 'miles'
}

export enum RecommendationConfidence {
    VERY_HIGH = 0.9,
    HIGH = 0.8,
    MEDIUM = 0.7,
    LOW = 0.6,
    VERY_LOW = 0.5
}

export enum SessionStatus {
    UPLOADING = 'uploading',
    EXTRACTING = 'extracting',
    CATEGORIZING = 'categorizing',
    MCC_DISCOVERY = 'mcc_discovery',
    ANALYZING = 'analyzing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export enum TransactionType {
    DEBIT = 'debit',
    CREDIT = 'credit',
    PAYMENT = 'payment'
}

export enum MCCStatus {
    PENDING = 'pending',
    FOUND_FUZZY = 'found_fuzzy',
    FOUND_AI = 'found_ai',
    NOT_FOUND = 'not_found',
    MANUAL_OVERRIDE = 'manual_override'
}

export enum CappingPeriod {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly'
}

// ==================== CONFIGURATION KEYS ====================

export const CONFIG_KEYS = {
    // Scoring thresholds
    MIN_SCORE_THRESHOLD: 'recommendation_min_score_threshold',
    MAX_RECOMMENDATIONS: 'recommendation_max_count',
    FALLBACK_RECOMMENDATIONS: 'recommendation_fallback_count',

    // Spending analysis
    MIN_TOTAL_SPENDING: 'analysis_min_total_spending',
    MIN_CATEGORY_PERCENTAGE: 'analysis_min_category_percentage',
    MIN_CATEGORY_AMOUNT: 'analysis_min_category_amount',
    MAX_CATEGORIES_TO_ANALYZE: 'analysis_max_categories',
    LARGE_TRANSACTION_THRESHOLD: 'analysis_large_transaction_threshold',

    // Confidence factors
    BASE_CONFIDENCE: 'confidence_base_score',
    HIGH_SPENDING_THRESHOLD: 'confidence_high_spending_threshold',
    MULTIPLE_CATEGORIES_THRESHOLD: 'confidence_multiple_categories_threshold',
    QUICK_BREAKEVEN_MONTHS: 'confidence_quick_breakeven_months',

    // Scoring weights
    FIRST_YEAR_VALUE_WEIGHT: 'scoring_first_year_value_weight',
    CATEGORY_ALIGNMENT_WEIGHT: 'scoring_category_alignment_weight',
    FEE_EFFICIENCY_WEIGHT: 'scoring_fee_efficiency_weight',
    BRAND_PREFERENCE_WEIGHT: 'scoring_brand_preference_weight',
    ACCESSIBILITY_WEIGHT: 'scoring_accessibility_weight',

    // Point values
    POINT_VALUE_REWARD_POINTS: 'point_value_reward_points',
    POINT_VALUE_EDGE_REWARD_POINTS: 'point_value_edge_reward_points',
    POINT_VALUE_CASHBACK: 'point_value_cashback',
    POINT_VALUE_NEU_COINS: 'point_value_neu_coins',
    POINT_VALUE_CASH_POINTS: 'point_value_cash_points',
    POINT_VALUE_AMAZON_PAY_BALANCE: 'point_value_amazon_pay_balance',
    POINT_VALUE_STATEMENT_CREDIT: 'point_value_statement_credit',
    POINT_VALUE_MILES: 'point_value_miles',
    POINT_VALUE_DEFAULT: 'point_value_default',

    // Bonus factors
    BONUS_LIFETIME_FREE: 'bonus_lifetime_free',
    BONUS_PREFERRED_NETWORK: 'bonus_preferred_network',
    BONUS_PREFERRED_ISSUER: 'bonus_preferred_issuer',
    BONUS_POPULAR_ISSUER: 'bonus_popular_issuer',
    BONUS_HIGH_RECOMMENDATION_SCORE: 'bonus_high_recommendation_score',
    BONUS_MEDIUM_RECOMMENDATION_SCORE: 'bonus_medium_recommendation_score',
    BONUS_HIGH_CUSTOMER_SATISFACTION: 'bonus_high_customer_satisfaction',
    BONUS_DIGITAL_FEATURES_MAX: 'bonus_digital_features_max',

    // Penalty factors
    PENALTY_INACTIVE_CARD: 'penalty_inactive_card',
    PENALTY_HIGH_FEE_LOW_BENEFIT: 'penalty_high_fee_low_benefit',
    PENALTY_POOR_CUSTOMER_SATISFACTION: 'penalty_poor_customer_satisfaction',
    PENALTY_LIMITED_ACCEPTANCE: 'penalty_limited_acceptance',

    // Thresholds
    THRESHOLD_HIGH_ANNUAL_FEE: 'threshold_high_annual_fee',
    THRESHOLD_HIGH_INCOME: 'threshold_high_income',
    THRESHOLD_EXCELLENT_CREDIT_SCORE: 'threshold_excellent_credit_score',
    THRESHOLD_GOOD_CUSTOMER_SATISFACTION: 'threshold_good_customer_satisfaction',
    THRESHOLD_POOR_CUSTOMER_SATISFACTION: 'threshold_poor_customer_satisfaction',
    THRESHOLD_HIGH_RECOMMENDATION_SCORE: 'threshold_high_recommendation_score',
    THRESHOLD_MEDIUM_RECOMMENDATION_SCORE: 'threshold_medium_recommendation_score',
} as const;

// ==================== DEFAULT VALUES ====================

export const DEFAULT_CONFIG_VALUES: Record<string, string> = {
    // Scoring thresholds
    [CONFIG_KEYS.MIN_SCORE_THRESHOLD]: '10',
    [CONFIG_KEYS.MAX_RECOMMENDATIONS]: '5',
    [CONFIG_KEYS.FALLBACK_RECOMMENDATIONS]: '3',

    // Spending analysis
    [CONFIG_KEYS.MIN_TOTAL_SPENDING]: '100',
    [CONFIG_KEYS.MIN_CATEGORY_PERCENTAGE]: '1.0',
    [CONFIG_KEYS.MIN_CATEGORY_AMOUNT]: '50',
    [CONFIG_KEYS.MAX_CATEGORIES_TO_ANALYZE]: '10',
    [CONFIG_KEYS.LARGE_TRANSACTION_THRESHOLD]: '50000',

    // Confidence factors
    [CONFIG_KEYS.BASE_CONFIDENCE]: '0.5',
    [CONFIG_KEYS.HIGH_SPENDING_THRESHOLD]: '10000',
    [CONFIG_KEYS.MULTIPLE_CATEGORIES_THRESHOLD]: '3',
    [CONFIG_KEYS.QUICK_BREAKEVEN_MONTHS]: '12',

    // Scoring weights
    [CONFIG_KEYS.FIRST_YEAR_VALUE_WEIGHT]: '0.4',
    [CONFIG_KEYS.CATEGORY_ALIGNMENT_WEIGHT]: '0.25',
    [CONFIG_KEYS.FEE_EFFICIENCY_WEIGHT]: '0.2',
    [CONFIG_KEYS.BRAND_PREFERENCE_WEIGHT]: '0.1',
    [CONFIG_KEYS.ACCESSIBILITY_WEIGHT]: '0.05',

    // Point values (in INR)
    [CONFIG_KEYS.POINT_VALUE_REWARD_POINTS]: '0.25',
    [CONFIG_KEYS.POINT_VALUE_EDGE_REWARD_POINTS]: '0.20',
    [CONFIG_KEYS.POINT_VALUE_CASHBACK]: '1.0',
    [CONFIG_KEYS.POINT_VALUE_NEU_COINS]: '1.0',
    [CONFIG_KEYS.POINT_VALUE_CASH_POINTS]: '1.0',
    [CONFIG_KEYS.POINT_VALUE_AMAZON_PAY_BALANCE]: '1.0',
    [CONFIG_KEYS.POINT_VALUE_STATEMENT_CREDIT]: '1.0',
    [CONFIG_KEYS.POINT_VALUE_MILES]: '0.5',
    [CONFIG_KEYS.POINT_VALUE_DEFAULT]: '0.25',

    // Bonus factors
    [CONFIG_KEYS.BONUS_LIFETIME_FREE]: '15',
    [CONFIG_KEYS.BONUS_PREFERRED_NETWORK]: '30',
    [CONFIG_KEYS.BONUS_PREFERRED_ISSUER]: '20',
    [CONFIG_KEYS.BONUS_POPULAR_ISSUER]: '10',
    [CONFIG_KEYS.BONUS_HIGH_RECOMMENDATION_SCORE]: '10',
    [CONFIG_KEYS.BONUS_MEDIUM_RECOMMENDATION_SCORE]: '5',
    [CONFIG_KEYS.BONUS_HIGH_CUSTOMER_SATISFACTION]: '5',
    [CONFIG_KEYS.BONUS_DIGITAL_FEATURES_MAX]: '5',

    // Penalty factors
    [CONFIG_KEYS.PENALTY_INACTIVE_CARD]: '50',
    [CONFIG_KEYS.PENALTY_HIGH_FEE_LOW_BENEFIT]: '20',
    [CONFIG_KEYS.PENALTY_POOR_CUSTOMER_SATISFACTION]: '10',
    [CONFIG_KEYS.PENALTY_LIMITED_ACCEPTANCE]: '5',

    // Thresholds
    [CONFIG_KEYS.THRESHOLD_HIGH_ANNUAL_FEE]: '2000',
    [CONFIG_KEYS.THRESHOLD_HIGH_INCOME]: '1000000',
    [CONFIG_KEYS.THRESHOLD_EXCELLENT_CREDIT_SCORE]: '750',
    [CONFIG_KEYS.THRESHOLD_GOOD_CUSTOMER_SATISFACTION]: '4.5',
    [CONFIG_KEYS.THRESHOLD_POOR_CUSTOMER_SATISFACTION]: '3.5',
    [CONFIG_KEYS.THRESHOLD_HIGH_RECOMMENDATION_SCORE]: '85',
    [CONFIG_KEYS.THRESHOLD_MEDIUM_RECOMMENDATION_SCORE]: '75',
};

// ==================== CREDIT SCORE MAPPINGS ====================

export const CREDIT_SCORE_VALUES: Record<CreditScore, number> = {
    [CreditScore.EXCELLENT]: 800,
    [CreditScore.GOOD]: 750,
    [CreditScore.FAIR]: 700,
    [CreditScore.POOR]: 650,
};

// ==================== REWARD RATE TIERS ====================

export const REWARD_RATE_TIERS = {
    OUTSTANDING: 10,
    EXCELLENT: 7.5,
    VERY_GOOD: 5,
    GOOD: 4,
    FAIR: 3,
    BASIC: 2,
} as const;

// ==================== FIRST YEAR VALUE TIERS ====================

export const FIRST_YEAR_VALUE_TIERS = {
    EXCELLENT: 5000,
    VERY_GOOD: 3000,
    GOOD: 1500,
    FAIR: 500,
    POOR: 0,
} as const;

// ==================== ROI TIERS ====================

export const ROI_TIERS = {
    EXCELLENT: 300, // 3x return
    VERY_GOOD: 200, // 2x return
    GOOD: 150,      // 1.5x return
    FAIR: 100,      // Break even
    POOR: 50,       // 50% return
} as const;

// ==================== DIGITAL FEATURE KEYWORDS ====================

export const DIGITAL_FEATURE_KEYWORDS = [
    'digital',
    'instant',
    'contactless',
    'mobile',
    'app',
    'online',
    'virtual',
    'tap',
    'nfc'
] as const;

// ==================== LIMITED ACCEPTANCE NETWORKS ====================

export const LIMITED_ACCEPTANCE_NETWORKS = [
    CardNetwork.AMEX,
    CardNetwork.DINERS
] as const;
