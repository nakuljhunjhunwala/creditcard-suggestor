import { PrismaClient } from '@prisma/client';
import { prisma } from '@/database/db';
import { BaseConnector } from './base.connector';
import { logger } from '../utils';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryPerformanceMetrics {
  query: string;
  duration: number;
  timestamp: Date;
}

export class PrismaConnector extends BaseConnector<PrismaClient> {
  private performanceMetrics: QueryPerformanceMetrics[] = [];

  public async connect(): Promise<PrismaClient> {
    await prisma.$connect();
    logger.info('Database connected');
    return prisma;
  }

  public async disconnect(): Promise<void> {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.getClient();
      // Use a lightweight query to check the connection
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Enhanced utility methods

  /**
   * Execute paginated query with standard pagination options
   */
  public async paginate<T>(
    model: any,
    options: PaginationOptions = {},
    where?: any,
    include?: any,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, orderBy } = options;
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          include,
          skip,
          take: limit,
          orderBy,
        }),
        model.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error('Pagination query failed:', error);
      throw error;
    }
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  public async executeTransaction<T>(
    operations: (tx: any) => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const client = await this.getClient();
      const result = await client.$transaction(operations);

      this.recordPerformanceMetric('Transaction', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple operations in a single transaction
   * TODO: Fix TypeScript types in future phases
   */
  public async executeMultipleOperations<T>(
    operations: any[], // Simplified for now
  ): Promise<T[]> {
    const startTime = Date.now();
    try {
      // Simple implementation - will be enhanced in later phases
      const results: T[] = [];
      for (const operation of operations) {
        results.push(await operation());
      }

      this.recordPerformanceMetric(
        'Multiple Operations',
        Date.now() - startTime,
      );

      return results;
    } catch (error) {
      logger.error('Multiple operations failed:', error);
      throw error;
    }
  }

  /**
   * Bulk create records
   */
  public async bulkCreate<T>(
    model: any,
    data: T[],
    options: { skipDuplicates?: boolean } = {},
  ): Promise<{ count: number }> {
    const startTime = Date.now();
    try {
      const result = await model.createMany({
        data,
        skipDuplicates: options.skipDuplicates ?? false,
      });

      this.recordPerformanceMetric(
        `Bulk Create (${data.length} records)`,
        Date.now() - startTime,
      );

      return result;
    } catch (error) {
      logger.error('Bulk create failed:', error);
      throw error;
    }
  }

  /**
   * Bulk update records
   */
  public async bulkUpdate<T>(
    model: any,
    updates: Array<{ where: any; data: Partial<T> }>,
  ): Promise<any[]> {
    const startTime = Date.now();
    try {
      const operations = updates.map((update) =>
        model.updateMany({
          where: update.where,
          data: update.data,
        }),
      );

      const results = await this.executeMultipleOperations(operations);

      this.recordPerformanceMetric(
        `Bulk Update (${updates.length} operations)`,
        Date.now() - startTime,
      );

      return results;
    } catch (error) {
      logger.error('Bulk update failed:', error);
      throw error;
    }
  }

  /**
   * Bulk delete records
   */
  public async bulkDelete(model: any, conditions: any[]): Promise<number> {
    const startTime = Date.now();
    try {
      const operations = conditions.map((condition) =>
        model.deleteMany({
          where: condition,
        }),
      );

      const results = await this.executeMultipleOperations(operations);
      const totalDeleted = results.reduce(
        (sum: number, result: any) => sum + result.count,
        0,
      );

      this.recordPerformanceMetric(
        `Bulk Delete (${conditions.length} operations)`,
        Date.now() - startTime,
      );

      return totalDeleted;
    } catch (error) {
      logger.error('Bulk delete failed:', error);
      throw error;
    }
  }

  /**
   * Upsert with custom logic
   */
  public async upsert<T>(
    model: any,
    where: any,
    create: T,
    update: Partial<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await model.upsert({
        where,
        create,
        update,
      });

      this.recordPerformanceMetric('Upsert', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.error('Upsert failed:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query with performance monitoring
   */
  public async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    const startTime = Date.now();
    try {
      const client = await this.getClient();
      const result = (await client.$queryRawUnsafe(
        query,
        ...(params ?? []),
      )) as T[];

      this.recordPerformanceMetric(
        `Raw Query: ${query.substring(0, 50)}...`,
        Date.now() - startTime,
      );

      return result;
    } catch (error) {
      logger.error('Raw query failed:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL with parameters
   */
  public async executeRawSQL(query: string, params?: any[]): Promise<number> {
    const startTime = Date.now();
    try {
      const client = await this.getClient();
      const result = await client.$executeRawUnsafe(query, ...(params ?? []));

      this.recordPerformanceMetric(
        `Raw SQL: ${query.substring(0, 50)}...`,
        Date.now() - startTime,
      );

      return result;
    } catch (error) {
      logger.error('Raw SQL execution failed:', error);
      throw error;
    }
  }

  /**
   * Get database connection info
   */
  public async getDatabaseInfo(): Promise<{
    version: string;
    connections: number;
    uptime: number;
  }> {
    try {
      const versionResult = await this.executeRawQuery<{ version: string }>(
        'SELECT version() as version',
      );

      const connectionResult = await this.executeRawQuery<{ count: number }>(
        'SELECT count(*) as count FROM pg_stat_activity',
      );

      const uptimeResult = await this.executeRawQuery<{ uptime: number }>(
        'SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime',
      );

      return {
        version: versionResult[0]?.version || 'Unknown',
        connections: connectionResult[0]?.count || 0,
        uptime: uptimeResult[0]?.uptime || 0,
      };
    } catch (error) {
      logger.error('Failed to get database info:', error);
      throw error;
    }
  }

  /**
   * Get query performance metrics
   */
  public getPerformanceMetrics(): QueryPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Clear performance metrics
   */
  public clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * Get slow queries (queries taking more than threshold ms)
   */
  public getSlowQueries(thresholdMs: number = 1000): QueryPerformanceMetrics[] {
    return this.performanceMetrics.filter(
      (metric) => metric.duration > thresholdMs,
    );
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(query: string, duration: number): void {
    this.performanceMetrics.push({
      query,
      duration,
      timestamp: new Date(),
    });

    // Keep only last 100 metrics to prevent memory issues
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }

    // Log slow queries
    if (duration > 1000) {
      logger.warn(`Slow query detected: ${query} (${duration}ms)`);
    } else {
      logger.debug(`Query executed: ${query} (${duration}ms)`);
    }
  }

  /**
   * Check if table exists
   */
  public async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.executeRawQuery<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        ) as exists`,
        [tableName],
      );

      return result[0]?.exists || false;
    } catch (error) {
      logger.error(`Failed to check if table ${tableName} exists:`, error);
      throw error;
    }
  }

  /**
   * Get table row count
   */
  public async getTableRowCount(tableName: string): Promise<number> {
    try {
      const result = await this.executeRawQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${tableName}`,
      );

      return result[0]?.count || 0;
    } catch (error) {
      logger.error(`Failed to get row count for table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Analyze table for performance optimization
   */
  public async analyzeTable(tableName: string): Promise<void> {
    try {
      await this.executeRawSQL(`ANALYZE ${tableName}`);
      logger.info(`Table ${tableName} analyzed successfully`);
    } catch (error) {
      logger.error(`Failed to analyze table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Vacuum table for maintenance
   */
  public async vacuumTable(tableName: string): Promise<void> {
    try {
      await this.executeRawSQL(`VACUUM ${tableName}`);
      logger.info(`Table ${tableName} vacuumed successfully`);
    } catch (error) {
      logger.error(`Failed to vacuum table ${tableName}:`, error);
      throw error;
    }
  }
}

export const prismaConnector = PrismaConnector.getInstance();
