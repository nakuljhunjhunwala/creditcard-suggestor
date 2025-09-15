import { prisma } from '@/database/db';
import { logger } from '@/shared/utils/logger.util';

/**
 * Category Mapping Service
 * Ensures AI-generated categories are mapped to our predefined category system
 */

export interface CategoryMapping {
    categoryId: string;
    categoryName: string;
    subCategoryId?: string;
    subCategoryName?: string;
    confidence: number;
}

export interface CategoryMappingResult {
    mapping: CategoryMapping | null;
    isExactMatch: boolean;
    fallbackUsed: boolean;
    originalCategory?: string;
    originalSubCategory?: string;
}

export class CategoryMappingService {
    private categories: Map<string, any> = new Map();
    private subCategories: Map<string, any> = new Map();
    private merchantPatterns: Map<string, { categoryId: string; subCategoryId?: string }> = new Map();
    private initialized = false;

    /**
     * Initialize the mapping service with database data
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const [categories, subCategories, mccCodes] = await Promise.all([
                prisma.category.findMany({
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                    },
                }),
                prisma.subCategory.findMany({
                    select: {
                        id: true,
                        categoryId: true,
                        name: true,
                        slug: true,
                        description: true,
                    },
                }),
                prisma.mCCCode.findMany({
                    select: {
                        categoryId: true,
                        subCategoryId: true,
                        merchantPatterns: true,
                    },
                }),
            ]);

            // Build category maps (ID and name-based lookup)
            categories.forEach(cat => {
                this.categories.set(cat.id, cat);
                this.categories.set(cat.name.toLowerCase(), cat);
                this.categories.set(cat.slug.toLowerCase(), cat);
            });

            // Build subcategory maps (ID and name-based lookup)
            subCategories.forEach(sub => {
                this.subCategories.set(sub.id, sub);
                this.subCategories.set(sub.name.toLowerCase(), sub);
                this.subCategories.set(sub.slug.toLowerCase(), sub);
            });

            // Build merchant pattern mappings from database
            mccCodes.forEach(mcc => {
                if (mcc.merchantPatterns && Array.isArray(mcc.merchantPatterns)) {
                    mcc.merchantPatterns.forEach((pattern: string) => {
                        this.merchantPatterns.set(pattern.toLowerCase(), {
                            categoryId: mcc.categoryId,
                            subCategoryId: mcc.subCategoryId || undefined,
                        });
                    });
                }
            });

            this.initialized = true;
            logger.info('CategoryMappingService initialized successfully', {
                categories: categories.length,
                subCategories: subCategories.length,
                merchantPatterns: this.merchantPatterns.size,
            });
        } catch (error) {
            logger.error('Failed to initialize CategoryMappingService', error);
            throw error;
        }
    }

    /**
     * Map AI-generated category to our predefined categories
     */
    async mapCategory(
        aiCategory: string,
        aiSubCategory?: string,
        mccCode?: string,
    ): Promise<CategoryMappingResult> {
        await this.initialize();

        const normalizedCategory = aiCategory?.toLowerCase().trim();
        const normalizedSubCategory = aiSubCategory?.toLowerCase().trim();

        // Try exact matches first
        let categoryMatch = this.findCategoryMatch(normalizedCategory);
        let subCategoryMatch = normalizedSubCategory
            ? this.findSubCategoryMatch(normalizedSubCategory, categoryMatch?.id)
            : null;

        if (categoryMatch) {
            return {
                mapping: {
                    categoryId: categoryMatch.id,
                    categoryName: categoryMatch.name,
                    subCategoryId: subCategoryMatch?.id,
                    subCategoryName: subCategoryMatch?.name,
                    confidence: subCategoryMatch ? 0.95 : 0.9,
                },
                isExactMatch: true,
                fallbackUsed: false,
                originalCategory: aiCategory,
                originalSubCategory: aiSubCategory,
            };
        }

        // Try merchant pattern matching
        const patternMatch = this.findPatternMatch(normalizedCategory, normalizedSubCategory);
        if (patternMatch) {
            return {
                mapping: patternMatch,
                isExactMatch: false,
                fallbackUsed: false,
                originalCategory: aiCategory,
                originalSubCategory: aiSubCategory,
            };
        }

        // Try MCC-based fallback
        if (mccCode) {
            const mccMatch = await this.findMCCBasedMatch(mccCode);
            if (mccMatch) {
                return {
                    mapping: mccMatch,
                    isExactMatch: false,
                    fallbackUsed: true,
                    originalCategory: aiCategory,
                    originalSubCategory: aiSubCategory,
                };
            }
        }

        // Use "Other" category as final fallback
        const otherCategory = this.categories.get('cat_other');
        if (otherCategory) {
            logger.warn('Using fallback "Other" category', {
                aiCategory,
                aiSubCategory,
                mccCode,
            });

            return {
                mapping: {
                    categoryId: otherCategory.id,
                    categoryName: otherCategory.name,
                    confidence: 0.3,
                },
                isExactMatch: false,
                fallbackUsed: true,
                originalCategory: aiCategory,
                originalSubCategory: aiSubCategory,
            };
        }

        // No match found
        logger.error('No category mapping found', {
            aiCategory,
            aiSubCategory,
            mccCode,
        });

        return {
            mapping: null,
            isExactMatch: false,
            fallbackUsed: true,
            originalCategory: aiCategory,
            originalSubCategory: aiSubCategory,
        };
    }

