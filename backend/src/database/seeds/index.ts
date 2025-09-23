import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.util';
import { seedCategories, seedSubCategories } from './categories.seed';
import { seedIndianMCCCodes } from './mcc-codes.seed';
import { seedIndianCreditCards } from './credit-cards.seed';
import { seedAppConfig } from './app-config.seed';
import { seedIndianMerchantAliases } from './merchant-aliases.seed';

const prisma = new PrismaClient();

/**
 * Main seeding function for Credit Card Recommendation System
 */
async function main(): Promise<void> {
  logger.info(
    '🌱 Starting Credit Card Recommendation System database seeding...',
  );

  try {
    // 1. Seed Categories and Subcategories
    logger.info('📂 Seeding categories and subcategories...');
    await seedCategories(prisma);
    await seedSubCategories(prisma);

    // 2. Seed MCC Codes
    logger.info('🏷️  Seeding MCC codes...');
    await seedIndianMCCCodes(prisma);

    // 3. Seed Indian Credit Cards
    logger.info('💳 Seeding Indian credit cards...');
    await seedIndianCreditCards(prisma);

    // 4. Seed App Configuration
    logger.info('⚙️  Seeding app configuration...');
    await seedAppConfig(prisma);

    // 5. Seed Merchant Aliases
    logger.info('🏪 Seeding merchant aliases...');
    await seedIndianMerchantAliases(prisma);

    logger.info(
      '✅ Credit Card Recommendation System database seeding completed successfully!',
    );

    // Print summary
    const summary = await getDatabaseSummary();
    logger.info('📊 Database Summary:', summary);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get database seeding summary
 */
async function getDatabaseSummary() {
  try {
    const [
      categoriesCount,
      subCategoriesCount,
      mccCodesCount,
      creditCardsCount,
      cardCategoriesCount,
      cardSubCategoriesCount,
      cardNetworksCount,
      cardIssuersCount,
      rewardCategoriesCount,
      acceleratedRewardsCount,
      appConfigCount,
      merchantAliasesCount,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.subCategory.count(),
      prisma.mCCCode.count(),
      prisma.creditCard.count(),
      prisma.cardCategory.count(),
      prisma.cardSubCategory.count(),
      prisma.cardNetwork.count(),
      prisma.cardIssuer.count(),
      prisma.rewardCategory.count(),
      prisma.acceleratedReward.count(),
      prisma.appConfig.count(),
      prisma.merchantAlias.count(),
    ]);

    return {
      categories: categoriesCount,
      subCategories: subCategoriesCount,
      mccCodes: mccCodesCount,
      creditCards: creditCardsCount,
      cardCategories: cardCategoriesCount,
      cardSubCategories: cardSubCategoriesCount,
      cardNetworks: cardNetworksCount,
      cardIssuers: cardIssuersCount,
      rewardCategories: rewardCategoriesCount,
      acceleratedRewards: acceleratedRewardsCount,
      appConfig: appConfigCount,
      merchantAliases: merchantAliasesCount,
    };
  } catch (error) {
    logger.error('Error getting database summary:', error);
    return {};
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      logger.info('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export { main as seedDatabase };
