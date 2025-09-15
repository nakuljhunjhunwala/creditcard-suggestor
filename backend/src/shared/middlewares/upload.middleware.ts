import multer from 'multer';
import path from 'path';
import { env } from '@/shared/config/env.config';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from 'http-status-codes';
// import { fileValidationService } from '@/shared/services/file-validation.service';

/**
 * Multer configuration for PDF file uploads
 */

// Create multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, env.TEMP_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const sessionToken = req.params.sessionToken || 'unknown';
        cb(
            null,
            `${sessionToken}-${uniqueSuffix}${path.extname(file.originalname)}`,
        );
    },
});

// Enhanced file filter with basic validation
const fileFilter = (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    // Basic MIME type check
    if (file.mimetype !== 'application/pdf') {
        return cb(
            new ApiError('Only PDF files are allowed', StatusCodes.BAD_REQUEST),
        );
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
        return cb(
            new ApiError('File must have .pdf extension', StatusCodes.BAD_REQUEST),
        );
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
        /\.(exe|bat|cmd|scr|vbs|js)$/i,
        /[\u0000-\u001f\u007f-\u009f]/,
        /[<>:"|?*]/,
        /^\./,
        /\s{10,}/,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(file.originalname))) {
        return cb(
            new ApiError('Suspicious file name detected', StatusCodes.BAD_REQUEST),
        );
    }

    return cb(null, true);
};

// Multer configuration
export const uploadConfig = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, // Convert MB to bytes
        files: 1, // Allow only one file per upload
    },
});

// Export specific upload middleware for PDF files
export const uploadPDF = uploadConfig.single('pdf');

/**
 * Error handling middleware for multer errors
 */
export const handleUploadErrors = (
    error: any,
    req: any,
    res: any,
    next: any,
) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: `File size too large. Maximum size allowed is ${env.MAX_UPLOAD_SIZE_MB}MB`,
                    code: 'FILE_TOO_LARGE',
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'Too many files. Only one PDF file is allowed per upload',
                    code: 'TOO_MANY_FILES',
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'Unexpected file field. Use "pdf" as the field name',
                    code: 'UNEXPECTED_FILE',
                });
            default:
                return res.status(StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: `Upload error: ${error.message}`,
                    code: 'UPLOAD_ERROR',
                });
        }
    }

    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
            code: 'INVALID_FILE_TYPE',
        });
    }

    // Pass other errors to global error handler
    next(error);
};
