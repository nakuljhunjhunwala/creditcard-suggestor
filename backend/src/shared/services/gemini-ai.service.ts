import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/shared/config/env.config';
import { logger } from '@/shared/utils/logger.util';
import { categoryMappingService } from './category-mapping.service';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';

/**
 * Gemini AI Service
 * Handles integration with Google's Gemini AI models for transaction extraction and MCC discovery
 */

export interface Transaction {
  date: string; // ISO date string
  description: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit' | 'payment' | 'fee' | 'interest' | 'other';
  confidence: number; // 0-1 confidence score
}

export interface TransactionExtractionResult {
  transactions: Transaction[];
  totalFound: number;
  confidence: number;
  processingNotes?: string;
  warnings?: string[];
  rawExtractedData?: any;
}

export interface MCCDiscoveryResult {
  merchantName: string;
  mccCode: string;
  mccDescription: string;
  confidence: number;
  reasoning: string;
  category: string;
  subCategory?: string;
  additionalInfo?: {
    businessType: string;
    commonMccCodes: string[];
    recommendedMcc: string;
  };
}

export interface MCCDiscoveryBatchResult {
  results: MCCDiscoveryResult[];
  successful: number;
  failed: number;
  totalProcessed: number;
  errors?: string[];
}

export class GeminiAIService {
  private cheapModel: GenerativeModel;
  private premiumModel: GenerativeModel;
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is required for AI service initialization',
      );
    }

    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.cheapModel = this.genAI.getGenerativeModel({
      model: env.GEMINI_MODEL_CHEAP,
    });
    this.premiumModel = this.genAI.getGenerativeModel({
      model: env.GEMINI_MODEL_PREMIUM,
    });

    logger.info('Gemini AI Service initialized', {
      cheapModel: env.GEMINI_MODEL_CHEAP,
      premiumModel: env.GEMINI_MODEL_PREMIUM,
    });
  }

  /**
   * Extract transactions from PDF text using cheap model
   */
  async extractTransactions(
    pdfText: string,
    contextInfo?: {
      fileName?: string;
      fileSize?: number;
      issuer?: string;
      expectedTransactionCount?: number;
    },
  ): Promise<TransactionExtractionResult> {
    try {
      logger.info('Starting transaction extraction with Gemini AI', {
        textLength: pdfText.length,
        fileName: contextInfo?.fileName,
        expectedTransactions: contextInfo?.expectedTransactionCount,
      });

      const prompt = this.buildTransactionExtractionPrompt(
        pdfText,
        contextInfo,
      );

      const result = await this.cheapModel.generateContent(prompt);
      const responseText = result.response.text();

      logger.debug('Raw Gemini response for transaction extraction', {
        responseLength: responseText.length,
        response: `${responseText.substring(0, 500)}...`,
      });

      const extractionResult =
        this.parseTransactionExtractionResponse(responseText);

      logger.info('Transaction extraction completed', {
        transactionsFound: extractionResult.totalFound,
        averageConfidence: extractionResult.confidence,
        warnings: extractionResult.warnings?.length || 0,
      });

      return extractionResult;
    } catch (error) {
      logger.error('Transaction extraction failed', error);
      throw this.handleGeminiError(error, 'transaction extraction');
    }
  }

  /**
   * Discover MCC codes for unknown merchants using premium model
   */
  async discoverMCCCodes(
    merchants: string[],
    context?: {
      existingMccCodes?: Record<string, string>;
      preferredCategories?: string[];
    },
  ): Promise<MCCDiscoveryBatchResult> {
    try {
      logger.info('Starting MCC discovery for merchants', {
        merchantCount: merchants.length,
        merchants: merchants.slice(0, 5), // Log first 5 for debugging
      });

      const batchResults: MCCDiscoveryResult[] = [];
      const errors: string[] = [];
      let successful = 0;
      let failed = 0;

      // Process merchants in smaller batches to avoid API limits
      const batchSize = 5;
      for (let i = 0; i < merchants.length; i += batchSize) {
        const batch = merchants.slice(i, i + batchSize);

        try {
          const batchResult = await this.processMCCBatch(batch, context);
          batchResults.push(...batchResult.results);
          successful += batchResult.successful;
          failed += batchResult.failed;

          if (batchResult.errors) {
            errors.push(...batchResult.errors);
          }

          // Add delay between batches to respect rate limits
          if (i + batchSize < merchants.length) {
            await this.delay(1000); // 1 second delay
          }
        } catch (error) {
          logger.error(
            `MCC discovery batch failed for batch starting at index ${i}`,
            error,
          );
          failed += batch.length;
          errors.push(
            `Batch ${i}-${i + batchSize} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      const result: MCCDiscoveryBatchResult = {
        results: batchResults,
        successful,
        failed,
        totalProcessed: merchants.length,
        errors: errors.length > 0 ? errors : undefined,
      };

      logger.info('MCC discovery completed', {
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
        errorCount: errors.length,
      });

      return result;
    } catch (error) {
      logger.error('MCC discovery failed', error);
      throw this.handleGeminiError(error, 'MCC discovery');
    }
  }

  /**
   * Validate extracted transaction data quality
   */
  validateTransactionData(transactions: Transaction[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (transactions.length === 0) {
      issues.push('No transactions found in the document');
      suggestions.push(
        'Verify the PDF contains transaction data and is not corrupted',
      );
      return { isValid: false, issues, suggestions };
    }

    // Check for common data quality issues
    let validDates = 0;
    let validAmounts = 0;
    let validMerchants = 0;
    let lowConfidenceCount = 0;

    for (const transaction of transactions) {
      // Date validation
      const date = new Date(transaction.date);
      if (!isNaN(date.getTime())) {
        validDates++;
      }

      // Amount validation
      if (typeof transaction.amount === 'number' && transaction.amount !== 0) {
        validAmounts++;
      }

      // Merchant validation
      if (transaction.merchant && transaction.merchant.trim().length > 2) {
        validMerchants++;
      }

      // Confidence check
      if (transaction.confidence < 0.7) {
        lowConfidenceCount++;
      }
    }

    const total = transactions.length;
    const validDatePercent = (validDates / total) * 100;
    const validAmountPercent = (validAmounts / total) * 100;
    const validMerchantPercent = (validMerchants / total) * 100;
    const lowConfidencePercent = (lowConfidenceCount / total) * 100;

    // Quality checks
    if (validDatePercent < 80) {
      issues.push(
        `${(100 - validDatePercent).toFixed(1)}% of transactions have invalid dates`,
      );
    }

    if (validAmountPercent < 90) {
      issues.push(
        `${(100 - validAmountPercent).toFixed(1)}% of transactions have invalid amounts`,
      );
    }

    if (validMerchantPercent < 85) {
      issues.push(
        `${(100 - validMerchantPercent).toFixed(1)}% of transactions have poor merchant names`,
      );
    }

    if (lowConfidencePercent > 30) {
      issues.push(
        `${lowConfidencePercent.toFixed(1)}% of transactions have low confidence scores`,
      );
      suggestions.push('Consider manual review of low-confidence transactions');
    }

    // Provide suggestions based on issues
    if (validDatePercent < 80) {
      suggestions.push(
        'Check if the PDF contains date information in an unexpected format',
      );
    }

    if (validAmountPercent < 90) {
      suggestions.push('Verify the PDF contains clear transaction amounts');
    }

    const isValid = issues.length === 0;

    return { isValid, issues, suggestions };
  }

  /**
   * Build transaction extraction prompt
   */
  private buildTransactionExtractionPrompt(
    pdfText: string,
    contextInfo?: {
      fileName?: string;
      issuer?: string;
      expectedTransactionCount?: number;
    },
  ): string {
    return `
You are an expert at extracting transaction data from credit card and bank statements. 
Analyze the following text extracted from a PDF and identify all transactions.

${contextInfo?.fileName ? `File: ${contextInfo.fileName}` : ''}
${contextInfo?.issuer ? `Issuer: ${contextInfo.issuer}` : ''}
${contextInfo?.expectedTransactionCount ? `Expected transactions: ~${contextInfo.expectedTransactionCount}` : ''}

For each transaction, extract:
- Date (in ISO format YYYY-MM-DD)
- Description (original transaction description)
- Merchant (clean merchant name without extra info)
- Amount (positive number for charges, negative for payments/credits)
- Type (debit, credit, payment, fee, interest, or other)
- Confidence (0.0-1.0 confidence score)

Return ONLY valid JSON in this exact format:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "AMAZON.COM PURCHASE",
      "merchant": "Amazon",
      "amount": 45.67,
      "type": "debit",
      "confidence": 0.95
    }
  ],
  "totalFound": 1,
  "confidence": 0.95,
  "processingNotes": "Successfully extracted transactions from statement",
  "warnings": []
}

Rules:
- Only include actual transactions (ignore account info, balances, summaries)
- Use standard date format (YYYY-MM-DD)
- Clean merchant names (remove location codes, extra spaces)
- Positive amounts for charges, negative for payments/credits
- Be conservative with confidence scores
- Include warnings for any data quality issues

PDF Text:
${pdfText}
    `.trim();
  }

  /**
   * Parse transaction extraction response
   */
  private parseTransactionExtractionResponse(
    responseText: string,
  ): TransactionExtractionResult {
    try {
      // Clean the response to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!Array.isArray(jsonResponse.transactions)) {
        throw new Error('Invalid transactions format');
      }

      // Validate and clean transactions
      const validTransactions: Transaction[] = jsonResponse.transactions
        .map((t: any) => this.validateAndCleanTransaction(t))
        .filter(Boolean);

      return {
        transactions: validTransactions,
        totalFound: validTransactions.length,
        confidence: jsonResponse.confidence || 0.8,
        processingNotes: jsonResponse.processingNotes,
        warnings: jsonResponse.warnings || [],
        rawExtractedData: jsonResponse,
      };
    } catch (error) {
      logger.error('Failed to parse transaction extraction response', {
        error,
        responseText: responseText.substring(0, 1000),
      });

      throw new ApiError(
        'Failed to parse AI response for transaction extraction',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Process MCC discovery batch
   */
  private async processMCCBatch(
    merchants: string[],
    context?: {
      existingMccCodes?: Record<string, string>;
      preferredCategories?: string[];
    },
  ): Promise<MCCDiscoveryBatchResult> {
    const prompt = await this.buildMCCDiscoveryPrompt(merchants, context);

    const result = await this.premiumModel.generateContent(prompt);
    const responseText = result.response.text();

    return this.parseMCCDiscoveryResponse(responseText, merchants);
  }

  /**
   * Build MCC discovery prompt
   */
  private async buildMCCDiscoveryPrompt(
    merchants: string[],
    context?: {
      existingMccCodes?: Record<string, string>;
      preferredCategories?: string[];
    },
  ): Promise<string> {
    // Get valid categories from database dynamically
    const { categories, subCategories } = await categoryMappingService.getValidCategories();

    // Create compact category format
    const categoryList = categories.map((cat, i) =>
      `${i + 1}."${cat.name}"`
    ).join(', ');

    // Group subcategories by category for compact display  
    const subCategoryGroups = categories.map(cat => {
      const subs = subCategories
        .filter(sub => sub.categoryId === cat.id)
        .map(sub => `"${sub.name}"`)
        .join(', ');
      return subs ? `${cat.name}: ${subs}` : null;
    }).filter(Boolean).join('\n- ');

    return `
MCC expert for Indian businesses. Use ONLY these categories: 
Research and determine the most appropriate MCC code for each merchant.

IMPORTANT: You MUST use ONLY the following predefined categories and subcategories:

VALID CATEGORIES:
1. "E-commerce & Online Shopping" - Flipkart, Amazon India, Myntra, JioMart
2. "Groceries & Quick Commerce" - Supermarkets, BigBasket, Blinkit, Swiggy Instamart
3. "Utilities & Digital Services" - Mobile recharges, DTH, electricity bills, internet
4. "Dining & Food Delivery" - Restaurants, Zomato, Swiggy, street food, cafes
5. "Fuel & Automotive" - Petrol pumps, diesel, car services, automotive maintenance
6. "Transportation" - Metro, buses, Ola, Uber, trains, local transportation
7. "Travel & Tourism" - Airlines, hotels, MakeMyTrip, Goibibo, railway bookings
8. "Entertainment & OTT" - Disney+ Hotstar, Netflix, BookMyShow, gaming
9. "Healthcare & Wellness" - Hospitals, Apollo, pharmacy, diagnostic centers
10. "Education & Coaching" - Schools, BYJU'S, Unacademy, competitive coaching
11. "Retail Shopping" - Reliance Retail, Tata stores, malls, clothing, electronics
12. "Financial Services" - Banking, insurance, mutual funds, loan EMIs
13. "Home & Lifestyle" - Home improvement, furniture, Urban Company, appliances
14. "Other" - Miscellaneous and uncategorized transactions

VALID SUBCATEGORIES (use only if applicable):
- E-commerce: "Online Marketplaces", "Fashion & Lifestyle", "Electronics & Gadgets"
- Groceries: "Quick Commerce", "Supermarkets & Hypermarkets", "Kirana & Local Stores", "Online Grocery"
- Utilities: "Mobile & DTH Recharge", "Electricity & Water Bills", "Digital Wallet Top-ups", "Internet & Broadband"
- Dining: "Food Delivery Apps", "Restaurants & Fine Dining", "Quick Service & Fast Food", "Cafes & Beverages", "Street Food & Local Vendors"
- Fuel: "Petrol Stations", "Automotive Services"
- Transportation: "Ride-hailing Services", "Public Transport", "Auto-rickshaw & Local Transport", "Parking & Tolls"
- Travel: "Flight Bookings", "Hotels & Accommodation", "Railway Bookings", "Travel Packages & Tours"
- Entertainment: "OTT & Streaming Platforms", "Movies & Events", "Gaming & Digital Content"
- Healthcare: "Hospitals & Medical Services", "Pharmacies & Medicines", "Diagnostic & Lab Tests"
- Education: "Online Coaching & EdTech", "Competitive Exam Prep", "Schools & Colleges"
- Shopping: "Retail Stores & Malls", "Clothing & Fashion", "Electronics & Appliances"
- Home: "Home Services", "Furniture & Home Decor"

Merchants to analyze:
${merchants.map((m, i) => `${i + 1}. ${m}`).join('\n')}

${context?.existingMccCodes
        ? `
Known MCC codes for reference:
${Object.entries(context.existingMccCodes)
          .map(([merchant, mcc]) => `${merchant}: ${mcc}`)
          .join('\n')}
`
        : ''
      }

For each merchant, provide:
- Most appropriate 4-digit MCC code
- MCC description
- Business category (MUST be exactly one from the list above)
- Subcategory (MUST be exactly one from the valid subcategories, or omit if none fit)
- Confidence level (0.0-1.0)
- Reasoning for the choice

Return ONLY valid JSON in this exact format:
{
  "results": [
    {
      "merchantName": "Amazon",
      "mccCode": "5399",
      "mccDescription": "Miscellaneous General Merchandise",
      "confidence": 0.95,
      "reasoning": "Amazon is primarily an online retailer selling various merchandise",
      "category": "E-commerce & Online Shopping",
      "subCategory": "Online Marketplaces",
      "additionalInfo": {
        "businessType": "E-commerce Retailer",
        "commonMccCodes": ["5399", "5968", "5999"],
        "recommendedMcc": "5399"
      }
    }
  ],
  "successful": 1,
  "failed": 0
}

CRITICAL: Use ONLY the exact category and subcategory names from the lists above. Do not create new categories.
Use official MCC codes and be as accurate as possible. Consider the merchant's primary business activity in India.
    `.trim();
  }

  /**
   * Parse MCC discovery response
   */
  private parseMCCDiscoveryResponse(
    responseText: string,
    originalMerchants: string[],
  ): MCCDiscoveryBatchResult {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in MCC discovery response');
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(jsonResponse.results)) {
        throw new Error('Invalid MCC results format');
      }

      return {
        results: jsonResponse.results,
        successful: jsonResponse.successful || jsonResponse.results.length,
        failed: jsonResponse.failed || 0,
        totalProcessed: originalMerchants.length,
        errors: jsonResponse.errors,
      };
    } catch (error) {
      logger.error('Failed to parse MCC discovery response', {
        error,
        responseText: responseText.substring(0, 1000),
      });

      throw new ApiError(
        'Failed to parse AI response for MCC discovery',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate and clean a single transaction
   */
  private validateAndCleanTransaction(t: any): Transaction | null {
    try {
      // Validate required fields
      if (!t.date || !t.merchant || typeof t.amount !== 'number') {
        return null;
      }

      // Validate date
      const date = new Date(t.date);
      if (isNaN(date.getTime())) {
        return null;
      }

      // Clean and validate merchant
      const merchant = String(t.merchant).trim();
      if (merchant.length < 2) {
        return null;
      }

      // Validate type
      const validTypes = [
        'debit',
        'credit',
        'payment',
        'fee',
        'interest',
        'other',
      ];
      const type = validTypes.includes(t.type) ? t.type : 'other';

      // Validate confidence
      let confidence = typeof t.confidence === 'number' ? t.confidence : 0.5;
      confidence = Math.max(0, Math.min(1, confidence));

      return {
        date: t.date,
        description: String(t.description || t.merchant).trim(),
        merchant,
        amount: Number(t.amount),
        type,
        confidence,
      };
    } catch (error) {
      logger.warn('Failed to validate transaction', { transaction: t, error });
      return null;
    }
  }

  /**
   * Handle Gemini API errors
   */
  private handleGeminiError(error: any, operation: string): ApiError {
    if (error?.message?.includes('API_KEY')) {
      return new ApiError(
        'AI service configuration error',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    if (error?.message?.includes('QUOTA_EXCEEDED')) {
      return new ApiError(
        'AI service quota exceeded',
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    if (error?.message?.includes('RATE_LIMIT')) {
      return new ApiError(
        'AI service rate limit exceeded',
        StatusCodes.TOO_MANY_REQUESTS,
      );
    }

    if (error?.message?.includes('INVALID_REQUEST')) {
      return new ApiError(
        'Invalid request to AI service',
        StatusCodes.BAD_REQUEST,
      );
    }

    logger.error(`Gemini AI error during ${operation}`, error);
    return new ApiError(
      `AI service error during ${operation}`,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();
