import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // Gemini AI Configuration
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  GEMINI_MODEL_CHEAP: z.string().default('gemini-2.0-flash-exp'), // For transaction extraction
  GEMINI_MODEL_PREMIUM: z.string().default('gemini-2.0-flash-thinking-exp'), // For MCC discovery

  // Session Configuration
  SESSION_EXPIRY_HOURS: z.coerce.number().default(24),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),

  // Processing Configuration
  MAX_CONCURRENT_JOBS: z.coerce.number().default(3),
  FUZZY_MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),

  // File Storage (temporary)
  TEMP_UPLOAD_DIR: z.string().default('./uploads/temp'),
  CLEANUP_INTERVAL_MINUTES: z.coerce.number().default(60),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // DataDog (Optional)
  DATADOG_API_KEY: z.string().optional(),
  DATADOG_HOST: z.string().optional(),
  DATADOG_SERVICE: z.string().optional(),
  DATADOG_REGION: z.string().optional(),

  // Logging
  LOG_LEVEL: z.string().default('info'),

  // Service
  SERVICE_NAME: z.string().default('credit-card-suggestor-api'),
});

export const env = envSchema.parse(process.env);
