// API Response Types
export interface ApiResponse<T = any> {
    status: string;
    message: string;
    data?: T;
}

// Session Types
export interface Session {
    sessionToken: string;
    status: 'uploading' | 'extracting' | 'categorizing' | 'mcc_discovery' | 'analyzing' | 'completed' | 'failed';
    progress: number;
    totalSpend?: number;
    topCategory?: string;
    totalTransactions?: number;
    categorizedCount?: number;
    unknownMccCount?: number;
    newMccDiscovered?: number;
    expiresAt: string;
    errorMessage?: string;
}

// Job Status Types
export interface JobStatus {
    sessionToken: string;
    sessionStatus: string;
    sessionProgress: number;
    activeJob?: {
        id: string;
        type: string;
        status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
        progress: number;
        currentStep?: string;
        errorMessage?: string;
        queuedAt?: string;
        startedAt?: string;
        completedAt?: string;
    };
    allJobs?: Array<{
        id: string;
        type: string;
        status: string;
        progress: number;
        queuedAt?: string;
        completedAt?: string;
    }>;
}

// Transaction Types
export interface Transaction {
    id: string;
    date: string;
    description: string;
    merchant?: string;
    amount: number;
    mccCode?: string;
    categoryName?: string;
    subCategoryName?: string;
    mccStatus: string;
    confidence?: number;
    needsReview?: boolean;
}

// Pagination Types
export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Enhanced Recommendation Types
export interface CreditCardRecommendation {
    cardId: string;
    rank: number;
    score: number;

    // Statement period (uploaded data timeframe)
    statementSavings: number;
    statementEarnings: number;

    // Annual projected (extrapolated to 12 months)
    annualSavings: number;
    annualEarnings: number;

    // Legacy fields (backwards compatibility)
    potentialSavings: number;  // Same as annualSavings
    currentEarnings: number;
    yearlyEstimate: number;    // Same as annualEarnings

    signupBonusValue?: number;
    feeBreakeven?: number;
    primaryReason: string;
    pros: string[];
    cons: string[];
    benefitBreakdown: BenefitBreakdown[];
    confidenceScore: number;
    scoreBreakdown?: ScoreBreakdown;
    card: EnhancedCreditCard;
}

export interface BenefitBreakdown {
    category: string;
    currentRate: number;
    cardRate: number;
    spentAmount: number;
    earnedPoints: number;
    dollarValue: number;
    savingsAmount?: number;
}

export interface ScoreBreakdown {
    totalScore: number;
    firstYearValueScore: number;
    categoryAlignmentScore: number;
    feeEfficiencyScore: number;
    brandPreferenceScore: number;
    accessibilityScore: number;
    bonusFactors: number;
    penaltyFactors: number;
}

export interface EnhancedCreditCard {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconName?: string;
    color?: string;
    isActive: boolean;
    isLifetimeFree: boolean;
    launchDate?: string;
    issuer: CardIssuer;
    network: CardNetwork;
    category: CardCategory;
    subCategory?: CardSubCategory;
    feeStructure: FeeStructure;
    eligibilityRequirements: EligibilityRequirements;
    rewardStructure: RewardStructure;
    additionalBenefits: AdditionalBenefit[];
    uniqueFeatures: string[];
    popularityScore: number;
    customerSatisfactionScore: number;
    recommendationScore: number;
    acceleratedRewards: AcceleratedReward[];
}

export interface CardIssuer {
    id: string;
    name: string;
    slug: string;
    color?: string;
    marketShare?: number;
}

export interface CardNetwork {
    id: string;
    name: string;
    slug: string;
    color?: string;
}

export interface CardCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconName?: string;
    color?: string;
}

export interface CardSubCategory {
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
    rewardCurrency: string;
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

export interface AcceleratedReward {
    id: string;
    rewardCategory?: RewardCategory;
    merchantPatterns: string[];
    rewardRate: number;
    conditions: string[];
    cappingLimit?: number;
    cappingPeriod?: string;
    description: string;
}

export interface RewardCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    mccCodes: string[];
}

export interface RecommendationCriteria {
    totalSpending: number;
    monthlySpending: number;
    topCategories: SpendingPattern[];
    creditScore?: string;
    preferredNetwork?: string;
    maxAnnualFee?: number;
    prioritizeSignupBonus?: boolean;
    includeBusinessCards?: boolean;
    preferredIssuer?: string;
    minIncome?: number;
}

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

export interface RecommendationSummary {
    topRecommendation: string;
    potentialSavings: number;
    averageScore: number;
    categoriesAnalyzed: number;
    confidenceLevel: string;
}

export interface RecommendationResponse {
    sessionToken: string;
    recommendations: CreditCardRecommendation[];
    criteria: RecommendationCriteria;
    summary: RecommendationSummary;
    analysis?: DetailedSpendingAnalysis;
    totalCards: number;
    processingTimeMs: number;
    generatedAt: string;
    sessionSummary: {
        totalSpend: number;
        topCategory: string;
        totalTransactions: number;
    };
    fallback?: boolean;
}

export interface DetailedSpendingAnalysis {
    totalSpending: number;
    totalTransactions: number;
    averageTransactionAmount: number;
    spendingDistribution: CategoryAnalysisDetail[];
    topMerchants: MerchantAnalysis[];
}

export interface CategoryAnalysisDetail {
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

// Legacy CreditCard interface for backward compatibility
export interface CreditCard {
    id: string;
    name: string;
    issuer: string;
    network: string;
    annualFee: number;
    signupBonus?: number;
    tier: string;
    creditRequirement?: string;
    description?: string;
    applyUrl?: string;
}

// Analysis Types
export interface CategoryBreakdown {
    category: string;
    subCategory?: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
    confidence: number;
}

export interface SpendingAnalysis {
    sessionSummary?: {
        totalSpend: string;
        totalTransactions: number;
        categorizedCount: number;
        unknownMccCount: number;
        newMccDiscovered?: number;
        topCategory: string;
    };
    categoryAnalysis?: Array<{
        category: string;
        amount: string;
        transactionCount: number;
        percentage: number;
    }>;
    monthlySpending?: Array<{
        month: string;
        amount: number;
        transactionCount: number;
    }>;
    mccDiscoveryStats?: Array<{
        status: string;
        count: number;
    }>;
    // Legacy fields for backward compatibility
    categoryBreakdown?: CategoryBreakdown[];
    confidenceDistribution?: {
        high: number;
        medium: number;
        low: number;
        needsReview: number;
    };
    topMerchants?: Array<{
        merchant: string;
        count: number;
        totalAmount: number;
        category: string;
    }>;
    uncategorized?: number;
}

// Upload Types
export interface FileValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
}

export interface UploadResponse {
    sessionToken: string;
    status: string;
    progress: number;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    jobId: string;
    validation: FileValidationResult;
}

// Error Types
export interface ApiError {
    message: string;
    status: number;
    code?: string;
}
