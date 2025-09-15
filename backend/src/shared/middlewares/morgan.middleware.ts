import { Request } from 'express';
import morgan from 'morgan';
import { env } from '@/shared/config/env.config';
import { logger } from '@/shared/utils';

// Custom token for request ID
morgan.token('id', (req: Request) => req.id);

// Custom token for user ID (if authenticated)
morgan.token('user', (req: Request) =>
  req.user ? req.user.id.toString() : 'anonymous',
);

// Custom token for real IP address (handles proxies)
morgan.token('real-ip', (req: Request) => {
  const ip = req.headers['x-forwarded-for'];
  if (Array.isArray(ip)) {
    return ip.join(', ');
  }
  return ip ?? req.connection.remoteAddress;
});

// Setup Morgan logger with custom format
const morganFormat =
  env.NODE_ENV === 'production'
    ? ':id - :real-ip - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
    : ':id - :method :url :status :response-time ms - :res[content-length] - :real-ip';

export const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
});
