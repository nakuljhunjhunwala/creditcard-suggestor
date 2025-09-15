import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.util';

/**
 * Popular credit cards for recommendation system
 */
const CREDIT_CARDS = [
    // Chase Cards
    {
        id: 'chase_sapphire_preferred',
        name: 'Chase Sapphire Preferred',
        issuer: 'Chase',
        network: 'Visa',
        annualFee: 95.0,
        signupBonus: 60000.0,
        signupSpendReq: 4000.0,
        signupTimeReq: 3,
        defaultCashback: 0.01,
        defaultPoints: 0.01,
        tier: 'premium',
        creditRequirement: 'excellent',
        description:
            'Premium travel rewards card with excellent dining and travel benefits',
        applyUrl:
            'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
        isActive: true,
    },
    {
        id: 'chase_sapphire_reserve',
        name: 'Chase Sapphire Reserve',
        issuer: 'Chase',
        network: 'Visa',
        annualFee: 550.0,
        signupBonus: 60000.0,
        signupSpendReq: 4000.0,
        signupTimeReq: 3,
        defaultCashback: 0.015,
        defaultPoints: 0.015,
        tier: 'premium',
        creditRequirement: 'excellent',
        description:
            'Elite travel card with luxury benefits and high earning rates',
        applyUrl:
            'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
        isActive: true,
    },
    {
        id: 'chase_freedom_unlimited',
        name: 'Chase Freedom Unlimited',
        issuer: 'Chase',
        network: 'Visa',
        annualFee: 0.0,
        signupBonus: 20000.0,
        signupSpendReq: 500.0,
        signupTimeReq: 3,
        defaultCashback: 0.015,
        defaultPoints: 0.015,
        tier: 'standard',
        creditRequirement: 'good',
        description: 'No annual fee card with unlimited 1.5% cash back',
        applyUrl:
            'https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited',
        isActive: true,
    },
    {
        id: 'chase_freedom_flex',
        name: 'Chase Freedom Flex',
        issuer: 'Chase',
        network: 'Mastercard',
        annualFee: 0.0,
        signupBonus: 20000.0,
        signupSpendReq: 500.0,
        signupTimeReq: 3,
        defaultCashback: 0.01,
        defaultPoints: 0.01,
        tier: 'standard',
        creditRequirement: 'good',
        description:
            'Rotating category card with 5% cash back on quarterly categories',
        applyUrl:
            'https://creditcards.chase.com/cash-back-credit-cards/freedom/flex',
        isActive: true,
    },

    // American Express Cards
    {
        id: 'amex_gold',
        name: 'American Express Gold Card',
        issuer: 'American Express',
        network: 'Amex',
        annualFee: 250.0,
        signupBonus: 60000.0,
        signupSpendReq: 4000.0,
        signupTimeReq: 6,
        defaultCashback: 0.01,
        defaultPoints: 0.01,
        tier: 'premium',
        creditRequirement: 'excellent',
        description:
            'Premium dining and grocery card with excellent Membership Rewards earning',
        applyUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
        isActive: true,
    },
    {
        id: 'amex_platinum',
        name: 'The Platinum Card from American Express',
        issuer: 'American Express',
        network: 'Amex',
        annualFee: 695.0,
        signupBonus: 80000.0,
        signupSpendReq: 6000.0,
        signupTimeReq: 6,
        defaultCashback: 0.01,
        defaultPoints: 0.01,
        tier: 'premium',
        creditRequirement: 'excellent',
        description:
            'Ultra-premium card with extensive travel benefits and credits',
        applyUrl: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
        isActive: true,
    },
    {
        id: 'amex_blue_cash_preferred',
        name: 'Blue Cash Preferred Card from American Express',
        issuer: 'American Express',
        network: 'Amex',
        annualFee: 95.0,
        signupBonus: 300.0,
        signupSpendReq: 3000.0,
        signupTimeReq: 6,
        defaultCashback: 0.01,
        defaultPoints: 0.0,
        tier: 'standard',
        creditRequirement: 'good',
        description: 'High cash back on groceries, gas, and streaming services',
        applyUrl:
            'https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/',
        isActive: true,
    },
    {
        id: 'amex_blue_cash_everyday',
        name: 'Blue Cash Everyday Card from American Express',
        issuer: 'American Express',
        network: 'Amex',
        annualFee: 0.0,
        signupBonus: 200.0,
        signupSpendReq: 2000.0,
        signupTimeReq: 6,
        defaultCashback: 0.01,
        defaultPoints: 0.0,
        tier: 'standard',
        creditRequirement: 'good',
        description: 'No annual fee card with tiered cash back rewards',
        applyUrl:
            'https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/',
        isActive: true,
    },

    // Capital One Cards
    {
        id: 'capital_one_venture_x',
        name: 'Capital One Venture X Rewards Credit Card',
        issuer: 'Capital One',
        network: 'Visa',
        annualFee: 395.0,
        signupBonus: 75000.0,
        signupSpendReq: 4000.0,
        signupTimeReq: 3,
        defaultCashback: 0.02,
        defaultPoints: 0.02,
        tier: 'premium',
        creditRequirement: 'excellent',
        description:
            'Premium travel card with 2x miles and excellent travel benefits',
        applyUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        isActive: true,
    },
    {
        id: 'capital_one_savor',
        name: 'Capital One Savor Cash Rewards Credit Card',
        issuer: 'Capital One',
        network: 'Mastercard',
        annualFee: 95.0,
        signupBonus: 300.0,
        signupSpendReq: 3000.0,
        signupTimeReq: 3,
        defaultCashback: 0.01,
        defaultPoints: 0.0,
        tier: 'standard',
        creditRequirement: 'good',
        description:
            'High cash back on dining, entertainment, and popular streaming services',
        applyUrl: 'https://www.capitalone.com/credit-cards/savor-dining-rewards/',
        isActive: true,
    },

    // Citi Cards
    {
        id: 'citi_double_cash',
        name: 'Citi Double Cash Card',
        issuer: 'Citi',
        network: 'Mastercard',
        annualFee: 0.0,
        signupBonus: 200.0,
        signupSpendReq: 1500.0,
        signupTimeReq: 6,
        defaultCashback: 0.02,
        defaultPoints: 0.0,
        tier: 'standard',
        creditRequirement: 'good',
        description:
            'Simple 2% cash back on all purchases - 1% when you buy, 1% when you pay',
        applyUrl: 'https://www.citi.com/credit-cards/citi-double-cash-credit-card',
        isActive: true,
    },
    {
        id: 'citi_premier',
        name: 'Citi Premier Card',
        issuer: 'Citi',
        network: 'Mastercard',
        annualFee: 95.0,
        signupBonus: 80000.0,
        signupSpendReq: 4000.0,
        signupTimeReq: 3,
        defaultCashback: 0.01,
        defaultPoints: 0.01,
        tier: 'premium',
        creditRequirement: 'excellent',
        description: 'Premium rewards card with excellent bonus categories',
        applyUrl: 'https://www.citi.com/credit-cards/citi-premier-credit-card',
        isActive: true,
    },

    // Discover Cards
    {
        id: 'discover_it_cash_back',
        name: 'Discover it Cash Back',
        issuer: 'Discover',
        network: 'Discover',
        annualFee: 0.0,
        signupBonus: 0.0,
        signupSpendReq: 0.0,
        signupTimeReq: 0,
        defaultCashback: 0.01,
        defaultPoints: 0.0,
        tier: 'standard',
        creditRequirement: 'fair',
        description:
            'Rotating 5% cash back categories with cashback match first year',
        applyUrl: 'https://www.discover.com/credit-cards/cash-back/it-card/',
        isActive: true,
    },

    // Wells Fargo Cards
    {
        id: 'wells_fargo_autograph',
        name: 'Wells Fargo Autograph Card',
        issuer: 'Wells Fargo',
        network: 'Visa',
        annualFee: 0.0,
        signupBonus: 20000.0,
        signupSpendReq: 1000.0,
        signupTimeReq: 3,
        defaultCashback: 0.01,
        defaultPoints: 0.01,
        tier: 'standard',
        creditRequirement: 'good',
        description:
            'No annual fee card with 3x points on dining, travel, gas, transit, and phone plans',
        applyUrl: 'https://www.wellsfargo.com/credit-cards/autograph/',
        isActive: true,
    },
] as const;

