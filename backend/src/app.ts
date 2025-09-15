import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from '@/shared/config/env.config';
import { ApiError } from '@/shared/utils';
import { StatusCodes } from '@/shared/constants';
import {
  handleError,
  handlePrismaError,
  handleValidationError,
  morganMiddleware,
  requestIdMiddleware,
} from '@/shared/middlewares';
import v1Router from '@/routes';
import { setupSwagger } from '@/shared/config/swagger.config';
import rateLimit from 'express-rate-limit';
import httpContext from 'express-http-context';

const app: Application = express();

// Swagger
setupSwagger(app);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());

// Http context
app.use(httpContext.middleware);

// Add request ID to each request
app.use(requestIdMiddleware);

// Set request ID in http context
app.use((req, res, next) => {
  httpContext.set('requestId', req.id);
  next();
});

// Request logger
if (env.NODE_ENV !== 'test') {
  app.use(morganMiddleware);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000,
  },
});
app.use(limiter);

// Routes
app.use('/api/v1', v1Router);

// Health check
// app.get('/health', (req, res) => {
//     res.status(200).send('OK');
// });

// send back a 404 error for any unknown api request
app.use(() => {
  throw new ApiError('Not found', StatusCodes.NOT_FOUND);
});

// convert error to ApiError, if needed
app.use(handleValidationError);
app.use(handlePrismaError);
app.use(handleError);

export default app;
