# Express TypeScript Boilerplate - Detailed Implementation Plan

## STRICT RULES TO FOLLOW (MANDATORY — ZERO EXCEPTIONS)

### ✅ 1. `process.env` Usage (MANDATORY)

- You **must not** use `process.env` anywhere except inside `env.config.ts`.
- All environment variables must be accessed via:

```ts
import { env } from '@/shared/config/env.config';
```

---

### ✅ 2. Prisma Usage (MANDATORY)

- All **Prisma Client** queries must **only** reside inside `*.model.ts` files.
- No direct Prisma usage in:
  - Controllers
  - Services
  - Middleware
  - Utilities
  - Routes

---

### ✅ 3. Project Structure & File Types (STRICT)

Follow this **exact** file-naming convention:

| Purpose    | Filename Pattern  |
| ---------- | ----------------- |
| Controller | `*.controller.ts` |
| Service    | `*.service.ts`    |
| Model      | `*.model.ts`      |
| Route      | `*.routes.ts`     |
| DTO        | `*.dto.ts`        |
| Validation | `*.validation.ts` |
| Config     | `*.config.ts`     |
| Utility    | `*.util.ts`       |
| Middleware | `*.middleware.ts` |
| Connector  | `*.connector.ts`  |

---

### ✅ 4. Import Paths (MANDATORY)

- **No relative imports** beyond 1 directory (no `../../../` anywhere).
- Always use TypeScript path mapping:

```ts
import { ResponseUtil } from '@/shared/utils/response.util';
```

---

### ✅ 5. Layer Responsibilities (MANDATORY)

| Layer      | Allowed Responsibilities                              |
| ---------- | ----------------------------------------------------- |
| Controller | Handle HTTP requests, call services, return responses |
| Service    | Business logic, call models, handle edge cases        |
| Model      | Prisma operations **only** (zero logic here)          |
| Middleware | Request validation, authentication, error handling    |
| Utilities  | Pure reusable functions or wrappers                   |
| Connectors | External service clients (e.g., Redis, S3)            |

---

### ✅ 6. Async Handling (MANDATORY)

- Every asynchronous controller method **must** be wrapped with `asyncHandler`:

```ts
@asyncHandler
static async myMethod(req: Request, res: Response) { ... }
```

---

### ✅ 7. Response Pattern (MANDATORY)

- Use `ResponseUtil` for **all** HTTP responses:

```ts
ResponseUtil.success(res, data);
ResponseUtil.error(res, 'Message', 500);
```

---

### ✅ 8. Error Handling (MANDATORY)

- Throw `ApiError` for any error:

```ts
throw new ApiError('Something went wrong', 400);
```

---

### ✅ 9. Security & Validation (MANDATORY)

- All incoming requests must be validated using Joi and `validate` middleware.
- Sensitive data must **never** be logged.
- Rate-limiting, CORS, Helmet, and XSS protections must be applied.

---

### ✅ 10. Code Quality (MANDATORY)

- ESLint must pass with 0 errors.
- Prettier must be applied on every commit.
- TypeScript `strict` mode must remain enabled at all times.
- No `console.log` allowed in production code.

---

## ✅ CRITICAL NOTE:

Any violation of these strict rules must result in immediate code review rejection.

---

## CRITICAL RULES - MUST FOLLOW

### 1. NEVER use process.env directly

- All environment variables MUST go through `env.config.ts`.

### 2. File Naming Convention (STRICT)

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Models: `*.model.ts`
- Routes: `*.routes.ts`
- DTOs: `*.dto.ts`
- Validations: `*.validation.ts`
- Configs: `*.config.ts`
- Utils: `*.util.ts`
- Middleware: `*.middleware.ts`
- Connectors: `*.connector.ts`

### 3. Import Path Rules

- NEVER use relative imports beyond one level: `../../../` ❌
- ALWAYS use path mapping: `@/shared/utils/response.util` ✅

---

## PROJECT STRUCTURE (STRICT ADHERENCE)

```
src/
├── modules/
│   ├── auth/
│   └── user/
├── shared/
│   ├── connectors/
│   ├── middlewares/
│   ├── utils/
│   ├── config/
│   ├── types/
│   └── constants/
├── database/
│   ├── schema.prisma
│   └── migrations/
├── jobs/
├── routes/
├── app.ts
└── server.ts
```

---

## Phase 10: Architectural Enhancements

### 10.1 Request Flow and Logging

- **Request ID Middleware**: A new middleware will be implemented to add a unique `requestId` to every incoming request (`req.id`). This ID will be used for tracing and logging. ✅
- **Morgan HTTP Logger**: `morgan` will be used for detailed HTTP request logging. It will be configured with custom tokens to include the `requestId`, authenticated user's ID, and the client's real IP address. ✅
- **Winston Application Logger**: The main logger (`logger.util.ts`) will be enhanced to automatically include the `requestId` in all log entries, ensuring a clear link between HTTP requests and application-level logs. It will also support an optional DataDog transport for centralized logging in production environments. ✅

### 10.2 Standardized Constants

To ensure consistency and maintainability, the following constant files will be created:

- `app.constants.ts`: For application-wide constants such as pagination defaults, user roles, and sort orders. ✅
- `messages.constants.ts`: For standardized success and error messages used in API responses. ✅

### 10.3 Advanced Error Handling

The `error.middleware.ts` will be refactored into a more robust, multi-stage error handling pipeline:

1.  **Joi Validation Errors**: A dedicated handler for `Joi` validation errors to produce clean, field-specific error messages. ✅
2.  **Prisma Errors**: A handler specifically for Prisma-related errors, using the `prisma-errors.constants.ts` mapping to convert cryptic error codes into user-friendly messages and appropriate HTTP status codes. ✅
3.  **Not Found Errors**: A middleware to handle 404 errors for unknown routes. ✅
4.  **Global Error Handler**: A final, catch-all error handler that logs detailed error information (including stack traces) while preventing sensitive information from being exposed in production responses. ✅

### 10.4 Standardized Response Utility

The `response.util.ts` will be updated to provide a consistent and standardized JSON response structure across the entire API. It will include methods for:

- `success(res, data, message, statusCode)`: For standard successful responses. ✅
- `paginatedSuccess(res, data, message, page, total, limit, statusCode)`: For successful responses that include pagination metadata. ✅
- `error(res, message, statusCode, errors)`: For all error responses, with an optional `errors` field for validation details. ✅

### 10.5 Authentication Enhancements

- **Refresh Token Endpoint**: A new endpoint (`/api/v1/auth/refresh`) will be created to allow clients to obtain a new access token by presenting a valid refresh token.
- **Force Logout Endpoint**: A new endpoint (`/api/v1/auth/force-logout`) will be implemented to allow an administrator to forcibly log out a user, which will invalidate all of their active refresh tokens and blacklist their current access token in Redis.