/**
 * Credit card benefits mapping
 */
interface CardBenefit {
    id: string;
    cardId: string;
    benefitType: string;
    categoryId?: string;
    subCategoryId?: string;
    mccCodes?: string[];
    rate: number;
    maxSpend?: number;
    maxEarning?: number;
    isRotating?: boolean;
    validFrom?: Date;
    validTo?: Date;
    quarterActive?: number[];
    minSpend?: number;
    multiplier?: number;
    title: string;
    description: string;
}

const CARD_BENEFITS: CardBenefit[] = [
    // Chase Sapphire Preferred Benefits
    {
        id: 'csp_dining',
        cardId: 'chase_sapphire_preferred',
        benefitType: 'points',
        categoryId: 'cat_dining',
        rate: 0.02,
        title: '2x points on dining',
        description: 'Earn 2x points on dining at restaurants worldwide',
    },
    {
        id: 'csp_travel',
        cardId: 'chase_sapphire_preferred',
        benefitType: 'points',
        categoryId: 'cat_travel',
        rate: 0.02,
        title: '2x points on travel',
        description: 'Earn 2x points on travel purchases',
    },

    // Chase Sapphire Reserve Benefits
    {
        id: 'csr_dining',
        cardId: 'chase_sapphire_reserve',
        benefitType: 'points',
        categoryId: 'cat_dining',
        rate: 0.03,
        title: '3x points on dining',
        description: 'Earn 3x points on dining at restaurants worldwide',
    },
    {
        id: 'csr_travel',
        cardId: 'chase_sapphire_reserve',
        benefitType: 'points',
        categoryId: 'cat_travel',
        rate: 0.03,
        title: '3x points on travel',
        description: 'Earn 3x points on travel purchases',
    },

    // Chase Freedom Flex Benefits (Rotating Categories)
    {
        id: 'cff_rotating_q1',
        cardId: 'chase_freedom_flex',
        benefitType: 'cashback',
        categoryId: 'cat_grocery',
        rate: 0.05,
        maxSpend: 1500.0,
        isRotating: true,
        quarterActive: [1],
        title: '5% cash back on groceries (Q1)',
        description:
            'Earn 5% cash back on up to $1,500 in grocery purchases per quarter',
    },
    {
        id: 'cff_rotating_q2',
        cardId: 'chase_freedom_flex',
        benefitType: 'cashback',
        categoryId: 'cat_gas',
        rate: 0.05,
        maxSpend: 1500.0,
        isRotating: true,
        quarterActive: [2],
        title: '5% cash back on gas (Q2)',
        description:
            'Earn 5% cash back on up to $1,500 in gas purchases per quarter',
    },
    {
        id: 'cff_rotating_q3',
        cardId: 'chase_freedom_flex',
        benefitType: 'cashback',
        categoryId: 'cat_dining',
        rate: 0.05,
        maxSpend: 1500.0,
        isRotating: true,
        quarterActive: [3],
        title: '5% cash back on dining (Q3)',
        description:
            'Earn 5% cash back on up to $1,500 in dining purchases per quarter',
    },
    {
        id: 'cff_rotating_q4',
        cardId: 'chase_freedom_flex',
        benefitType: 'cashback',
        categoryId: 'cat_shopping',
        rate: 0.05,
        maxSpend: 1500.0,
        isRotating: true,
        quarterActive: [4],
        title: '5% cash back on shopping (Q4)',
        description:
            'Earn 5% cash back on up to $1,500 in online shopping purchases per quarter',
    },

    // American Express Gold Benefits
    {
        id: 'amex_gold_dining',
        cardId: 'amex_gold',
        benefitType: 'points',
        categoryId: 'cat_dining',
        rate: 0.04,
        title: '4x points on dining',
        description:
            'Earn 4x Membership Rewards points on dining at restaurants worldwide',
    },
    {
        id: 'amex_gold_grocery',
        cardId: 'amex_gold',
        benefitType: 'points',
        categoryId: 'cat_grocery',
        rate: 0.04,
        maxSpend: 25000.0,
        title: '4x points on groceries',
        description:
            'Earn 4x Membership Rewards points on up to $25,000 in grocery purchases annually',
    },

    // American Express Platinum Benefits
    {
        id: 'amex_platinum_travel',
        cardId: 'amex_platinum',
        benefitType: 'points',
        categoryId: 'cat_travel',
        mccCodes: ['3000', '3504', '3398'],
        rate: 0.05,
        title: '5x points on flights and hotels',
        description:
            'Earn 5x Membership Rewards points on flights booked directly with airlines or with American Express Travel',
    },

    // American Express Blue Cash Preferred Benefits
    {
        id: 'amex_bcp_grocery',
        cardId: 'amex_blue_cash_preferred',
        benefitType: 'cashback',
        categoryId: 'cat_grocery',
        rate: 0.06,
        maxSpend: 6000.0,
        title: '6% cash back on groceries',
        description:
            'Earn 6% cash back on up to $6,000 in grocery purchases annually',
    },
    {
        id: 'amex_bcp_gas',
        cardId: 'amex_blue_cash_preferred',
        benefitType: 'cashback',
        categoryId: 'cat_gas',
        rate: 0.03,
        maxSpend: 6000.0,
        title: '3% cash back on gas',
        description: 'Earn 3% cash back on up to $6,000 in gas purchases annually',
    },
    {
        id: 'amex_bcp_streaming',
        cardId: 'amex_blue_cash_preferred',
        benefitType: 'cashback',
        categoryId: 'cat_subscription',
        rate: 0.03,
        maxSpend: 6000.0,
        title: '3% cash back on streaming',
        description:
            'Earn 3% cash back on up to $6,000 in streaming subscriptions annually',
    },

    // Capital One Venture X Benefits
    {
        id: 'cap1_venturex_all',
        cardId: 'capital_one_venture_x',
        benefitType: 'miles',
        rate: 0.02,
        title: '2x miles on all purchases',
        description: 'Earn 2x miles on every purchase, every day',
    },

    // Capital One Savor Benefits
    {
        id: 'cap1_savor_dining',
        cardId: 'capital_one_savor',
        benefitType: 'cashback',
        categoryId: 'cat_dining',
        rate: 0.04,
        title: '4% cash back on dining',
        description: 'Earn 4% cash back on dining and entertainment',
    },
    {
        id: 'cap1_savor_entertainment',
        cardId: 'capital_one_savor',
        benefitType: 'cashback',
        categoryId: 'cat_entertainment',
        rate: 0.04,
        title: '4% cash back on entertainment',
        description:
            'Earn 4% cash back on entertainment and popular streaming services',
    },
    {
        id: 'cap1_savor_grocery',
        cardId: 'capital_one_savor',
        benefitType: 'cashback',
        categoryId: 'cat_grocery',
        rate: 0.02,
        title: '2% cash back on groceries',
        description: 'Earn 2% cash back on grocery purchases',
    },

    // Citi Premier Benefits
    {
        id: 'citi_premier_dining',
        cardId: 'citi_premier',
        benefitType: 'points',
        categoryId: 'cat_dining',
        rate: 0.03,
        title: '3x points on dining',
        description: 'Earn 3x ThankYou Points on dining',
    },
    {
        id: 'citi_premier_grocery',
        cardId: 'citi_premier',
        benefitType: 'points',
        categoryId: 'cat_grocery',
        rate: 0.03,
        title: '3x points on groceries',
        description: 'Earn 3x ThankYou Points on grocery purchases',
    },
    {
        id: 'citi_premier_gas',
        cardId: 'citi_premier',
        benefitType: 'points',
        categoryId: 'cat_gas',
        rate: 0.03,
        title: '3x points on gas',
        description: 'Earn 3x ThankYou Points on gas purchases',
    },
    {
        id: 'citi_premier_travel',
        cardId: 'citi_premier',
        benefitType: 'points',
        categoryId: 'cat_travel',
        rate: 0.03,
        title: '3x points on travel',
        description: 'Earn 3x ThankYou Points on air travel and hotels',
    },

    // Discover it Cash Back Benefits (Rotating Categories)
    {
        id: 'discover_rotating_q1',
        cardId: 'discover_it_cash_back',
        benefitType: 'cashback',
        categoryId: 'cat_grocery',
        rate: 0.05,
        maxSpend: 1500.0,
        isRotating: true,
        quarterActive: [1],
        title: '5% cash back on groceries (Q1)',
        description:
            'Earn 5% cash back on up to $1,500 in grocery purchases per quarter',
    },
    {
        id: 'discover_rotating_q2',
        cardId: 'discover_it_cash_back',
        benefitType: 'cashback',
        categoryId: 'cat_gas',
        rate: 0.05,
        maxSpend: 1500.0,
        isRotating: true,
        quarterActive: [2],
        title: '5% cash back on gas (Q2)',
        description:
            'Earn 5% cash back on up to $1,500 in gas purchases per quarter',
    },

    // Wells Fargo Autograph Benefits
    {
        id: 'wf_autograph_dining',
        cardId: 'wells_fargo_autograph',
        benefitType: 'points',
        categoryId: 'cat_dining',
        rate: 0.03,
        title: '3x points on dining',
        description: 'Earn 3x points on dining purchases',
    },
    {
        id: 'wf_autograph_travel',
        cardId: 'wells_fargo_autograph',
        benefitType: 'points',
        categoryId: 'cat_travel',
        rate: 0.03,
        title: '3x points on travel',
        description: 'Earn 3x points on travel purchases',
    },
    {
        id: 'wf_autograph_gas',
        cardId: 'wells_fargo_autograph',
        benefitType: 'points',
        categoryId: 'cat_gas',
        rate: 0.03,
        title: '3x points on gas',
        description: 'Earn 3x points on gas purchases',
    },
    {
        id: 'wf_autograph_transit',
        cardId: 'wells_fargo_autograph',
        benefitType: 'points',
        categoryId: 'cat_transport',
        rate: 0.03,
        title: '3x points on transit',
        description: 'Earn 3x points on transit purchases',
    },
] as const;

