import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.util';

/**
 * Common merchant aliases to improve fuzzy matching accuracy
 * These help map various merchant name formats to proper MCC codes
 */
const MERCHANT_ALIASES = [
  // Fast Food Chains
  {
    id: 'alias_mcdonalds',
    merchantName: 'MCDONALDS',
    aliases: [
      "McDonald's",
      'MCDONALD',
      'MCD',
      "MCDONALD'S",
      'MCDONALDS #',
      'MCDONALDS CORP',
      'MC DONALDS',
      'MACDONALD',
      'MCDS',
    ],
    mccCode: '5814',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_starbucks',
    merchantName: 'STARBUCKS',
    aliases: [
      'Starbucks',
      'STARBUCKS COFFEE',
      'STARBUCKS CORP',
      'SBUX',
      'STARBUCKS STORE',
      'STARBUCKS #',
      'STAR BUCKS',
    ],
    mccCode: '5499',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_subway',
    merchantName: 'SUBWAY',
    aliases: [
      'Subway',
      'SUBWAY SANDWICHES',
      'SUBWAY #',
      'SUBWAY RESTAURANT',
      'SUB WAY',
    ],
    mccCode: '5814',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_burger_king',
    merchantName: 'BURGER_KING',
    aliases: [
      'Burger King',
      'BURGER KING',
      'BK',
      'BURGER KING #',
      'BURGER KING CORP',
      'BURGERKING',
    ],
    mccCode: '5814',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_taco_bell',
    merchantName: 'TACO_BELL',
    aliases: ['Taco Bell', 'TACO BELL', 'TACO BELL #', 'TACOBELL', 'TB'],
    mccCode: '5814',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Grocery Stores
  {
    id: 'alias_walmart',
    merchantName: 'WALMART',
    aliases: [
      'Walmart',
      'WAL-MART',
      'WALMART SUPERCENTER',
      'WALMART #',
      'WAL MART',
      'WMART',
      'WALMART STORE',
    ],
    mccCode: '5411',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_target',
    merchantName: 'TARGET',
    aliases: ['Target', 'TARGET CORP', 'TARGET #', 'TARGET STORE', 'TGT'],
    mccCode: '5411',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_kroger',
    merchantName: 'KROGER',
    aliases: ['Kroger', 'THE KROGER CO', 'KROGER #', 'KROGERS'],
    mccCode: '5411',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_safeway',
    merchantName: 'SAFEWAY',
    aliases: ['Safeway', 'SAFEWAY INC', 'SAFEWAY #', 'SAFE WAY'],
    mccCode: '5411',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_costco',
    merchantName: 'COSTCO',
    aliases: [
      'Costco',
      'COSTCO WHOLESALE',
      'COSTCO #',
      'COSTCO WHOLESALE CORP',
      'COSTCO GAS',
      'COSTCO GASOLINE',
    ],
    mccCode: '5300',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Gas Stations
  {
    id: 'alias_shell',
    merchantName: 'SHELL',
    aliases: ['Shell', 'SHELL OIL', 'SHELL GAS', 'SHELL #', 'SHELL STATION'],
    mccCode: '5542',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_exxon',
    merchantName: 'EXXON',
    aliases: ['Exxon', 'EXXON MOBIL', 'EXXONMOBIL', 'EXXON #', 'ESSO'],
    mccCode: '5542',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_chevron',
    merchantName: 'CHEVRON',
    aliases: ['Chevron', 'CHEVRON #', 'CHEVRON STATION', 'CHEVRON CORP'],
    mccCode: '5542',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_bp',
    merchantName: 'BP',
    aliases: ['BP', 'BP GAS', 'BP #', 'BP STATION', 'BRITISH PETROLEUM'],
    mccCode: '5542',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Airlines
  {
    id: 'alias_american_airlines',
    merchantName: 'AMERICAN_AIRLINES',
    aliases: [
      'American Airlines',
      'AMERICAN AIR',
      'AA',
      'AMR CORP',
      'AMERICAN AIRLINE',
    ],
    mccCode: '3000',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_delta',
    merchantName: 'DELTA',
    aliases: ['Delta', 'DELTA AIR LINES', 'DELTA AIRLINES', 'DAL', 'DELTA AIR'],
    mccCode: '3000',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_united',
    merchantName: 'UNITED_AIRLINES',
    aliases: ['United Airlines', 'UNITED AIR', 'UAL', 'UNITED'],
    mccCode: '3000',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_southwest',
    merchantName: 'SOUTHWEST_AIRLINES',
    aliases: ['Southwest Airlines', 'SOUTHWEST AIR', 'SWA', 'LUV', 'SOUTHWEST'],
    mccCode: '3000',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Hotels
  {
    id: 'alias_marriott',
    merchantName: 'MARRIOTT',
    aliases: [
      'Marriott',
      'MARRIOTT HOTEL',
      'MARRIOTT INTL',
      'MARRIOTT INTERNATIONAL',
      'MAR',
    ],
    mccCode: '3504',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_hilton',
    merchantName: 'HILTON',
    aliases: ['Hilton', 'HILTON HOTEL', 'HILTON HOTELS', 'HLT'],
    mccCode: '3504',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Rideshare/Transportation
  {
    id: 'alias_uber',
    merchantName: 'UBER',
    aliases: [
      'Uber',
      'UBER TECHNOLOGIES',
      'UBER TRIP',
      'UBER BV',
      'UBER RIDES',
    ],
    mccCode: '4121',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_lyft',
    merchantName: 'LYFT',
    aliases: ['Lyft', 'LYFT INC', 'LYFT RIDE'],
    mccCode: '4121',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Online Shopping
  {
    id: 'alias_amazon',
    merchantName: 'AMAZON',
    aliases: [
      'Amazon',
      'AMAZON.COM',
      'AMAZON PRIME',
      'AMZ',
      'AMAZON MARKETPLACE',
      'AMAZON PAYMENTS',
      'AMAZON WEB SERVICES',
      'AWS',
    ],
    mccCode: '5399',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Streaming Services
  {
    id: 'alias_netflix',
    merchantName: 'NETFLIX',
    aliases: ['Netflix', 'NETFLIX.COM', 'NETFLIX INC', 'NFLX'],
    mccCode: '5815',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_spotify',
    merchantName: 'SPOTIFY',
    aliases: ['Spotify', 'SPOTIFY USA', 'SPOTIFY AB', 'SPOT'],
    mccCode: '5815',
    confidence: 0.98,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Pharmacies
  {
    id: 'alias_cvs',
    merchantName: 'CVS',
    aliases: ['CVS', 'CVS PHARMACY', 'CVS #', 'CVS HEALTH', 'CVS CAREMARK'],
    mccCode: '5912',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
  {
    id: 'alias_walgreens',
    merchantName: 'WALGREENS',
    aliases: ['Walgreens', 'WALGREEN', 'WALGREENS #', 'WAG'],
    mccCode: '5912',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },

  // Convenience Stores
  {
    id: 'alias_7eleven',
    merchantName: '7_ELEVEN',
    aliases: ['7-Eleven', '7 ELEVEN', '7-11', 'SEVEN ELEVEN', '711'],
    mccCode: '5499',
    confidence: 0.95,
    usageCount: 0,
    createdBy: 'initial_seed',
  },
] as const;

/**
 * Seed merchant aliases
 */
export async function seedMerchantAliases(prisma: PrismaClient): Promise<void> {
  try {
    for (const alias of MERCHANT_ALIASES) {
      await prisma.merchantAlias.upsert({
        where: { id: alias.id },
        update: {
          merchantName: alias.merchantName,
          aliases: [...alias.aliases],
          mccCode: alias.mccCode,
          confidence: alias.confidence,
          usageCount: alias.usageCount,
          createdBy: alias.createdBy,
        },
        create: {
          id: alias.id,
          merchantName: alias.merchantName,
          aliases: [...alias.aliases],
          mccCode: alias.mccCode,
          confidence: alias.confidence,
          usageCount: alias.usageCount,
          createdBy: alias.createdBy,
        },
      });
    }

    logger.info(
      `✅ Successfully seeded ${MERCHANT_ALIASES.length} merchant aliases`,
    );
  } catch (error) {
    logger.error('❌ Error seeding merchant aliases:', error);
    throw error;
  }
}
