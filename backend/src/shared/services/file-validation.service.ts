import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/shared/utils/logger.util';
// import { ApiError } from '@/shared/utils/api-error.util';
// import { StatusCodes } from '@/shared/constants/http-status.constants';
import { env } from '@/shared/config/env.config';

/**
 * File Validation Service
 * Comprehensive validation for uploaded PDF files including security, structure, and content checks
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fileInfo: {
        size: number;
        extension: string;
        mimetype: string;
        actualMimetype?: string;
    };
    pdfInfo?: {
        isValidPDF: boolean;
        hasText: boolean;
        pageCount?: number;
        isEncrypted: boolean;
        version?: string;
        hasImages: boolean;
        hasForms: boolean;
    };
    securityChecks: {
        passedVirusScan: boolean;
        passedStructureCheck: boolean;
        passedContentCheck: boolean;
        suspiciousPatterns: string[];
    };
    recommendations: string[];
}

export interface FileMetadata {
    originalName: string;
    size: number;
    uploadedAt: Date;
    sessionToken: string;
    clientIP?: string;
    userAgent?: string;
}

export class FileValidationService {
    private readonly MAX_FILE_SIZE = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    private readonly ALLOWED_EXTENSIONS = ['.pdf'];
    private readonly ALLOWED_MIMETYPES = ['application/pdf'];

    // PDF magic bytes
    private readonly PDF_MAGIC_BYTES = Buffer.from('%PDF', 'ascii');

    // Suspicious patterns in PDF files
    private readonly SUSPICIOUS_PATTERNS = [
        /\/JavaScript/gi,
        /\/JS/gi,
        /\/OpenAction/gi,
        /\/Launch/gi,
        /\/URI/gi,
        /\/SubmitForm/gi,
        /\/ImportData/gi,
        /%u[0-9a-fA-F]{4}/g, // Unicode escapes (potential obfuscation)
        /eval\s*\(/gi,
        /unescape\s*\(/gi,
        /fromCharCode/gi,
    ];

    /**
     * Comprehensive file validation
     */
    async validateFile(
        filePath: string,
        metadata: FileMetadata,
    ): Promise<ValidationResult> {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            fileInfo: {
                size: metadata.size,
                extension: path.extname(metadata.originalName).toLowerCase(),
                mimetype: 'application/pdf',
            },
            securityChecks: {
                passedVirusScan: true,
                passedStructureCheck: true,
                passedContentCheck: true,
                suspiciousPatterns: [],
            },
            recommendations: [],
        };

        try {
            logger.info('Starting comprehensive file validation', {
                filePath,
                originalName: metadata.originalName,
                size: metadata.size,
            });

            // Step 1: Basic file validation
            await this.validateBasicFileProperties(filePath, metadata, result);

            // Step 2: File structure validation
            await this.validateFileStructure(filePath, result);

            // Step 3: PDF-specific validation
            await this.validatePDFContent(filePath, result);

            // Step 4: Security validation
            await this.performSecurityChecks(filePath, result);

            // Step 5: Content quality assessment
            await this.assessContentQuality(filePath, result);

            // Step 6: Generate recommendations
            this.generateRecommendations(result);

            // Final validation status
            result.isValid = result.errors.length === 0;

            logger.info('File validation completed', {
                filePath,
                isValid: result.isValid,
                errorsCount: result.errors.length,
                warningsCount: result.warnings.length,
            });

            return result;
        } catch (error) {
            logger.error('File validation failed', { filePath, error });
            result.isValid = false;
            result.errors.push(
                `Validation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return result;
        }
    }

    /**
     * Quick validation for upload middleware
     */
    async quickValidate(
        filePath: string,
        originalName: string,
        size: number,
    ): Promise<{
        isValid: boolean;
        error?: string;
    }> {
        try {
            // Check file size
            if (size > this.MAX_FILE_SIZE) {
                return {
                    isValid: false,
                    error: `File too large. Maximum size is ${env.MAX_UPLOAD_SIZE_MB}MB`,
                };
            }

            // Check extension
            const extension = path.extname(originalName).toLowerCase();
            if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
                return {
                    isValid: false,
                    error: 'Only PDF files are allowed',
                };
            }

            // Quick PDF magic bytes check
            const buffer = await fs.readFile(filePath, { encoding: null });
            if (!buffer.subarray(0, 4).equals(this.PDF_MAGIC_BYTES)) {
                return {
                    isValid: false,
                    error: 'File does not appear to be a valid PDF',
                };
            }

            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: `File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Clean up temporary files older than specified age
     */
    async cleanupTempFiles(maxAgeMinutes: number = 60): Promise<{
        cleaned: number;
        errors: string[];
    }> {
        const result: { cleaned: number; errors: string[] } = {
            cleaned: 0,
            errors: [],
        };
        const maxAge = Date.now() - maxAgeMinutes * 60 * 1000;

        try {
            const tempDir = env.TEMP_UPLOAD_DIR;
            const files = await fs.readdir(tempDir);

            for (const file of files) {
                const filePath = path.join(tempDir, file);

                try {
                    const stats = await fs.stat(filePath);

                    if (stats.isFile() && stats.mtime.getTime() < maxAge) {
                        await fs.unlink(filePath);
                        result.cleaned++;
                        logger.debug(`Cleaned up temporary file: ${file}`);
                    }
                } catch (error) {
                    result.errors.push(
                        `Failed to cleanup ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    );
                }
            }

            logger.info(
                `Cleanup completed: ${result.cleaned} files cleaned, ${result.errors.length} errors`,
            );
        } catch (error) {
            result.errors.push(
                `Cleanup process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }

        return result;
    }

    /**
     * Validate basic file properties
     */
    private async validateBasicFileProperties(
        filePath: string,
        metadata: FileMetadata,
        result: ValidationResult,
    ): Promise<void> {
        try {
            // Check if file exists
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
                result.errors.push('Uploaded item is not a file');
                return;
            }

            // Validate file size
            const actualSize = stats.size;
            result.fileInfo.size = actualSize;

            if (actualSize === 0) {
                result.errors.push('File is empty');
                return;
            }

            if (actualSize > this.MAX_FILE_SIZE) {
                result.errors.push(
                    `File too large: ${(actualSize / 1024 / 1024).toFixed(2)}MB exceeds limit of ${env.MAX_UPLOAD_SIZE_MB}MB`,
                );
            }

            if (actualSize !== metadata.size) {
                result.warnings.push(
                    'File size mismatch between metadata and actual file',
                );
            }

            // Validate extension
            const extension = path.extname(metadata.originalName).toLowerCase();
            result.fileInfo.extension = extension;

            if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
                result.errors.push(
                    `Invalid file extension: ${extension}. Only PDF files are allowed`,
                );
            }

            // Check for suspicious file names
            if (this.hasSuspiciousFileName(metadata.originalName)) {
                result.warnings.push('Suspicious file name patterns detected');
                result.securityChecks.suspiciousPatterns.push('suspicious_filename');
            }
        } catch (error) {
            result.errors.push(
                `Failed to validate basic file properties: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Validate file structure and magic bytes
     */
    private async validateFileStructure(
        filePath: string,
        result: ValidationResult,
    ): Promise<void> {
        try {
            const buffer = await fs.readFile(filePath, { encoding: null });

            // Check PDF magic bytes
            if (!buffer.subarray(0, 4).equals(this.PDF_MAGIC_BYTES)) {
                result.errors.push('File does not start with PDF magic bytes (%PDF)');
                result.securityChecks.passedStructureCheck = false;
                return;
            }

            // Check for PDF version
            const header = buffer.subarray(0, 100).toString('ascii');
            const versionMatch = header.match(/%PDF-(\d+\.\d+)/);
            if (versionMatch) {
                const version = versionMatch[1];
                result.pdfInfo = {
                    ...result.pdfInfo,
                    version,
                    isValidPDF: true,
                    hasText: false,
                    isEncrypted: false,
                    hasImages: false,
                    hasForms: false,
                };

                // Check for very old PDF versions
                const versionNum = parseFloat(version);
                if (versionNum < 1.4) {
                    result.warnings.push(
                        `Old PDF version detected (${version}). Consider using a newer version for better compatibility`,
                    );
                }
            } else {
                result.warnings.push('Could not determine PDF version');
            }

            // Check for PDF trailer
            const trailer = buffer.subarray(-1024).toString('ascii');
            if (!trailer.includes('%%EOF')) {
                result.warnings.push('PDF does not end with proper EOF marker');
            }

            // Detect actual mimetype
            result.fileInfo.actualMimetype = this.detectMimeType(buffer);
            if (result.fileInfo.actualMimetype !== 'application/pdf') {
                result.errors.push(
                    `File mimetype mismatch. Expected PDF but detected: ${result.fileInfo.actualMimetype}`,
                );
            }
        } catch (error) {
            result.errors.push(
                `File structure validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            result.securityChecks.passedStructureCheck = false;
        }
    }

    /**
     * Validate PDF-specific content
     */
    private async validatePDFContent(
        filePath: string,
        result: ValidationResult,
    ): Promise<void> {
        try {
            const buffer = await fs.readFile(filePath, { encoding: null });
            const content = buffer.toString('ascii');

            if (!result.pdfInfo) {
                result.pdfInfo = {
                    isValidPDF: false,
                    hasText: false,
                    isEncrypted: false,
                    hasImages: false,
                    hasForms: false,
                };
            }

            // Check if PDF is encrypted
            result.pdfInfo.isEncrypted = /\/Encrypt\s/.test(content);
            if (result.pdfInfo.isEncrypted) {
                result.warnings.push('PDF is encrypted/password protected');
            }

            // Check for text content indicators
            result.pdfInfo.hasText =
                /\/Length\s+\d+/.test(content) || /BT\s.*ET/.test(content);
            if (!result.pdfInfo.hasText) {
                result.warnings.push(
                    'PDF appears to contain mostly images rather than text',
                );
            }

            // Check for images
            result.pdfInfo.hasImages =
                content.includes('/Image') ||
                content.includes('/DCTDecode') ||
                content.includes('/FlateDecode');

            // Check for forms
            result.pdfInfo.hasForms =
                content.includes('/AcroForm') || content.includes('/Widget');

            // Estimate page count (rough approximation)
            const pageMatches = content.match(/\/Type\s*\/Page[^s]/g);
            if (pageMatches) {
                result.pdfInfo.pageCount = pageMatches.length;

                if (result.pdfInfo.pageCount > 100) {
                    result.warnings.push(
                        `Large PDF with ${result.pdfInfo.pageCount} pages may take longer to process`,
                    );
                }
            }

            // Check PDF size vs content ratio
            const contentDensity = buffer.length / (result.pdfInfo.pageCount || 1);
            if (contentDensity > 5 * 1024 * 1024) {
                // > 5MB per page
                result.warnings.push(
                    'PDF appears to be image-heavy, which may affect text extraction quality',
                );
            }
        } catch (error) {
            result.warnings.push(
                `PDF content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Perform security checks
     */
    private async performSecurityChecks(
        filePath: string,
        result: ValidationResult,
    ): Promise<void> {
        try {
            const buffer = await fs.readFile(filePath, { encoding: null });
            const content = buffer.toString('ascii');

            // Check for suspicious patterns
            for (const pattern of this.SUSPICIOUS_PATTERNS) {
                if (pattern.test(content)) {
                    result.securityChecks.suspiciousPatterns.push(pattern.source);
                    result.warnings.push(
                        `Potentially suspicious content detected: ${pattern.source}`,
                    );
                }
            }

            // Check for embedded files
            if (content.includes('/EmbeddedFile')) {
                result.warnings.push('PDF contains embedded files');
                result.securityChecks.suspiciousPatterns.push('embedded_files');
            }

            // Check for external links
            if (content.includes('/URI')) {
                result.warnings.push('PDF contains external links');
            }

            // Simple virus scan simulation (in production, use real antivirus)
            result.securityChecks.passedVirusScan =
                await this.simulateVirusScan(buffer);

            if (!result.securityChecks.passedVirusScan) {
                result.errors.push('File failed security scan');
            }

            // Overall security check status
            result.securityChecks.passedContentCheck =
                result.securityChecks.suspiciousPatterns.length < 3;
        } catch (error) {
            result.warnings.push(
                `Security checks failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            result.securityChecks.passedVirusScan = false;
            result.securityChecks.passedContentCheck = false;
        }
    }

    /**
     * Assess content quality for transaction extraction
     */
    private async assessContentQuality(
        filePath: string,
        result: ValidationResult,
    ): Promise<void> {
        try {
            const buffer = await fs.readFile(filePath, { encoding: null });
            const content = buffer.toString('ascii');

            // Look for financial statement indicators
            const financialKeywords = [
                'statement',
                'account',
                'transaction',
                'balance',
                'payment',
                'purchase',
                'charge',
                'credit',
                'debit',
                'amount',
                'date',
            ];

            let keywordCount = 0;
            for (const keyword of financialKeywords) {
                if (new RegExp(keyword, 'gi').test(content)) {
                    keywordCount++;
                }
            }

            if (keywordCount < 3) {
                result.warnings.push(
                    'File may not contain typical financial statement content',
                );
                result.recommendations.push(
                    'Ensure the PDF is a credit card or bank statement',
                );
            }

            // Check for common statement formats
            if (/statement\s+period/gi.test(content)) {
                result.recommendations.push(
                    'Statement period detected - good for transaction extraction',
                );
            }

            // Check for table structures (common in statements)
            const tableIndicators = content.match(
                /\s+\d{1,2}\/\d{1,2}\s+|\$\d+\.\d{2}|\d{4}-\d{2}-\d{2}/g,
            );
            if (!tableIndicators || tableIndicators.length < 5) {
                result.warnings.push('PDF may not contain tabular transaction data');
            }
        } catch (error) {
            result.warnings.push(
                `Content quality assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Generate recommendations based on validation results
     */
    private generateRecommendations(result: ValidationResult): void {
        // File size recommendations
        if (result.fileInfo.size < 100 * 1024) {
            // < 100KB
            result.recommendations.push(
                'File is quite small - ensure it contains complete statement data',
            );
        }

        if (result.fileInfo.size > 5 * 1024 * 1024) {
            // > 5MB
            result.recommendations.push(
                'Large file detected - processing may take longer',
            );
        }

        // PDF version recommendations
        if (result.pdfInfo?.version) {
            const version = parseFloat(result.pdfInfo.version);
            if (version < 1.4) {
                result.recommendations.push(
                    'Consider saving as a newer PDF version for better text extraction',
                );
            }
        }

        // Content recommendations
        if (result.pdfInfo?.hasImages && !result.pdfInfo?.hasText) {
            result.recommendations.push(
                'Image-only PDFs may have lower text extraction accuracy',
            );
        }

        if (result.pdfInfo?.isEncrypted) {
            result.recommendations.push(
                'Remove password protection before uploading for better processing',
            );
        }

        // Security recommendations
        if (result.securityChecks.suspiciousPatterns.length > 0) {
            result.recommendations.push(
                'Consider uploading a clean statement without interactive elements',
            );
        }
    }

    /**
     * Detect MIME type from file content
     */
    private detectMimeType(buffer: Buffer): string {
        // PDF magic bytes
        if (buffer.subarray(0, 4).equals(this.PDF_MAGIC_BYTES)) {
            return 'application/pdf';
        }

        // Other common formats that might be mistakenly uploaded
        if (buffer.subarray(0, 4).equals(Buffer.from('PK\x03\x04', 'binary'))) {
            return 'application/zip'; // Could be .docx, .xlsx, etc.
        }

        if (
            buffer.subarray(0, 8).equals(Buffer.from('\x89PNG\r\n\x1A\n', 'binary'))
        ) {
            return 'image/png';
        }

        if (buffer.subarray(0, 3).equals(Buffer.from('\xFF\xD8\xFF', 'binary'))) {
            return 'image/jpeg';
        }

        return 'application/octet-stream';
    }

    /**
     * Check for suspicious file name patterns
     */
    private hasSuspiciousFileName(filename: string): boolean {
        const suspiciousPatterns = [
            /\.(exe|bat|cmd|scr|vbs|js)$/i,
            /[\u0000-\u001f\u007f-\u009f]/, // Control characters
            /[<>:"|?*]/, // Windows invalid filename chars
            /^\./, // Hidden files (Unix)
            /\s{10,}/, // Excessive whitespace
        ];

        return suspiciousPatterns.some((pattern) => pattern.test(filename));
    }

    /**
     * Simulate virus scan (in production, integrate with real antivirus)
     */
    private async simulateVirusScan(buffer: Buffer): Promise<boolean> {
        // Simple heuristic checks
        const content = buffer.toString('ascii');

        // Check for known malicious patterns (simplified)
        const maliciousPatterns = [
            /eval\s*\(\s*unescape\s*\(/gi,
            /shell\s*\(\s*['"]/gi,
            /document\.write\s*\(\s*unescape\s*\(/gi,
            /%u[0-9a-f]{4}%u[0-9a-f]{4}%u[0-9a-f]{4}/gi, // Excessive unicode encoding
        ];

        for (const pattern of maliciousPatterns) {
            if (pattern.test(content)) {
                return false; // Failed virus scan
            }
        }

        return true; // Passed virus scan
    }
}

// Export singleton instance
export const fileValidationService = new FileValidationService();
