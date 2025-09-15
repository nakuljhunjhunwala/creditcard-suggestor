# Express TypeScript Boilerplate

A robust, production-ready boilerplate for building RESTful APIs with Express, TypeScript, and Prisma. This boilerplate is designed to be highly scalable, maintainable, and developer-friendly, incorporating best practices for modern web development.

## Features

- **TypeScript First:** Fully written in TypeScript for type safety and improved developer experience.
- **Structured Logging:** Centralized logging with Winston.
- **Configuration Management:** Environment-based configuration using Zod for validation.
- **Database ORM:** Prisma for seamless database integration and management.
- **Authentication & Authorization:** JWT-based authentication and refresh token mechanism.
- **Middleware:** Includes essential middlewares like error handling, request logging, validation, and security headers.
- **Dependency Injection:** Organized project structure with connectors for services like Redis.
- **Background Jobs:** Cron job support for scheduled tasks.
- **API Documentation:** Automated API documentation with Swagger (JSDoc).
- **Health Checks:** Detailed health check endpoints for monitoring service status.
- **Graceful Shutdown:** Handles graceful server shutdown.
- **Code Quality:** Configured with ESLint and Prettier for consistent code style.

## Project Structure

```
.
├── src/
│   ├── app.ts                  # Express application setup
│   ├── server.ts               # Server initialization and graceful shutdown
│   ├── database/
│   │   ├── schema.prisma       # Prisma schema
│   │   └── db.ts               # Prisma client instance
│   ├── jobs/                   # Background jobs (cron)
│   ├── modules/                # Business logic modules (auth, user)
│   │   ├── auth/
│   │   └── user/
│   ├── routes/                 # API routes
│   │   └── index.ts            # Central route registration
│   └── shared/                 # Shared utilities and configurations
│       ├── config/             # Environment, Swagger configuration
│       ├── connectors/         # Service connectors (Redis, Prisma)
│       ├── constants/          # Application constants
│       ├── middlewares/        # Custom Express middlewares
│       ├── types/              # Global TypeScript types
│       └── utils/              # Utility functions
├── planning.md                 # Project planning document
├── task.md                     # Task tracker for development
└── ...
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) (for PostgreSQL and Redis)
- [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd new-node-boiler-plate
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Setup environment variables:**
    Create a `.env` file in the root directory and add the necessary environment variables. You can use `.env.example` as a template.

    ```bash
    cp .env.example .env
    ```

4.  **Start the database and Redis using Docker:**

    ```bash
    docker-compose up -d
    ```

5.  **Run Prisma migrations:**
    ```bash
    npx prisma migrate dev
    ```

### Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

- `NODE_ENV`: Application environment (e.g., `development`, `production`)
- `PORT`: Port to run the server on (e.g., `3000`)
- `CORS_ORIGIN`: Allowed CORS origins
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for signing JWTs
- `JWT_ACCESS_EXPIRATION_MINUTES`: JWT access token expiration time
- `JWT_REFRESH_EXPIRATION_DAYS`: JWT refresh token expiration time
- `API_VERSION`: API version (e.g., `v1`)

### Running the Application

- **Development mode:**

  ```bash
  npm run dev
  ```

- **Production mode:**
  ```bash
  npm run build
  npm run start
  ```

### API Documentation

Once the server is running, you can access the Swagger API documentation at `http://localhost:3000/api/v1/docs`.

## License

This project is licensed under the MIT License.
