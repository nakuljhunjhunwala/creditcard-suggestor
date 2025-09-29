import winston from 'winston';
import httpContext from 'express-http-context';
// @ts-ignore - No types available for winston-datadog-transport
import DatadogTransport from 'winston-datadog-transport';
import { env } from '@/shared/config/env.config';

/**
 * Custom JSON stringifier that handles circular references
 * @param {Object} obj - The object to stringify
 * @returns {string} - JSON string
 */
const safeStringify = (obj: object) => {
  const cache = new Set();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        // Handle circular references
        if (cache.has(value)) {
          return '[Circular Reference]';
        }
        cache.add(value);
      }
      return value;
    },
    2,
  );
};

const { combine, timestamp, printf, colorize, align, json } = winston.format;

const logFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json(),
  printf((info) => {
    const requestId = httpContext.get('requestId');
    return `[${info.timestamp}] ${info.level} [${requestId ?? '-'}] ${info.message}`;
  }),
);

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf((info) => {
    const requestId = httpContext.get('requestId');
    const logObj = {
      timestamp: info.timestamp,
      requestId: requestId ?? '-',
      service: info.service,
      ...info // Include all other metadata
    };

    // Remove duplicate fields to avoid redundancy
    delete logObj.timestamp;
    const finalLog = {
      timestamp: info.timestamp,
      level: info.level,
      requestId: requestId ?? '-',
      message: info.message,
      ...Object.fromEntries(
        Object.entries(logObj).filter(([key]) =>
          !['timestamp', 'level', 'message', 'requestId'].includes(key)
        )
      )
    };

    try {
      return JSON.stringify(finalLog);
    } catch (error) {
      return JSON.stringify({
        timestamp: info.timestamp,
        level: info.level,
        requestId: requestId ?? '-',
        message: info.message,
        error: 'Failed to stringify log data'
      });
    }
  })
);


const transports: winston.transport[] = [
  new winston.transports.Console({
    level: 'info',
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      align(),
      printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        const requestId = httpContext.get('requestId');
        let metaStr = '';
        if (Object.keys(meta).length) {
          try {
            metaStr = safeStringify(meta);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            metaStr = '{ "error": "Error stringifying metadata" }';
          }
        }
        return `[${timestamp}] ${level} [${requestId ?? '-'}]: ${message} ${metaStr}`;
      }),
    ),
  }),
];

// Optional DataDog transport
if (env.NODE_ENV === 'production' && env.DATADOG_API_KEY) {
  transports.push(
    new DatadogTransport({
      apiKey: env.DATADOG_API_KEY,
      hostname: env.DATADOG_HOST,
      service: env.DATADOG_SERVICE,
      ddsource: 'nodejs',
      intakeRegion: env.DATADOG_REGION,
    }) as winston.transport,
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: env.SERVICE_NAME || 'api-service' },
  transports,
  exitOnError: false,
});

// include the logFormat in the file transport with all that json metadata also included in combined.log currently no json is included
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  );
  logger.add(new winston.transports.File({ filename: 'logs/combined.log', format: fileFormat }));
}
