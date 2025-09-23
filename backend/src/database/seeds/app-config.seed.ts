import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.util';

/**
 * Application configuration settings
 */
const APP_CONFIG = [
  // AI Model Configuration
  {
    id: 'conf_gemini_cheap',
    key: 'gemini_api_model_cheap',
    value: 'gemini-2.0-flash-exp',
    description: 'Cheap Gemini model for transaction extraction from PDFs',
  },
  {
    id: 'conf_gemini_premium',
    key: 'gemini_api_model_premium',
    value: 'gemini-2.0-flash-thinking-exp',
    description: 'Premium Gemini model for MCC code discovery and research',
  },
  {
    id: 'conf_ai_confidence_threshold',
    key: 'ai_confidence_threshold',
    value: '0.85',
    description: 'Minimum confidence threshold for AI-powered categorization',
  },

  // Session Management
  {
    id: 'conf_session_expiry',
    key: 'session_expiry_hours',
    value: '24',
    description: 'Hours before a processing session expires and is cleaned up',
  },
  {
    id: 'conf_session_cleanup_interval',
    key: 'session_cleanup_interval_minutes',
    value: '60',
    description: 'Interval in minutes for cleaning up expired sessions',
  },

  // File Processing
  {
    id: 'conf_max_upload_size',
    key: 'max_upload_size_mb',
    value: '10',
    description: 'Maximum file upload size in megabytes',
  },
  {
    id: 'conf_pdf_processing_timeout',
    key: 'pdf_processing_timeout_seconds',
    value: '120',
    description: 'Timeout for PDF processing operations in seconds',
  },
  {
    id: 'conf_temp_file_cleanup',
    key: 'temp_file_cleanup_minutes',
    value: '30',
    description: 'Minutes to keep temporary files before cleanup',
  },

  // Background Jobs
  {
    id: 'conf_max_concurrent_jobs',
    key: 'max_concurrent_jobs',
    value: '10',
    description: 'Maximum number of concurrent background processing jobs',
  },
  {
    id: 'conf_job_retry_attempts',
    key: 'job_max_retry_attempts',
    value: '3',
    description: 'Maximum number of retry attempts for failed jobs',
  },
  {
    id: 'conf_job_retry_delay',
    key: 'job_retry_delay_seconds',
    value: '30',
    description: 'Base delay in seconds before retrying failed jobs',
  },

  // MCC Discovery
  {
    id: 'conf_fuzzy_match_threshold',
    key: 'fuzzy_match_threshold',
    value: '0.8',
    description:
      'Minimum similarity threshold for fuzzy merchant name matching',
  },
  {
    id: 'conf_mcc_discovery_batch_size',
    key: 'mcc_discovery_batch_size',
    value: '5',
    description:
      'Number of unknown merchants to process in each MCC discovery batch',
  },
  {
    id: 'conf_ai_search_timeout',
    key: 'ai_search_timeout_seconds',
    value: '30',
    description: 'Timeout for AI-powered MCC discovery searches',
  },

  // Recommendation Engine
  {
    id: 'conf_max_recommendations',
    key: 'max_recommendations_per_session',
    value: '5',
    description:
      'Maximum number of card recommendations to generate per session',
  },
  {
    id: 'conf_min_spending_threshold',
    key: 'min_spending_threshold_dollars',
    value: '100',
    description: 'Minimum spending amount to consider for recommendations',
  },
  {
    id: 'conf_recommendation_score_threshold',
    key: 'recommendation_min_score',
    value: '70',
    description: 'Minimum recommendation score (0-100) to include in results',
  },

  // Caching
  {
    id: 'conf_mcc_cache_ttl',
    key: 'mcc_cache_ttl_hours',
    value: '24',
    description: 'Time to live for MCC code cache in hours',
  },
  {
    id: 'conf_card_data_cache_ttl',
    key: 'card_data_cache_ttl_hours',
    value: '12',
    description: 'Time to live for credit card data cache in hours',
  },
  {
    id: 'conf_recommendation_cache_ttl',
    key: 'recommendation_cache_ttl_minutes',
    value: '30',
    description: 'Time to live for recommendation results cache in minutes',
  },

  // Rate Limiting
  {
    id: 'conf_upload_rate_limit',
    key: 'upload_rate_limit_per_hour',
    value: '10',
    description: 'Maximum PDF uploads allowed per IP address per hour',
  },
  {
    id: 'conf_api_rate_limit',
    key: 'api_rate_limit_per_minute',
    value: '100',
    description: 'Maximum API requests allowed per IP address per minute',
  },

  // Performance Monitoring
  {
    id: 'conf_slow_query_threshold',
    key: 'slow_query_threshold_ms',
    value: '1000',
    description: 'Database query threshold in milliseconds to log as slow',
  },
  {
    id: 'conf_performance_metrics_retention',
    key: 'performance_metrics_retention_hours',
    value: '24',
    description: 'Hours to retain performance metrics in memory',
  },

  // Business Logic
  {
    id: 'conf_annual_fee_weight',
    key: 'annual_fee_weight_factor',
    value: '0.3',
    description: 'Weight factor for annual fee in recommendation scoring (0-1)',
  },
  {
    id: 'conf_signup_bonus_weight',
    key: 'signup_bonus_weight_factor',
    value: '0.4',
    description:
      'Weight factor for signup bonus in recommendation scoring (0-1)',
  },
  {
    id: 'conf_earning_rate_weight',
    key: 'earning_rate_weight_factor',
    value: '0.5',
    description:
      'Weight factor for earning rates in recommendation scoring (0-1)',
  },

  // Data Quality
  {
    id: 'conf_merchant_alias_confidence',
    key: 'merchant_alias_min_confidence',
    value: '0.9',
    description:
      'Minimum confidence required to create merchant alias mappings',
  },
  {
    id: 'conf_transaction_validation',
    key: 'enable_transaction_validation',
    value: 'true',
    description: 'Enable strict validation for transaction data extraction',
  },

  // Feature Flags
  {
    id: 'conf_enable_ai_discovery',
    key: 'enable_ai_mcc_discovery',
    value: 'true',
    description: 'Enable AI-powered MCC code discovery for unknown merchants',
  },
  {
    id: 'conf_enable_fuzzy_matching',
    key: 'enable_fuzzy_merchant_matching',
    value: 'true',
    description: 'Enable fuzzy matching for merchant name recognition',
  },
  {
    id: 'conf_enable_performance_monitoring',
    key: 'enable_performance_monitoring',
    value: 'true',
    description:
      'Enable detailed performance monitoring and metrics collection',
  },
  {
    id: 'conf_enable_debug_logging',
    key: 'enable_debug_logging',
    value: 'false',
    description:
      'Enable debug-level logging for development and troubleshooting',
  },

  // Recommendation Bonus/Penalty Configuration
  {
    id: 'conf_bonus_lifetime_free',
    key: 'BONUS_LIFETIME_FREE',
    value: '10',
    description: 'Bonus points for lifetime free credit cards',
  },
  {
    id: 'conf_bonus_high_customer_satisfaction',
    key: 'BONUS_HIGH_CUSTOMER_SATISFACTION',
    value: '5',
    description: 'Bonus points for cards with customer satisfaction >= 4.5',
  },
  {
    id: 'conf_bonus_medium_customer_satisfaction',
    key: 'BONUS_MEDIUM_CUSTOMER_SATISFACTION',
    value: '3',
    description: 'Bonus points for cards with customer satisfaction >= 4.0',
  },
  {
    id: 'conf_penalty_limited_acceptance',
    key: 'PENALTY_LIMITED_ACCEPTANCE',
    value: '5',
    description: 'Penalty points for cards with limited network acceptance (Amex, Diners)',
  },
  {
    id: 'conf_penalty_inactive_card',
    key: 'PENALTY_INACTIVE_CARD',
    value: '15',
    description: 'Penalty points for inactive credit cards',
  },
  {
    id: 'conf_penalty_low_customer_satisfaction',
    key: 'PENALTY_LOW_CUSTOMER_SATISFACTION',
    value: '8',
    description: 'Penalty points for cards with customer satisfaction < 3.5',
  },
  {
    id: 'conf_penalty_low_recommendation_score',
    key: 'PENALTY_LOW_RECOMMENDATION_SCORE',
    value: '5',
    description: 'Penalty points for cards with recommendation score < 70',
  },
] as const;

/**
 * Seed application configuration
 */
export async function seedAppConfig(prisma: PrismaClient): Promise<void> {
  try {
    for (const config of APP_CONFIG) {
      await prisma.appConfig.upsert({
        where: { key: config.key },
        update: {
          value: config.value,
          description: config.description,
        },
        create: {
          id: config.id,
          key: config.key,
          value: config.value,
          description: config.description,
        },
      });
    }

    logger.info(
      `✅ Successfully seeded ${APP_CONFIG.length} app configuration entries`,
    );
  } catch (error) {
    logger.error('❌ Error seeding app configuration:', error);
    throw error;
  }
}