/**
 * Seed credit cards
 */
export async function seedCreditCards(prisma: PrismaClient): Promise<void> {
    try {
        for (const creditCard of CREDIT_CARDS) {
            await prisma.creditCard.upsert({
                where: { id: creditCard.id },
                update: {
                    name: creditCard.name,
                    issuer: creditCard.issuer,
                    network: creditCard.network,
                    annualFee: creditCard.annualFee,
                    signupBonus: creditCard.signupBonus,
                    signupSpendReq: creditCard.signupSpendReq,
                    signupTimeReq: creditCard.signupTimeReq,
                    defaultCashback: creditCard.defaultCashback,
                    defaultPoints: creditCard.defaultPoints,
                    tier: creditCard.tier,
                    creditRequirement: creditCard.creditRequirement,
                    description: creditCard.description,
                    applyUrl: creditCard.applyUrl,
                    isActive: creditCard.isActive,
                },
                create: {
                    id: creditCard.id,
                    name: creditCard.name,
                    issuer: creditCard.issuer,
                    network: creditCard.network,
                    annualFee: creditCard.annualFee,
                    signupBonus: creditCard.signupBonus,
                    signupSpendReq: creditCard.signupSpendReq,
                    signupTimeReq: creditCard.signupTimeReq,
                    defaultCashback: creditCard.defaultCashback,
                    defaultPoints: creditCard.defaultPoints,
                    tier: creditCard.tier,
                    creditRequirement: creditCard.creditRequirement,
                    description: creditCard.description,
                    applyUrl: creditCard.applyUrl,
                    isActive: creditCard.isActive,
                },
            });
        }

        logger.info(`✅ Successfully seeded ${CREDIT_CARDS.length} credit cards`);
    } catch (error) {
        logger.error('❌ Error seeding credit cards:', error);
        throw error;
    }
}

