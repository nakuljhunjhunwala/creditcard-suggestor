import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { logger } from '@/shared/utils/logger.util';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';

/**
 * PDF Parser Service
 * Handles extraction of text content from PDF files using pdf-parse
 */

export interface ParsedPDFResult {
    text: string;
    pages: number;
    totalPages: number;
    metadata?: {
        title?: string;
        author?: string;
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
    };
    info: {
        fileSize: number;
        version?: string;
        encrypted?: boolean;
    };
}

export interface PDFParsingStats {
    totalCharacters: number;
    totalWords: number;
    totalLines: number;
    averageWordsPerLine: number;
    containsNumbers: boolean;
    containsDollarSigns: boolean;
    containsDates: boolean;
    likelyTransactionData: boolean;
}

export class PDFParserService {
    /**
     * Parse PDF file and extract text content
     */
    async parsePDF(filePath: string): Promise<ParsedPDFResult> {
        try {
            logger.info(`Starting PDF parsing for file: ${filePath}`);

            // Check if file exists
            await this.validateFile(filePath);

            // Read file buffer
            const fileBuffer = await fs.readFile(filePath);

            // Parse PDF using pdf-parse
            const pdfData = await pdfParse(fileBuffer, {
                // Options for better text extraction
                max: 0, // Parse all pages (0 = no limit)
                version: 'v1.10.100', // Specify pdf2pic version if needed
            });

            // Extract metadata and info
            const result: ParsedPDFResult = {
                text: pdfData.text,
                pages: pdfData.numpages,
                totalPages: pdfData.numpages,
                metadata: this.extractMetadata(pdfData.metadata),
                info: {
                    fileSize: fileBuffer.length,
                    version: pdfData.version,
                    encrypted: false, // pdf-parse handles encrypted PDFs transparently
                },
            };

            logger.info(`PDF parsed successfully`, {
                filePath,
                pages: result.pages,
                textLength: result.text.length,
                fileSize: result.info.fileSize,
            });

            return result;
        } catch (error) {
            logger.error(`PDF parsing failed for file: ${filePath}`, error);

            if (error instanceof Error) {
                if (error.message.includes('Invalid PDF')) {
                    throw new ApiError(
                        'Invalid PDF file format',
                        StatusCodes.BAD_REQUEST,
                    );
                }
                if (error.message.includes('Password')) {
                    throw new ApiError(
                        'PDF is password protected',
                        StatusCodes.BAD_REQUEST,
                    );
                }
                if (error.message.includes('Encrypted')) {
                    throw new ApiError(
                        'PDF is encrypted and cannot be processed',
                        StatusCodes.BAD_REQUEST,
                    );
                }
            }

            throw new ApiError(
                'Failed to parse PDF file',
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Analyze parsed PDF text to extract statistics and insights
     */
    analyzePDFContent(parsedResult: ParsedPDFResult): PDFParsingStats {
        const { text } = parsedResult;
        const lines = text.split('\n').filter((line) => line.trim().length > 0);

        // Basic text statistics
        const totalCharacters = text.length;
        const words = text.split(/\s+/).filter((word) => word.length > 0);
        const totalWords = words.length;
        const totalLines = lines.length;
        const averageWordsPerLine = totalLines > 0 ? totalWords / totalLines : 0;

        // Content analysis patterns
        const containsNumbers = /\d/.test(text);
        const containsDollarSigns = text.endsWith('');
        const containsDates = this.containsDatePatterns(text);

        // Heuristic to determine if this looks like transaction data
        const likelyTransactionData = this.assessTransactionLikelihood(text, {
            containsNumbers,
            containsDollarSigns,
            containsDates,
            totalLines,
            averageWordsPerLine,
        });

        const stats: PDFParsingStats = {
            totalCharacters,
            totalWords,
            totalLines,
            averageWordsPerLine,
            containsNumbers,
            containsDollarSigns,
            containsDates,
            likelyTransactionData,
        };

        logger.debug('PDF content analysis completed', {
            stats,
            sampleText: `${text.substring(0, 200)}...`,
        });

        return stats;
    }

    /**
     * Clean and prepare PDF text for AI processing
     */
    cleanTextForAI(text: string): string {
        return (
            text
                // Normalize whitespace
                .replace(/\s+/g, ' ')
                // Remove excessive blank lines
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                // Clean up common PDF artifacts
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
                // Trim whitespace
                .trim()
        );
    }

    /**
     * Extract pages from PDF text (if page markers exist)
     */
    extractPages(text: string): string[] {
        // Try to split by common page indicators
        const pageMarkers = [
            /Page \d+/gi,
            /\f/g, // Form feed character
            /Statement Page \d+/gi,
        ];

        let pages = [text];

        for (const marker of pageMarkers) {
            if (marker.test(text)) {
                pages = text.split(marker).filter((page) => page.trim().length > 0);
                break;
            }
        }

        return pages;
    }

    /**
     * Validate file exists and is readable
     */
    private async validateFile(filePath: string): Promise<void> {
        try {
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
                throw new ApiError('Path is not a file', StatusCodes.BAD_REQUEST);
            }

            if (stats.size === 0) {
                throw new ApiError('PDF file is empty', StatusCodes.BAD_REQUEST);
            }

            // Check file size limit (should be handled by multer, but double-check)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (stats.size > maxSize) {
                throw new ApiError('PDF file is too large', StatusCodes.BAD_REQUEST);
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            if ((error as any).code === 'ENOENT') {
                throw new ApiError('PDF file not found', StatusCodes.NOT_FOUND);
            }

            if ((error as any).code === 'EACCES') {
                throw new ApiError(
                    'Cannot read PDF file - permission denied',
                    StatusCodes.FORBIDDEN,
                );
            }

            throw new ApiError(
                'Failed to access PDF file',
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Extract metadata from PDF parse results
     */
    private extractMetadata(metadata: any): ParsedPDFResult['metadata'] {
        if (!metadata) return undefined;

        return {
            title: metadata.Title,
            author: metadata.Author,
            creator: metadata.Creator,
            producer: metadata.Producer,
            creationDate: metadata.CreationDate
                ? new Date(metadata.CreationDate)
                : undefined,
            modificationDate: metadata.ModDate
                ? new Date(metadata.ModDate)
                : undefined,
        };
    }

    /**
     * Check if text contains common date patterns
     */
    private containsDatePatterns(text: string): boolean {
        const datePatterns = [
            /\d{1,2}\/\d{1,2}\/\d{2,4}/, // MM/DD/YYYY or MM/DD/YY
            /\d{1,2}-\d{1,2}-\d{2,4}/, // MM-DD-YYYY or MM-DD-YY
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i, // Month abbreviations
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i, // Full month names
            /\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD (ISO format)
        ];

        return datePatterns.some((pattern) => pattern.test(text));
    }

    /**
     * Assess likelihood that the text contains transaction data
     */
    private assessTransactionLikelihood(
        text: string,
        indicators: {
            containsNumbers: boolean;
            containsDollarSigns: boolean;
            containsDates: boolean;
            totalLines: number;
            averageWordsPerLine: number;
        },
    ): boolean {
        let score = 0;

        // Essential indicators
        if (indicators.containsNumbers) score += 2;
        if (indicators.containsDollarSigns) score += 3;
        if (indicators.containsDates) score += 3;

        // Structure indicators
        if (indicators.totalLines > 10) score += 1; // Reasonable amount of content
        if (
            indicators.averageWordsPerLine > 2 &&
            indicators.averageWordsPerLine < 20
        )
            score += 1; // Reasonable line structure

        // Content keywords (common in credit card statements)
        const transactionKeywords = [
            /statement/i,
            /transaction/i,
            /payment/i,
            /balance/i,
            /credit/i,
            /debit/i,
            /purchase/i,
            /merchant/i,
            /account/i,
        ];

        const keywordMatches = transactionKeywords.filter((keyword) =>
            keyword.test(text),
        ).length;
        score += Math.min(keywordMatches, 3); // Cap at 3 points for keywords

        // Return true if score indicates likely transaction data
        return score >= 6; // Threshold for likely transaction content
    }

    /**
     * Cleanup temporary file after processing
     */
    async cleanupFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
            logger.info(`Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            logger.warn(`Failed to cleanup temporary file: ${filePath}`, error);
            // Don't throw error for cleanup failures - just log them
        }
    }
}

// Export singleton instance
export const pdfParserService = new PDFParserService();
