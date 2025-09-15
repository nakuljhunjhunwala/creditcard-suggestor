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

// Recommendation Types
export interface CreditCardRecommendation {
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
    benefitBreakdown: any[];
    confidenceScore: number;
    card?: CreditCard; // Card details from API
}

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