/**
 * Seed card benefits
 */
export async function seedCardBenefits(prisma: PrismaClient): Promise<void> {
    try {
        for (const benefit of CARD_BENEFITS) {
            await prisma.cardBenefit.upsert({
                where: { id: benefit.id },
                update: {
                    cardId: benefit.cardId,
                    benefitType: benefit.benefitType,
                    categoryId: benefit.categoryId ?? null,
                    mccCodes: benefit.mccCodes ?? [],
                    rate: benefit.rate,
                    maxSpend: benefit.maxSpend ?? null,
                    isRotating: benefit.isRotating ?? false,
                    quarterActive: benefit.quarterActive ?? [],
                    title: benefit.title,
                    description: benefit.description,
                },
                create: {
                    id: benefit.id,
                    cardId: benefit.cardId,
                    benefitType: benefit.benefitType,
                    categoryId: benefit.categoryId ?? null,
                    mccCodes: benefit.mccCodes ?? [],
                    rate: benefit.rate,
                    maxSpend: benefit.maxSpend ?? null,
                    isRotating: benefit.isRotating ?? false,
                    quarterActive: benefit.quarterActive ?? [],
                    title: benefit.title,
                    description: benefit.description,
                },
            });
        }

        logger.info(`✅ Successfully seeded ${CARD_BENEFITS.length} card benefits`);
    } catch (error) {
        logger.error('❌ Error seeding card benefits:', error);
        throw error;
    }
}