    /**
     * Get all valid categories for AI prompts
     */
    async getValidCategories(): Promise<{
        categories: Array<{ id: string; name: string; description?: string }>;
        subCategories: Array<{ id: string; name: string; categoryId: string; description?: string }>;
    }> {
        await this.initialize();

        const categories = Array.from(this.categories.values())
            .filter(cat => cat.id) // Only entries with IDs (not aliases)
            .map(cat => ({
                id: cat.id,
                name: cat.name,
                description: cat.description,
            }));

        const subCategories = Array.from(this.subCategories.values())
            .filter(sub => sub.id) // Only entries with IDs (not aliases)
            .map(sub => ({
                id: sub.id,
                name: sub.name,
                categoryId: sub.categoryId,
                description: sub.description,
            }));

        return { categories, subCategories };
    }

    /**
     * Find exact category match
     */
    private findCategoryMatch(normalizedCategory: string): any {
        return this.categories.get(normalizedCategory) || null;
    }

    /**
     * Find subcategory match within a category
     */
    private findSubCategoryMatch(normalizedSubCategory: string, categoryId?: string): any {
        const subCategory = this.subCategories.get(normalizedSubCategory);

        // If category is specified, ensure subcategory belongs to it
        if (subCategory && categoryId && subCategory.categoryId !== categoryId) {
            return null;
        }

        return subCategory || null;
    }

    /**
     * Find match using merchant patterns from database
     */
    private findPatternMatch(normalizedCategory: string, normalizedSubCategory?: string): CategoryMapping | null {
        // Ensure normalizedCategory is valid
        if (!normalizedCategory || typeof normalizedCategory !== 'string') {
            return null;
        }

        // Try direct pattern match first
        let patternMapping = this.merchantPatterns.get(normalizedCategory);

        // If no direct match, try fuzzy matching with merchant patterns
        if (!patternMapping) {
            for (const [pattern, mapping] of this.merchantPatterns.entries()) {
                if (normalizedCategory.includes(pattern) || pattern.includes(normalizedCategory)) {
                    patternMapping = mapping;
                    break;
                }
            }
        }

        if (!patternMapping) return null;

        const category = this.categories.get(patternMapping.categoryId);
        if (!category) return null;

        let subCategory = null;
        if (patternMapping.subCategoryId) {
            subCategory = this.subCategories.get(patternMapping.subCategoryId);
        }

        return {
            categoryId: category.id,
            categoryName: category.name,
            subCategoryId: subCategory?.id,
            subCategoryName: subCategory?.name,
            confidence: 0.8,
        };
    }

    /**
     * Find match based on MCC code
     */
    private async findMCCBasedMatch(mccCode: string): Promise<CategoryMapping | null> {
        try {
            const mccRecord = await prisma.mCCCode.findUnique({
                where: { code: mccCode },
                select: {
                    categoryId: true,
                    subCategoryId: true,
                },
            });

            if (!mccRecord?.categoryId) return null;

            // Get category and subcategory details
            const [category, subCategory] = await Promise.all([
                prisma.category.findUnique({
                    where: { id: mccRecord.categoryId },
                    select: { id: true, name: true },
                }),
                mccRecord.subCategoryId ? prisma.subCategory.findUnique({
                    where: { id: mccRecord.subCategoryId },
                    select: { id: true, name: true },
                }) : null,
            ]);

            if (!category) return null;

            return {
                categoryId: category.id,
                categoryName: category.name,
                subCategoryId: subCategory?.id,
                subCategoryName: subCategory?.name,
                confidence: 0.7,
            };
        } catch (error) {
            logger.error('Error finding MCC-based category match', { mccCode, error });
            return null;
        }
    }

}

// Export singleton instance
export const categoryMappingService = new CategoryMappingService();
