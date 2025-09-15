# Enterprise Node.js TypeScript Express Boilerplate

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [Authentication System](#authentication-system)
6. [Response Utilities](#response-utilities)
7. [Connector Patterns](#connector-patterns)
8. [Configuration Management](#configuration-management)
9. [Code Quality & Standards](#code-quality--standards)
10. [Constants & Enums](#constants--enums)
11. [Utility Functions](#utility-functions)
12. [Middleware Architecture](#middleware-architecture)
13. [Route Structure](#route-structure)
14. [API Documentation (Swagger)](#api-documentation-swagger)
15. [Environment Configuration](#environment-configuration)
16. [Logging & Monitoring](#logging--monitoring)
17. [Authentication Implementation](#authentication-implementation)
18. [Development Workflow](#development-workflow)
19. [Boilerplate Setup Guide](#boilerplate-setup-guide)

## Project Overview

This is a production-ready, enterprise-grade Node.js TypeScript Express boilerplate that provides a robust, scalable foundation for building REST APIs. It follows industry best practices and includes everything you need to build a modern backend application.

### Key Features
- **🏗️ Modular Architecture** - Clean separation of concerns with feature-based modules
- **🔒 Enterprise Security** - JWT authentication, Redis caching, request validation
- **📊 Database Integration** - PostgreSQL with Prisma ORM, migrations, and seeding
- **📝 API Documentation** - Auto-generated Swagger/OpenAPI 3.0 documentation
- **🧪 Code Quality** - ESLint, Prettier, TypeScript strict mode, error handling
- **📈 Observability** - Structured logging, request tracing, health checks
- **🔌 Service Connectors** - Abstracted database and external service connections
- **⚡ Performance** - Redis caching, connection pooling, rate limiting
- **🛠️ Developer Experience** - Hot reload, debug configuration, comprehensive tooling

## Project Structure

```
your-api-project/
├── src/
│   ├── app.ts                      # Express app configuration
│   ├── server.ts                   # Server entry point
│   ├── database/
│   │   ├── schema.prisma           # Prisma database schema
│   │   ├── migrations/             # Database migrations
│   │   ├── seeds/                  # Database seed files
│   │   └── db.ts                   # Database connection setup
│   ├── modules/                    # Feature-based modules
│   │   ├── auth/                   # Authentication & authorization
│   │   ├── users/                  # User management
│   │   ├── profiles/               # User profile management
│   │   ├── posts/                  # Example: Posts/Articles module
│   │   ├── comments/               # Example: Comments module
│   │   ├── notifications/          # Notification system
│   │   ├── settings/               # Application settings
│   │   ├── upload/                 # File upload handling
│   │   └── health/                 # Health check endpoints
│   ├── shared/                     # Shared utilities & services
│   │   ├── config/                 # Configuration management
│   │   ├── connectors/             # Database & external service connectors
│   │   ├── constants/              # Application constants & enums
│   │   ├── middlewares/            # Express middlewares
│   │   ├── types/                  # Global TypeScript type definitions
│   │   └── utils/                  # Utility functions & helpers
│   ├── routes/                     # Main route aggregation
│   └── jobs/                       # Background jobs & cron tasks
├── dist/                           # Compiled JavaScript output
├── logs/                           # Application log files
├── tests/                          # Test files (unit, integration, e2e)
├── docs/                           # Documentation files
├── .env                            # Environment variables
├── .env.example                    # Environment variables template
├── tsconfig.json                   # TypeScript configuration
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── docker-compose.yml              # Docker development setup
├── Dockerfile                      # Production Docker image
├── package.json                    # Dependencies and npm scripts
└── README.md                       # Project documentation
```

### Module Structure Pattern

Each feature module follows this consistent, scalable structure:

```
modules/[module-name]/
├── [module].controller.ts          # HTTP request/response handling
├── [module].service.ts             # Business logic & data processing
├── [module].model.ts               # Database access layer (Prisma queries)
├── [module].dto.ts                 # Data transfer objects & interfaces
├── [module].validation.ts          # Request validation schemas (Joi/Zod)
├── [module].routes.ts              # Route definitions & middleware
├── [module].constants.ts           # Module-specific constants
├── middleware/                     # Module-specific middleware functions
│   ├── [module]-auth.middleware.ts # Authorization middleware
│   └── [module]-validation.middleware.ts # Validation middleware
├── utils/                          # Module-specific utility functions
└── index.ts                        # Module exports (barrel file)
```

### Example Module Implementation

```typescript
// modules/posts/index.ts - Barrel file for clean imports
export { PostController } from './posts.controller';
export { PostService } from './posts.service';
export { PostModel } from './posts.model';
export * from './posts.dto';
export { postRoutes } from './posts.routes';
```

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (v5.8+)
- **Framework**: Express.js (v5.1+)
- **Database**: PostgreSQL
- **ORM**: Prisma (v6.11+)
- **Cache**: Redis (v5.6+)
- **Authentication**: Firebase Admin SDK + JWT

### Development Tools
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **Process Manager**: ts-node-dev (development)
- **API Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston with DataDog integration
- **Testing**: Jest + Supertest

### Additional Libraries
- **Security**: Helmet, CORS
- **Validation**: Joi + Zod
- **File Upload**: Multer
- **Cloud Storage**: Google Cloud Storage
- **Monitoring**: DataDog (optional)
- **HTTP Context**: express-http-context

## Database Architecture

### Database Schema Architecture

This boilerplate uses PostgreSQL with Prisma ORM and provides a flexible, scalable database structure:

#### Core Entity Patterns

**User Management System**
```sql
-- Core user authentication and management
users (id, email, password_hash, user_type, is_active, email_verified)
user_profiles (user_id, first_name, last_name, avatar_url, timezone)
user_settings (user_id, theme, language, notification_preferences)
refresh_tokens (id, token, user_id, expires_at, revoked, created_by_ip)
password_reset_tokens (id, user_id, token, expires_at, used)
```

**Multi-Tenant Organization Structure**
```sql
-- Flexible organization/tenant system
organizations (id, name, slug, domain, subscription_type, is_active)
organization_members (org_id, user_id, role, permissions, joined_at)
organization_invitations (id, org_id, email, role, token, expires_at)
```

**Content Management**
```sql
-- Generic content entities (posts, articles, etc.)
posts (id, organization_id, author_id, title, content, status, published_at)
categories (id, organization_id, name, slug, description, parent_id)
post_categories (post_id, category_id)
tags (id, organization_id, name, slug, color)
post_tags (post_id, tag_id)
```

**Interaction System**
```sql
-- Comments, likes, reactions system
comments (id, post_id, user_id, parent_id, content, status, created_at)
reactions (id, post_id, user_id, reaction_type, created_at)
follows (id, follower_id, following_id, created_at)
bookmarks (id, user_id, post_id, created_at)
```

**Notification System**
```sql
-- Comprehensive notification system
notifications (id, user_id, type, title, message, data, read_at, created_at)
notification_preferences (user_id, type, email_enabled, push_enabled, in_app_enabled)
```

**File Management**
```sql
-- File upload and media management
files (id, user_id, filename, original_name, mime_type, size, path, metadata)
file_permissions (file_id, user_id, permission_type, expires_at)
```

**Activity & Audit System**
```sql
-- User activity and audit logging
activities (id, user_id, organization_id, action, entity_type, entity_id, metadata, ip_address, created_at)
audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
```

### Key Database Features

**1. Multi-Tenant Architecture**
- All entities scoped to `organization_id` for data isolation
- Flexible organization hierarchy support
- Role-based access control within organizations
- Cross-organization data sharing capabilities

**2. External System Integration**
```sql
-- All major entities support external API integration
external_source_system    -- 'stripe', 'mailchimp', 'salesforce', etc.
external_source_id        -- External system's record ID
sync_status              -- 'pending', 'synced', 'failed'
last_synced_at          -- Timestamp of last successful sync
```

**3. Flexible Content Management**
```sql
-- Polymorphic content structure
content_type            -- 'post', 'article', 'product', etc.
status                  -- 'draft', 'published', 'archived'
visibility              -- 'public', 'private', 'organization'
metadata                -- JSON field for custom attributes
```

**4. Advanced Permission System**
```sql
-- Granular permission management
permissions (id, name, resource, action)           -- 'posts:create', 'users:read'
roles (id, name, description, organization_id)     -- 'admin', 'editor', 'viewer'
role_permissions (role_id, permission_id)          -- Many-to-many mapping
user_permissions (user_id, permission_id)          -- Direct user permissions
```

**5. Audit & Activity Tracking**
```sql
-- Comprehensive activity logging
activities              -- User actions and system events
audit_logs             -- Database changes with before/after values
login_attempts         -- Security monitoring
api_usage_logs         -- API consumption tracking
```

## Authentication System

### JWT-Based Authentication Architecture

The boilerplate implements a secure JWT-based authentication system with comprehensive security features:

```typescript
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}
```

**Authentication Flow:**
1. User registers/logs in with email/password
2. Backend validates credentials and generates JWT tokens
3. Access token (short-lived) + Refresh token (long-lived)
4. Redis used for token blacklisting and session management

### Core Authentication Features

**Token Management:**
```typescript
// Access tokens (short-lived: 15m-1h)
generateAccessToken(user, organization?): string

// Refresh tokens (long-lived: 7-30d, stored in database)
generateRefreshToken(userId, clientIp): Promise<string>

// Token blacklisting for security
blacklistToken(token, expirationSeconds): Promise<void>

// Force logout across all devices
forceLogoutUser(userId): Promise<void>
```

**Security Features:**
- Password hashing with bcrypt (salt rounds: 12)
- Token blacklisting in Redis for immediate invalidation
- IP-based tracking for suspicious activity
- Rate limiting on authentication endpoints
- Email verification for new accounts
- Password reset with secure tokens
- Audit logging for all authentication events

## Response Utilities

### ResponseUtil Class

The `ResponseUtil` class provides standardized API responses:

```typescript
// Success response
ResponseUtil.success<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: PaginationMeta
): Response

// Paginated response
ResponseUtil.paginatedSuccess<T>(
  res: Response,
  data: T[],
  message = 'Success',
  page = 1,
  total = 0,
  limit = 10,
  statusCode = 200
): Response

// Error response
ResponseUtil.error(
  res: Response,
  message = 'Internal Server Error',
  statusCode = 500,
  errors: object | null = null
): Response
```

### Standard Response Format

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... },
  "requestId": "req_123456789",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "User-friendly error message",
  "requestId": "req_123456789",
  "errors": {
    "field": "validation error details"
  }
}
```

## Connector Patterns

### Base Connector Abstract Class

All connectors inherit from `BaseConnector<T>`:

```typescript
export abstract class BaseConnector<T> {
  protected instance: T | null = null;
  
  public abstract connect(): Promise<T>;
  public abstract disconnect(): Promise<void>;
  public abstract healthCheck(): Promise<boolean>;
  
  public static getInstance<T extends BaseConnector<unknown>>(
    this: new () => T
  ): T;
  
  protected async getClient(): Promise<T>;
}
```

### Redis Connector Implementation

```typescript
export class RedisConnector extends BaseConnector<RedisClientType> {
  // Basic operations
  async get(key: string): Promise<string | null>
  async set(key: string, value: string): Promise<void>
  async setWithExpiry(key: string, value: string, seconds: number): Promise<void>
  async del(key: string): Promise<number>
  
  // Advanced operations
  async keys(pattern: string): Promise<string[]>
  async exists(key: string): Promise<boolean>
  async ttl(key: string): Promise<number>
  
  // JSON operations
  async setJSON(key: string, value: object, ttl?: number): Promise<void>
  async getJSON<T>(key: string): Promise<T | null>
  
  // Set operations
  async addToSet(key: string, members: string[]): Promise<number>
  async getSetMembers(key: string): Promise<string[]>
  async removeFromSet(key: string, members: string[]): Promise<number>
  
  // Pub/Sub
  async publish(channel: string, message: string): Promise<number>
  async subscribe(channel: string, callback: (message: string) => void): Promise<void>
}
```

### Firebase Connector

```typescript
export class FirebaseConnector extends BaseConnector<admin.app.App> {
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken>
  async createUser(userData: admin.auth.CreateRequest): Promise<admin.auth.UserRecord>
  async updateUser(uid: string, userData: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord>
  async deleteUser(uid: string): Promise<void>
  async sendPasswordResetEmail(email: string): Promise<string>
  async createUserIfNotExists(email: string, displayName?: string): Promise<admin.auth.UserRecord>
}
```

### Database Connector Pattern

Each model follows the same pattern:

```typescript
export class UserModel extends BaseModel {
  // CRUD operations
  async findById(id: string): Promise<User | null>
  async findByEmail(email: string): Promise<User | null>
  async create(data: CreateUserDto): Promise<User>
  async update(id: string, data: UpdateUserDto): Promise<User>
  async delete(id: string): Promise<void>
  
  // Business-specific queries
  async findUsersBySchool(schoolId: string): Promise<User[]>
  async findActiveUsers(): Promise<User[]>
}
```

## Configuration Management

### Environment Configuration (Zod-based)

```typescript
// src/shared/config/env.config.ts
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRATION: z.string(),
  JWT_REFRESH_TOKEN_EXPIRATION: z.string(),
  
  // Firebase
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  
  // GCP Storage
  GCP_PROJECT_ID: z.string(),
  GCP_STORAGE_BUCKET: z.string(),
  GCP_SERVICE_ACCOUNT_KEY: z.string(),
  
  // DataDog (Optional)
  DATADOG_API_KEY: z.string().optional(),
  DATADOG_HOST: z.string().optional(),
  DATADOG_SERVICE: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.string().default('info'),
  SERVICE_NAME: z.string().default('api-service'),
});

export const env = envSchema.parse(process.env);
```

### Swagger Configuration

```typescript
// Dynamic API path detection based on environment
const getApiPaths = (): string[] => {
  const isDevelopment = env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return ['./src/modules/*/routes/*.ts', './src/modules/*/*.routes.ts'];
  } else {
    return ['./dist/modules/*/routes/*.js', './dist/modules/*/*.routes.js'];
  }
};

// Environment-aware server configuration
const getServerConfig = () => {
  const servers = [];
  
  if (env.NODE_ENV === 'development') {
    servers.push({
      url: `http://localhost:${env.PORT}/api/v1`,
      description: 'Development server',
    });
  } else {
    servers.push({
      url: 'https://core-api-dev.unischool.ai/api/v1',
      description: 'Production server',
    });
  }
  
  return servers;
};
```

## Code Quality & Standards

### ESLint Configuration

```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["plugin:@typescript-eslint/recommended", "prettier"],
  "plugins": ["@typescript-eslint", "prettier"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ]
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    },
    "resolveJsonModule": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Code Quality Scripts

```json
// package.json scripts
{
  "scripts": {
    "dev": "ts-node-dev -r tsconfig-paths/register --respawn --transpile-only src/server.ts",
    "build": "tsc && tsc-alias",
    "start": "node -r tsconfig-paths/register dist/server.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write .",
    "code-quality": "npm run lint:fix && npm run format && npm run build",
    "typecheck": "tsc --noEmit"
  }
}
```

## Constants & Enums

### Application Constants

```typescript
// src/shared/constants/app.constants.ts
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const USER_ACCESS_PATTERNS = {
  STAFF: {
    CAN_ACCESS_MY_CLASSES: true,
    CAN_ACCESS_ALL_CLASSES: true,
    CAN_EDIT_CLASSES: true,
    CAN_VIEW_ALL_DATA: true,
    CAN_VIEW_ROSTER: true,
    CAN_VIEW_ANALYTICS: true,
    CAN_VIEW_CONTACT_INFO: true,
    CAN_COMMUNICATE: true,
  },
  STUDENT: {
    CAN_ACCESS_MY_CLASSES: true,
    CAN_ACCESS_ALL_CLASSES: false,
    CAN_EDIT_CLASSES: false,
    CAN_VIEW_ALL_DATA: false,
    CAN_VIEW_ROSTER: true,
    CAN_VIEW_ANALYTICS: false,
    CAN_VIEW_CONTACT_INFO: false,
    CAN_COMMUNICATE: false,
  },
  GUARDIAN: {
    CAN_ACCESS_MY_CLASSES: true,
    CAN_ACCESS_ALL_CLASSES: false,
    CAN_EDIT_CLASSES: false,
    CAN_VIEW_ALL_DATA: false,
    CAN_VIEW_ROSTER: false,
    CAN_VIEW_ANALYTICS: true,
    CAN_VIEW_CONTACT_INFO: true,
    CAN_COMMUNICATE: true,
  },
} as const;
```

### HTTP Status Constants

```typescript
// src/shared/constants/http-status.constants.ts
export { StatusCodes } from 'http-status-codes';
```

### Validation Constants

```typescript
// src/shared/constants/validation.constants.ts
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

export const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;
```

## Utility Functions

### API Error Utility

```typescript
// src/shared/utils/api-error.util.ts
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: object;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    errors: object | null = null,
    isOperational: boolean = true,
    stack: string = ''
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (errors) this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
```

### Async Handler Utility

```typescript
// src/shared/utils/async-handler.util.ts
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### Logger Utility

```typescript
// src/shared/utils/logger.util.ts
const logFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json(),
  printf((info) => {
    const requestId = httpContext.get('requestId');
    return `[${info.timestamp}] ${info.level} [${requestId ?? '-'}] ${info.message}`;
  }),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: env.SERVICE_NAME || 'api-service' },
  transports: [
    new winston.transports.Console(),
    // DataDog transport in production
    // File transports in development
  ],
});
```

## Middleware Architecture

### Authentication Middleware

```typescript
// src/shared/middlewares/auth.middleware.ts
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return ResponseUtil.error(res, 'Authorization token is required', StatusCodes.UNAUTHORIZED);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Check if token is blacklisted
    const isBlacklisted = await redisConnector.get(token);
    if (isBlacklisted) {
      return ResponseUtil.error(res, 'Token has been revoked', StatusCodes.UNAUTHORIZED);
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Check force logout
    const isForceLoggedOut = await authService.isUserForceLoggedOut(
      decoded.userId,
      decoded.iat ?? 0,
    );
    if (isForceLoggedOut) {
      return ResponseUtil.error(res, 'Invalid or expired token', StatusCodes.UNAUTHORIZED);
    }
    
    req.user = decoded;
    return next();
  } catch {
    return ResponseUtil.error(res, 'Invalid or expired token', StatusCodes.UNAUTHORIZED);
  }
};
```

### Error Handling Middleware

```typescript
// src/shared/middlewares/error.middleware.ts
export const handleError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(message, statusCode, null, false, err.stack);
  }
  
  const { statusCode, message, errors } = error as ApiError;
  
  res.locals.errorMessage = message;
  
  const response = {
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };
  
  logger.error(err);
  
  res.status(statusCode).send(response);
};
```

### Request ID Middleware

```typescript
// src/shared/middlewares/request-id.middleware.ts
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.get('X-Request-ID') || uuidv4();
  res.set('X-Request-ID', req.id);
  next();
};
```

## Route Structure

### Main Router

```typescript
// src/routes/index.ts
const router = Router();

// Mount routes with versioning
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/classes', classesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/schools', schoolRoutes);
router.use('/settings', settingsRoutes);
router.use('/shared', sharedRoutes);
router.use('/directory', directoryRoutes);
router.use('/events', eventsRoutes);
router.use('/audience', audienceRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/one-feed', oneFeedRoutes);
router.use('/campus', campusRoutes);

export default router;
```

### Route Pattern Example

```typescript
// src/modules/auth/auth.routes.ts
const router = Router();

/**
 * @swagger
 * /auth/firebase-login:
 *   post:
 *     summary: Authenticate user with Firebase token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FirebaseLoginDto'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 */
router.post('/firebase-login', validateRequest(firebaseLoginValidation), authController.firebaseLogin);

router.post('/refresh-token', validateRequest(refreshTokenValidation), authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.post('/reset-password', validateRequest(resetPasswordValidation), authController.resetPassword);

// Admin routes
router.post('/create-staff', authMiddleware, validateRequest(staffUserCreationValidation), authController.createStaffUser);
router.post('/create-guardian', authMiddleware, validateRequest(guardianUserCreationValidation), authController.createGuardianUser);
router.post('/create-student', authMiddleware, validateRequest(studentUserCreationValidation), authController.createStudentUser);
router.post('/force-logout', authMiddleware, validateRequest(forceLogoutValidation), authController.forceLogout);

export default router;
```

## API Documentation (Swagger)

### Swagger Configuration Features

```typescript
// src/shared/config/swagger.config.ts
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UniSchool Backend API',
      version: '1.0.0',
      description: 'School Management System API with Firebase Authentication',
    },
    servers: getServerConfig(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      // Comprehensive schema definitions
      schemas: {
        FirebaseLoginDto: { /* ... */ },
        AuthTokens: { /* ... */ },
        ErrorResponse: { /* ... */ },
        // ... 50+ schemas
      },
    },
  },
  apis: getApiPaths(),
};
```

### Swagger Features

- **Environment-aware path detection** (TypeScript in dev, JavaScript in prod)
- **Comprehensive schema definitions** for all DTOs
- **Standardized error responses**
- **Security scheme definitions**
- **Debug endpoint** at `/api-docs/debug`
- **Interactive UI** at `/api-docs`

## Environment Configuration

### Required Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
SERVICE_NAME=unischool-api

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/unischool_dev"
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_TOKEN_EXPIRATION="15m"
JWT_REFRESH_TOKEN_EXPIRATION="7d"

# Firebase Configuration
FIREBASE_PROJECT_ID="your-firebase-project"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_WEB_API_KEY="AIzaSyXXXXXXXXXXXXXXXXX"

# Google Cloud Storage
GCP_PROJECT_ID="your-gcp-project"
GCP_STORAGE_BUCKET="your-storage-bucket"
GCP_SERVICE_ACCOUNT_KEY="base64-encoded-service-account-key"

# Logging & Monitoring (Optional)
LOG_LEVEL="info"
DATADOG_API_KEY="your-datadog-api-key"
DATADOG_HOST="your-app-hostname"
DATADOG_SERVICE="unischool-api"
DATADOG_REGION="us1"
```

## Logging & Monitoring

### Winston Logger Configuration

```typescript
// src/shared/utils/logger.util.ts
export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json(),
    printf((info) => {
      const requestId = httpContext.get('requestId');
      return `[${info.timestamp}] ${info.level} [${requestId ?? '-'}] ${info.message}`;
    }),
  ),
  defaultMeta: { service: env.SERVICE_NAME },
  transports: [
    new winston.transports.Console(),
    // DataDog transport in production
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### Logging Patterns

```typescript
// Structured logging with request context
logger.info('User login attempt', {
  userId: user.id,
  email: user.email,
  requestId: httpContext.get('requestId'),
  clientIp: req.ip,
});

// Error logging with full context
logger.error('Database operation failed', {
  error: error.message,
  stack: error.stack,
  operation: 'createUser',
  userId: userId,
  requestId: httpContext.get('requestId'),
});
```

## Authentication Implementation

### Complete Email/Password Authentication System

This boilerplate provides a full-featured email/password authentication system:

#### 1. Core Authentication Schema

```sql
-- Core authentication fields in users table
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Password reset functionality
password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email verification
email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refresh token storage
refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_by_ip INET,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revoked_by_ip INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Password Service

```typescript
// src/modules/auth/password.service.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class PasswordService {
  private static readonly SALT_ROUNDS = 12;
  
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

#### 3. Email/Password Auth Service

```typescript
// src/modules/auth/email-auth.service.ts
export class EmailAuthService {
  /**
   * Register new user with email/password
   */
  async register(data: {
    email: string;
    password: string;
    userType: 'staff' | 'student' | 'guardian';
    entityData: any;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    // 1. Validate email not already registered
    const existingUser = await this.authModel.findUserByEmail(data.email);
    if (existingUser) {
      throw new ApiError('Email already registered', StatusCodes.CONFLICT);
    }
    
    // 2. Hash password
    const passwordHash = await PasswordService.hashPassword(data.password);
    
    // 3. Generate email verification token
    const emailVerificationToken = PasswordService.generateEmailVerificationToken();
    
    // 4. Create entity (staff/student/guardian)
    let entityId: string;
    switch (data.userType) {
      case 'staff':
        const staff = await this.authModel.createStaff(data.entityData);
        entityId = staff.id;
        break;
      case 'student':
        const student = await this.authModel.createStudent(data.entityData);
        entityId = student.id;
        break;
      case 'guardian':
        const guardian = await this.authModel.createGuardian(data.entityData);
        entityId = guardian.id;
        break;
    }
    
    // 5. Create user
    const user = await this.authModel.createUser({
      email: data.email,
      user_type: data.userType,
      entity_id: entityId,
      password_hash: passwordHash,
      email_verification_token: emailVerificationToken,
      email_verified: false,
    });
    
    // 6. Send verification email
    await this.emailService.sendEmailVerification(data.email, emailVerificationToken);
    
    // 7. Generate tokens (but require email verification for full access)
    const tokens = await this.generateTokens(user);
    
    return { user, tokens };
  }
  
  /**
   * Login with email/password
   */
  async login(email: string, password: string, clientIp?: string): Promise<AuthTokens> {
    // 1. Find user
    const user = await this.authModel.findUserByEmail(email);
    if (!user) {
      throw new ApiError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }
    
    // 2. Verify password
    const isValidPassword = await PasswordService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }
    
    // 3. Check if user is active
    if (!user.is_active) {
      throw new ApiError('Account is disabled', StatusCodes.UNAUTHORIZED);
    }
    
    // 4. Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, clientIp);
    
    // 5. Update last login
    await this.authModel.updateUserLastLogin(user.id);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        entity_id: user.entity_id,
        email_verified: user.email_verified,
      },
    };
  }
  
  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ message: string }> {
    const user = await this.authModel.findUserByEmail(email);
    if (!user) {
      // Return success to prevent email enumeration
      return { message: 'If the email exists, a reset link will be sent.' };
    }
    
    // Generate reset token
    const resetToken = PasswordService.generateResetToken();
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Save reset token
    await this.authModel.updateUser(user.id, {
      password_reset_token: resetToken,
      password_reset_expires: resetExpires,
    });
    
    // Send reset email
    await this.emailService.sendPasswordReset(email, resetToken);
    
    return { message: 'If the email exists, a reset link will be sent.' };
  }
  
  /**
   * Confirm password reset
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.authModel.findByPasswordResetToken(token);
    if (!user || user.password_reset_expires < new Date()) {
      throw new ApiError('Invalid or expired reset token', StatusCodes.BAD_REQUEST);
    }
    
    // Hash new password
    const passwordHash = await PasswordService.hashPassword(newPassword);
    
    // Update user
    await this.authModel.updateUser(user.id, {
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
    });
    
    // Revoke all refresh tokens
    await this.authModel.revokeAllUserRefreshTokens(user.id);
    
    return { message: 'Password reset successfully' };
  }
  
  /**
   * Change password (authenticated user)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this.authModel.findUserById(userId);
    if (!user) {
      throw new ApiError('User not found', StatusCodes.NOT_FOUND);
    }
    
    // Verify current password
    const isValidPassword = await PasswordService.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError('Current password is incorrect', StatusCodes.BAD_REQUEST);
    }
    
    // Hash new password
    const passwordHash = await PasswordService.hashPassword(newPassword);
    
    // Update password
    await this.authModel.updateUser(userId, { password_hash: passwordHash });
    
    // Revoke all refresh tokens to force re-login
    await this.authModel.revokeAllUserRefreshTokens(userId);
    
    return { message: 'Password changed successfully' };
  }
  
  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.authModel.findByEmailVerificationToken(token);
    if (!user) {
      throw new ApiError('Invalid verification token', StatusCodes.BAD_REQUEST);
    }
    
    // Update user as verified
    await this.authModel.updateUser(user.id, {
      email_verified: true,
      email_verification_token: null,
    });
    
    return { message: 'Email verified successfully' };
  }
}
```

#### 4. Email Service

```typescript
// src/shared/services/email.service.ts
export class EmailService {
  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    
    // Use your preferred email service (SendGrid, Mailgun, etc.)
    await this.sendEmail({
      to: email,
      subject: 'Verify your email address',
      template: 'email-verification',
      data: { verificationUrl },
    });
  }
  
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset your password',
      template: 'password-reset',
      data: { resetUrl },
    });
  }
}
```

#### 5. New Routes

```typescript
// src/modules/auth/auth.routes.ts
// Add these routes alongside existing Firebase routes

router.post('/register', validateRequest(registerValidation), authController.register);
router.post('/login', validateRequest(loginValidation), authController.login);
router.post('/reset-password', validateRequest(resetPasswordValidation), authController.resetPassword);
router.post('/confirm-reset', validateRequest(confirmResetValidation), authController.confirmPasswordReset);
router.post('/change-password', authMiddleware, validateRequest(changePasswordValidation), authController.changePassword);
router.get('/verify-email/:token', authController.verifyEmail);
```

#### 6. Validation Schemas

```typescript
// src/modules/auth/auth.validation.ts
export const registerValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  user_type: Joi.string().valid('staff', 'student', 'guardian').required(),
  entity_data: Joi.object().required(),
});

export const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const changePasswordValidation = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
});
```

## Development Workflow

### Setup Instructions

1. **Clone and Install**
```bash
git clone <repository-url>
cd unischool-backend
npm install
```

2. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
# DATABASE_URL, REDIS_URL, JWT_SECRET, etc.
```

3. **Database Setup**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Seed database (optional)
npm run db:seed
```

4. **Development**
```bash
# Start development server
npm run dev

# Run code quality checks
npm run code-quality

# Type checking
npm run typecheck
```

### Code Quality Workflow

**Pre-commit checks:**
```bash
npm run lint:fix    # Auto-fix ESLint issues
npm run format      # Format with Prettier
npm run build       # Ensure TypeScript compiles
```

**Mandatory practices:**
- All code must pass ESLint and Prettier checks
- TypeScript strict mode enabled
- 100% type coverage required
- Connector abstraction must be followed
- Standardized error handling
- Comprehensive logging with request IDs

### Testing Strategy

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Deployment

```bash
# Production build
npm run build

# Start production server
npm start

# Health check
curl http://localhost:3000/api/v1/health
```

## Boilerplate Setup Guide

### Complete Project Generation Checklist

Use this checklist to generate a complete boilerplate project based on this architecture:

#### 1. Project Initialization

```bash
# Create project structure
mkdir your-api-project
cd your-api-project

# Initialize package.json
npm init -y

# Install core dependencies
npm install express typescript ts-node nodemon
npm install @types/express @types/node --save-dev

# Setup TypeScript
npx tsc --init
```

#### 2. Essential Package.json Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev -r tsconfig-paths/register --respawn --transpile-only src/server.ts",
    "build": "tsc && tsc-alias",
    "start": "node -r tsconfig-paths/register dist/server.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write .",
    "code-quality": "npm run lint:fix && npm run format && npm run build",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "prisma:generate": "prisma generate --schema src/database/schema.prisma",
    "prisma:migrate:dev": "prisma migrate dev --schema src/database/schema.prisma",
    "prisma:migrate:deploy": "prisma migrate deploy --schema src/database/schema.prisma",
    "prisma:studio": "prisma studio --schema src/database/schema.prisma",
    "db:seed": "ts-node -r tsconfig-paths/register src/database/seeds/index.ts"
  }
}
```

#### 3. Complete Dependencies List

```json
{
  "dependencies": {
    "@prisma/client": "^6.11.1",
    "bcrypt": "^6.0.0",
    "compression": "^1.8.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.0",
    "express": "^5.1.0",
    "express-http-context": "^2.0.1",
    "express-rate-limit": "^7.5.1",
    "helmet": "^8.1.0",
    "http-status-codes": "^2.3.0",
    "joi": "^17.13.3",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^2.0.2",
    "redis": "^5.6.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "tsconfig-paths": "^4.2.0",
    "uuid": "^11.1.0",
    "winston": "^3.17.0",
    "zod": "^4.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/compression": "^1.8.1",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/jest": "^30.0.0",
    "@types/joi": "^17.2.2",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/morgan": "^1.9.10",
    "@types/node": "^24.0.12",
    "@types/supertest": "^6.0.3",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.8",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^8.36.0",
    "@typescript-eslint/parser": "^8.36.0",
    "eslint": "^9.30.1",
    "eslint-config-prettier": "^10.1.5",
    "eslint-plugin-prettier": "^5.5.1",
    "jest": "^29.7.0",
    "prettier": "^3.6.2",
    "prisma": "^6.11.1",
    "supertest": "^7.1.3",
    "ts-jest": "^29.4.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "tsc-alias": "^1.8.16",
    "typescript": "^5.8.3"
  }
}
```

#### 4. Essential Configuration Files

**TypeScript Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    },
    "resolveJsonModule": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**ESLint Configuration (.eslintrc.json):**
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["plugin:@typescript-eslint/recommended", "prettier"],
  "plugins": ["@typescript-eslint", "prettier"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  },
  "env": {
    "node": true,
    "es6": true
  }
}
```

**Prettier Configuration (.prettierrc):**
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

#### 5. Environment Variables Template (.env.example)

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
SERVICE_NAME=your-api-service

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_ACCESS_TOKEN_EXPIRATION="15m"
JWT_REFRESH_TOKEN_EXPIRATION="7d"

# Email Configuration (Choose one)
# Mailgun
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# Google Cloud Storage (Optional)
GCP_PROJECT_ID="your-gcp-project-id"
GCP_STORAGE_BUCKET="your-storage-bucket"
GCP_SERVICE_ACCOUNT_KEY="base64-encoded-service-account-key"

# Logging & Monitoring (Optional)
LOG_LEVEL="info"
DATADOG_API_KEY="your-datadog-api-key"
DATADOG_HOST="your-app-hostname"
DATADOG_SERVICE="your-api-service"

# Frontend URLs
FRONTEND_URL="http://localhost:3000"
ADMIN_DASHBOARD_URL="http://localhost:3001"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"
```

#### 6. Docker Configuration

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start application
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/yourapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: yourapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 7. Required File Templates

**Main Entry Point (src/server.ts):**
```typescript
import app from './app';
import { env } from '@/shared/config/env.config';
import { logger } from '@/shared/utils/logger.util';

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
```

**Basic Prisma Schema (src/database/schema.prisma):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()"))
  email        String    @unique
  passwordHash String    @map("password_hash")
  firstName    String?   @map("first_name")
  lastName     String?   @map("last_name")
  role         String    @default("user")
  isActive     Boolean   @default(true) @map("is_active")
  emailVerified Boolean  @default(false) @map("email_verified")
  lastLogin    DateTime? @map("last_login")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  refreshTokens RefreshToken[]
  posts         Post[]

  @@map("users")
}

model RefreshToken {
  id        String    @id @default(dbgenerated("gen_random_uuid()"))
  token     String    @unique
  userId    String    @map("user_id")
  expiresAt DateTime  @map("expires_at")
  revoked   Boolean   @default(false)
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

model Post {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String   @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("posts")
}
```

### 🎯 Implementation Priority Order

When generating this boilerplate, implement in this order:

1. **Project Structure & Configuration** (TypeScript, ESLint, Prettier)
2. **Database Setup** (Prisma, basic schema, connection)
3. **Core Utilities** (Logger, Error handling, Response utils)
4. **Authentication Module** (JWT, registration, login)
5. **Middleware Stack** (Auth, validation, error handling)
6. **Example Modules** (Users, Posts, Health check)
7. **API Documentation** (Swagger setup)
8. **Testing Setup** (Jest configuration, example tests)
9. **Docker & Deployment** (Dockerfile, docker-compose)
10. **Documentation & Examples** (README, API examples)

### 🔧 Development Workflow

```bash
# 1. Clone/Generate project
git clone <generated-repo> && cd <project-name>

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Setup database
docker-compose up -d db redis
npm run prisma:migrate:dev
npm run db:seed

# 5. Start development
npm run dev

# 6. View API docs
open http://localhost:3000/api-docs
```

---

## 🎉 What You Get

This enterprise boilerplate provides:

- ✅ **Production-ready** TypeScript Express API
- ✅ **Complete authentication** with JWT & email verification
- ✅ **Database integration** with Prisma ORM
- ✅ **Redis caching** and session management
- ✅ **API documentation** with Swagger/OpenAPI
- ✅ **Code quality** tools (ESLint, Prettier, TypeScript strict)
- ✅ **Comprehensive logging** with Winston
- ✅ **Error handling** with custom error classes
- ✅ **Security middleware** (Helmet, CORS, rate limiting)
- ✅ **Docker support** for development and production
- ✅ **Testing setup** with Jest
- ✅ **Modular architecture** for scalability

**Perfect foundation for building modern, scalable REST APIs! 🚀**
