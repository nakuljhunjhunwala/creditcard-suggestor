import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations

  var prisma: PrismaClient | undefined;
}

// Configure database URL with connection pool settings
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Add connection pool parameters to prevent exhaustion
  const url = new URL(baseUrl);
  url.searchParams.set('connection_limit', '6'); // Limit concurrent connections
  url.searchParams.set('pool_timeout', '10'); // Connection timeout in seconds

  return url.toString();
};

export const prisma =
  global.prisma ??
  new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
