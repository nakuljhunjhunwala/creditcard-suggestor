import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.util';

/**
 * Comprehensive Indian Credit Cards Database - Consistent Structure
 * All reward rates normalized to percentage for easy calculation and comparison
 * Based on original spending categories seed structure with card-specific adaptations
 */

/**
 * Card Categories (similar to spending categories structure)
 */
const CARD_CATEGORIES = [
    {
        id: 'cat_cashback',
        name: 'Cashback Cards',
        slug: 'cashback',
        description: 'Cards offering direct cashback on purchases without complex redemption',
        iconName: 'percent',
        color: '#22C55E',
        sortOrder: 10,
    },
    {
        id: 'cat_rewards_points',
        name: 'Rewards Points Cards',
        slug: 'rewards-points',
        description: 'Cards offering points that can be redeemed for various benefits',
        iconName: 'gift',
        color: '#3B82F6',
        sortOrder: 20,
    },
    {
        id: 'cat_travel_miles',
        name: 'Travel & Miles Cards',
        slug: 'travel-miles',
        description: 'Cards optimized for travel benefits and airline miles',
        iconName: 'plane',
        color: '#8B5CF6',
        sortOrder: 30,
    },
    {
        id: 'cat_premium_lifestyle',
        name: 'Premium Lifestyle Cards',
        slug: 'premium-lifestyle',
        description: 'High-end cards with luxury benefits and concierge services',
        iconName: 'crown',
        color: '#F59E0B',
        sortOrder: 40,
    },
    {
        id: 'cat_cobranded',
        name: 'Co-branded Cards',
        slug: 'cobranded',
        description: 'Cards issued in partnership with specific brands or merchants',
        iconName: 'link-2',
        color: '#EF4444',
        sortOrder: 50,
    },
] as const;

/**
 * Card Sub-categories for detailed classification
 */
const CARD_SUBCATEGORIES = [
    // Cashback subcategories
    {
        id: 'subcat_unrestricted_cashback',
        categoryId: 'cat_cashback',
        name: 'Unrestricted Cashback',
        slug: 'unrestricted-cashback',
        description: 'Cards offering cashback on all or most categories without merchant restrictions',
        sortOrder: 10,
    },
    {
        id: 'subcat_category_cashback',
        categoryId: 'cat_cashback',
        name: 'Category-specific Cashback',
        slug: 'category-cashback',
        description: 'Cards offering higher cashback on specific spending categories',
        sortOrder: 20,
    },
    {
        id: 'subcat_cobranded_cashback',
        categoryId: 'cat_cashback',
        name: 'Co-branded Cashback',
        slug: 'cobranded-cashback',
        description: 'Cashback cards tied to specific brands or merchants',
        sortOrder: 30,
    },

    // Rewards Points subcategories
    {
        id: 'subcat_lifestyle_rewards',
        categoryId: 'cat_rewards_points',
        name: 'Lifestyle Rewards',
        slug: 'lifestyle-rewards',
        description: 'Cards offering points on dining, entertainment, and lifestyle spends',
        sortOrder: 10,
    },
    {
        id: 'subcat_shopping_rewards',
        categoryId: 'cat_rewards_points',
        name: 'Shopping Rewards',
        slug: 'shopping-rewards',
        description: 'Cards optimized for online and retail shopping rewards',
        sortOrder: 20,
    },
    {
        id: 'subcat_multi_category_rewards',
        categoryId: 'cat_rewards_points',
        name: 'Multi-category Rewards',
        slug: 'multi-category-rewards',
        description: 'Cards offering balanced rewards across multiple categories',
        sortOrder: 30,
    },

    // Travel & Miles subcategories
    {
        id: 'subcat_airline_miles',
        categoryId: 'cat_travel_miles',
        name: 'Airline Miles',
        slug: 'airline-miles',
        description: 'Cards offering airline miles and aviation-specific benefits',
        sortOrder: 10,
    },
    {
        id: 'subcat_hotel_points',
        categoryId: 'cat_travel_miles',
        name: 'Hotel Points',
        slug: 'hotel-points',
        description: 'Cards offering hotel loyalty points and accommodation benefits',
        sortOrder: 20,
    },
    {
        id: 'subcat_general_travel',
        categoryId: 'cat_travel_miles',
        name: 'General Travel',
        slug: 'general-travel',
        description: 'Cards with comprehensive travel benefits and flexible redemption',
        sortOrder: 30,
    },

    // Premium Lifestyle subcategories
    {
        id: 'subcat_super_premium',
        categoryId: 'cat_premium_lifestyle',
        name: 'Super Premium',
        slug: 'super-premium',
        description: 'Ultra-high-end cards with exclusive privileges and unlimited benefits',
        sortOrder: 10,
    },
    {
        id: 'subcat_premium_travel',
        categoryId: 'cat_premium_lifestyle',
        name: 'Premium Travel',
        slug: 'premium-travel',
        description: 'Premium cards focused on luxury travel experiences',
        sortOrder: 20,
    },
    {
        id: 'subcat_premium_lifestyle',
        categoryId: 'cat_premium_lifestyle',
        name: 'Premium Lifestyle',
        slug: 'premium-lifestyle-general',
        description: 'Premium cards focused on lifestyle and entertainment benefits',
        sortOrder: 30,
    },
] as const;

/**
 * Card Networks
 */
const CARD_NETWORKS = [
    {
        id: 'network_visa',
        name: 'Visa',
        slug: 'visa',
        description: 'Global payment network with wide acceptance',
        iconName: 'credit-card',
        color: '#1A1F71',
        isActive: true,
    },
    {
        id: 'network_mastercard',
        name: 'Mastercard',
        slug: 'mastercard',
        description: 'Global payment network with premium benefits',
        iconName: 'credit-card',
        color: '#CC0000',
        isActive: true,
    },
    {
        id: 'network_rupay',
        name: 'RuPay',
        slug: 'rupay',
        description: 'Indian domestic payment network with UPI integration',
        iconName: 'credit-card',
        color: '#00A651',
        isActive: true,
    },
    {
        id: 'network_amex',
        name: 'American Express',
        slug: 'amex',
        description: 'Premium payment network with exclusive benefits',
        iconName: 'credit-card',
        color: '#006FCF',
        isActive: true,
    },
    {
        id: 'network_diners',
        name: 'Diners Club',
        slug: 'diners',
        description: 'Premium payment network for affluent customers',
        iconName: 'credit-card',
        color: '#004A94',
        isActive: true,
    },
] as const;

/**
 * Card Issuers
 */
const CARD_ISSUERS = [
    {
        id: 'issuer_hdfc',
        name: 'HDFC Bank',
        slug: 'hdfc',
        description: 'Leading private sector bank with premium credit cards',
        iconName: 'building-2',
        color: '#004C8B',
        isActive: true,
        marketShare: 25.2,
    },
    {
        id: 'issuer_icici',
        name: 'ICICI Bank',
        slug: 'icici',
        description: 'Leading private sector bank with innovative card products',
        iconName: 'building-2',
        color: '#F47920',
        isActive: true,
        marketShare: 18.7,
    },
    {
        id: 'issuer_axis',
        name: 'Axis Bank',
        slug: 'axis',
        description: 'Private sector bank with travel-focused credit cards',
        iconName: 'building-2',
        color: '#97144D',
        isActive: true,
        marketShare: 12.8,
    },
    {
        id: 'issuer_sbi',
        name: 'SBI Card',
        slug: 'sbi',
        description: 'India\'s largest credit card issuer by market share',
        iconName: 'building-2',
        color: '#1C4A90',
        isActive: true,
        marketShare: 19.5,
    },
] as const;

/**
 * Standardized reward categories for all cards
 */
const REWARD_CATEGORIES = [
    {
        id: 'reward_cat_online_shopping',
        name: 'Online Shopping',
        slug: 'online-shopping',
        description: 'E-commerce platforms and online retail purchases',
        mccCodes: ['5399', '5651', '5732'] as string[],
        sortOrder: 10,
    },
    {
        id: 'reward_cat_dining',
        name: 'Dining & Food',
        slug: 'dining',
        description: 'Restaurants, food delivery, and dining experiences',
        mccCodes: ['5812', '5814'] as string[],
        sortOrder: 20,
    },
    {
        id: 'reward_cat_grocery',
        name: 'Grocery & Supermarkets',
        slug: 'grocery',
        description: 'Grocery stores, supermarkets, and quick commerce',
        mccCodes: ['5411', '5499'] as string[],
        sortOrder: 30,
    },
    {
        id: 'reward_cat_fuel',
        name: 'Fuel & Petrol',
        slug: 'fuel',
        description: 'Petrol pumps and fuel stations',
        mccCodes: ['5541'] as string[],
        sortOrder: 40,
    },
    {
        id: 'reward_cat_travel',
        name: 'Travel & Transportation',
        slug: 'travel',
        description: 'Airlines, hotels, transportation, and travel bookings',
        mccCodes: ['3000', '4112', '4121', '7011'] as string[],
        sortOrder: 50,
    },
    {
        id: 'reward_cat_utilities',
        name: 'Utilities & Bills',
        slug: 'utilities',
        description: 'Electricity, mobile recharges, and utility bill payments',
        mccCodes: ['4814', '4900'] as string[],
        sortOrder: 60,
    },
    {
        id: 'reward_cat_entertainment',
        name: 'Entertainment & Movies',
        slug: 'entertainment',
        description: 'Movies, streaming services, and entertainment',
        mccCodes: ['7832', '5815', '5816'] as string[],
        sortOrder: 70,
    },
    {
        id: 'reward_cat_brand_specific',
        name: 'Brand Specific',
        slug: 'brand-specific',
        description: 'Specific brand partnerships and co-branded merchants',
        mccCodes: [] as string[],
        sortOrder: 80,
    },
    {
        id: 'reward_cat_general',
        name: 'General Spends',
        slug: 'general',
        description: 'All other retail and general spending categories',
        mccCodes: [] as string[],
        sortOrder: 90,
    },
] as const;

/**
 * Main Indian Credit Cards Database - Consistent Structure
 * All reward rates normalized to percentage for easy calculation
 */
const INDIAN_CREDIT_CARDS = [
    {
        id: 'card_amazon_pay_icici',
        name: 'Amazon Pay ICICI Bank Credit Card',
        slug: 'amazon-pay-icici',
        issuerId: 'issuer_icici',
        networkId: 'network_visa',
        categoryId: 'cat_cobranded',
        subCategoryId: 'subcat_cobranded_cashback',
        description: 'India\'s most adopted co-branded credit card offering unlimited cashback on Amazon and partner merchants',
        iconName: 'credit-card',
        color: '#FF9900',
        isActive: true,
        isLifetimeFree: true,
        launchDate: '2019-09-26',
        lastUpdated: '2024-10-11',

        // Standardized fee structure across all cards
        feeStructure: {
            joiningFee: 0,
            annualFee: 0,
            renewalFee: 0,
            foreignMarkupFee: 1.99, // Reduced from 3.5% in Oct 2024
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 5000,
                maxWaiverPerCycle: 250,
            },
            feeWaiverCriteria: {
                type: 'lifetime_free',
                annualSpendRequired: 0,
                waiverPeriod: 'permanent',
            },
        },

        // Standardized eligibility across all cards
        eligibilityRequirements: {
            ageRange: { min: 21, max: 65 },
            minimumIncome: {
                salaried: 300000, // Rs 3 lakh per annum
                selfEmployed: 500000, // Rs 5 lakh per annum
                business: 500000,
            },
            minimumCreditScore: 650,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'bank_statements'],
        },

        // Normalized reward structure - all rates in % of transaction value
        rewardStructure: {
            rewardType: 'cashback', // cashback | points | miles
            rewardCurrency: 'amazon_pay_balance',
            baseRewardRate: 1.0, // 1% on general spends

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['amazon.in'],
                    rewardRate: 5.0, // 5% cashback
                    conditions: ['amazon_prime_membership'],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Amazon.in purchases for Prime members',
                },
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['amazon.in'],
                    rewardRate: 3.0, // 3% cashback
                    conditions: [],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Amazon.in purchases for non-Prime members',
                },
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['instamart', 'swiggyinstamart', 'eatclubinstamart', 'zepto', 'blinkit', 'grofers'],
                    rewardRate: 2.0, // 2% cashback
                    conditions: [],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Amazon Pay partner merchants',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'emi_transactions',
                    description: 'EMI purchases and conversions',
                },
                {
                    categoryId: 'gold_silver_purchases',
                    description: 'Precious metals and jewelry',
                },
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases (surcharge waiver available)',
                },
                {
                    categoryId: 'rent_payments',
                    description: 'Property rent payments',
                },
                {
                    categoryId: 'tax_payments',
                    description: 'Government and tax payments',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
            ],

            pointsConversion: {
                isApplicable: false, // Not applicable for cashback cards
                conversionRate: null,
                minimumRedemption: null,
            },
        },

        // Standardized benefits structure
        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'voucher',
                        benefitName: 'Amazon Prime Voucher',
                        benefitValue: 500,
                        benefitCurrency: 'INR',
                        conditions: ['non_prime_members_only', 'card_approval_after_dec_2024'],
                        validityDays: 365,
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [], // No milestone benefits for this card
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'dining_discount',
                        benefitName: 'Good Food Trail',
                        benefitValue: 15,
                        benefitCurrency: 'percentage',
                        conditions: ['swiggy_dineout_only', 'coupon_code_required'],
                        description: '15% additional discount on Swiggy Dineout',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'No Lounge Access',
                        benefitValue: 0,
                        domesticVisitsPerYear: 0,
                        internationalVisitsPerYear: 0,
                        conditions: [],
                        isActive: false,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [
                    {
                        benefitType: 'purchase_protection',
                        benefitName: 'Purchase Protection Insurance',
                        benefitValue: 100000,
                        benefitCurrency: 'INR',
                        conditions: ['theft_and_damage_protection'],
                        description: 'Protection against theft and accidental damage',
                        isActive: true,
                    },
                    {
                        benefitType: 'fraud_protection',
                        benefitName: 'Zero Fraud Liability',
                        benefitValue: 0,
                        benefitCurrency: 'INR',
                        conditions: ['immediate_reporting_required'],
                        description: 'Complete protection against fraudulent transactions',
                        isActive: true,
                    },
                ],
            },
        ],

        // Card-specific features
        uniqueFeatures: [
            'instant_digital_card_approval',
            'amazon_pay_integration',
            'unlimited_cashback_earning',
            'no_reward_expiry',
            'contactless_payments',
        ] as string[],

        // Performance metrics
        popularityScore: 95, // Out of 100
        customerSatisfactionScore: 4.6, // Out of 5
        recommendationScore: 92, // Out of 100
    },

    {
        id: 'card_flipkart_axis',
        name: 'Flipkart Axis Bank Credit Card',
        slug: 'flipkart-axis',
        issuerId: 'issuer_axis',
        networkId: 'network_visa',
        categoryId: 'cat_cobranded',
        subCategoryId: 'subcat_cobranded_cashback',
        description: 'Comprehensive cashback card offering rewards across Flipkart ecosystem and lifestyle partners',
        iconName: 'credit-card',
        color: '#047BD6',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2019-05-15',
        lastUpdated: '2024-06-20',

        feeStructure: {
            joiningFee: 500,
            annualFee: 500,
            renewalFee: 500,
            foreignMarkupFee: 3.5,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 4000,
                maxWaiverPerCycle: 400,
            },
            feeWaiverCriteria: {
                type: 'spend_based',
                annualSpendRequired: 200000, // Rs 2 lakh
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 18, max: 70 },
            minimumIncome: {
                salaried: 300000,
                selfEmployed: 500000,
                business: 500000,
            },
            minimumCreditScore: 650,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'bank_statements'],
        },

        rewardStructure: {
            rewardType: 'cashback',
            rewardCurrency: 'statement_credit',
            baseRewardRate: 1.0, // 1% on other spends

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['myntra'],
                    rewardRate: 7.5, // 7.5% cashback
                    conditions: [],
                    cappingLimit: 4000,
                    cappingPeriod: 'quarterly',
                    description: 'Myntra purchases',
                },
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['flipkart', 'cleartrip'],
                    rewardRate: 5.0, // 5% cashback
                    conditions: [],
                    cappingLimit: 4000,
                    cappingPeriod: 'quarterly_per_merchant',
                    description: 'Flipkart and Cleartrip purchases',
                },
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['swiggy', 'uber', 'pvr', 'cult.fit', 'district', 'districtmovie', 'districtmovietic'],
                    rewardRate: 4.0, // 4% cashback
                    conditions: [],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Preferred lifestyle partners',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'gift_card_purchases',
                    description: 'Gift card purchases on Flipkart & Myntra',
                },
                {
                    categoryId: 'gold_purchases',
                    description: 'Gold and precious metal purchases',
                },
                {
                    categoryId: 'emi_transactions',
                    description: 'EMI purchases and conversions',
                },
                {
                    categoryId: 'wallet_loads',
                    description: 'Digital wallet top-ups',
                },
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases (surcharge waiver available)',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
            ],

            pointsConversion: {
                isApplicable: false,
                conversionRate: null,
                minimumRedemption: null,
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'voucher',
                        benefitName: 'Flipkart Voucher',
                        benefitValue: 500,
                        benefitCurrency: 'INR',
                        conditions: ['first_transaction_within_30_days', 'paid_cards_only'],
                        validityDays: 30,
                        isActive: true,
                    },
                    {
                        benefitType: 'discount',
                        benefitName: 'Swiggy First Order Discount',
                        benefitValue: 50,
                        benefitCurrency: 'percentage',
                        conditions: ['new_swiggy_users_only', 'max_discount_100'],
                        validityDays: 30,
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [], // No major milestone benefits
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'dining_discount',
                        benefitName: 'EazyDiner Discount',
                        benefitValue: 15,
                        benefitCurrency: 'percentage',
                        conditions: ['selected_restaurants', 'max_discount_500'],
                        description: 'Up to 15% off at selected restaurants',
                        isActive: true,
                    },
                    {
                        benefitType: 'travel_discount',
                        benefitName: 'Wednesday Travel Offers',
                        benefitValue: 15,
                        benefitCurrency: 'percentage',
                        conditions: ['makemytrip_goibibo_only', 'wednesdays_only'],
                        description: 'Up to 15% savings on flights & hotels',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Domestic Airport Lounge Access',
                        benefitValue: 4,
                        domesticVisitsPerYear: 4,
                        internationalVisitsPerYear: 0,
                        conditions: ['spend_50k_previous_3_months'], // Updated May 2024
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [], // No major insurance benefits
            },
        ],

        uniqueFeatures: [
            'diversified_partner_ecosystem',
            'statement_credit_cashback',
            'lifestyle_focused_rewards',
            'easy_emi_conversion',
        ] as string[],

        popularityScore: 78,
        customerSatisfactionScore: 4.2,
        recommendationScore: 75,
    },

    {
        id: 'card_hdfc_millennia',
        name: 'HDFC Millennia Credit Card',
        slug: 'hdfc-millennia',
        issuerId: 'issuer_hdfc',
        networkId: 'network_visa',
        categoryId: 'cat_cashback',
        subCategoryId: 'subcat_category_cashback',
        description: 'Entry-level cashback card offering 5% cashback on 10 popular online brands',
        iconName: 'credit-card',
        color: '#004C8B',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2018-03-12',
        lastUpdated: '2024-08-01',

        feeStructure: {
            joiningFee: 1000,
            annualFee: 1000,
            renewalFee: 1000,
            foreignMarkupFee: 3.5,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 5000,
                maxWaiverPerCycle: 250,
            },
            feeWaiverCriteria: {
                type: 'spend_based',
                annualSpendRequired: 100000, // Rs 1 lakh
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 21, max: 60 },
            minimumIncome: {
                salaried: 300000,
                selfEmployed: 500000,
                business: 500000,
            },
            minimumCreditScore: 650,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'salary_slips'],
        },

        rewardStructure: {
            rewardType: 'cashback',
            rewardCurrency: 'cash_points', // CashPoints system
            baseRewardRate: 1.0, // 1% on all other spends

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['amazon', 'bookmyshow', 'cult.fit', 'flipkart', 'myntra', 'sony liv', 'swiggy', 'tata cliq', 'uber', 'zomato'],
                    rewardRate: 5.0, // 5% cashback
                    conditions: [],
                    cappingLimit: 1000,
                    cappingPeriod: 'monthly',
                    description: '10 popular online brands',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases',
                },
                {
                    categoryId: 'rent_payments',
                    description: 'Property rent payments',
                },
                {
                    categoryId: 'government_transactions',
                    description: 'Government and tax payments',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
                {
                    categoryId: 'card_fees',
                    description: 'Card fees and charges',
                },
            ],

            pointsConversion: {
                isApplicable: true,
                conversionRate: 1.0, // 1 CashPoint = Rs 1 for statement credit
                alternateConversionRate: 0.3, // 1 CashPoint = Rs 0.30 for rewards catalogue
                minimumRedemption: 500, // CashPoints
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'cashpoints',
                        benefitName: 'Welcome CashPoints',
                        benefitValue: 1000,
                        benefitCurrency: 'cash_points',
                        conditions: ['joining_fee_payment'],
                        validityDays: 730, // 2 years
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [
                    {
                        benefitType: 'voucher',
                        benefitName: 'Quarterly Gift Voucher',
                        benefitValue: 1000,
                        benefitCurrency: 'INR',
                        conditions: ['quarterly_spend_100k'],
                        description: 'Rs 1,000 gift voucher on Rs 1 lakh quarterly spend',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'dining_discount',
                        benefitName: 'Swiggy Dineout Discount',
                        benefitValue: 20,
                        benefitCurrency: 'percentage',
                        conditions: ['swiggy_dineout_platform'],
                        description: '20% discount on dining via Swiggy Dineout',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Domestic Airport Lounge Access',
                        benefitValue: 8,
                        domesticVisitsPerYear: 8,
                        internationalVisitsPerYear: 0,
                        conditions: ['spend_5k_previous_quarter'], // Updated Jan 2024
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [], // No major insurance benefits
            },
        ],

        uniqueFeatures: [
            'popular_brand_partnerships',
            'cashpoints_flexibility',
            'millennial_focused_benefits',
            'easy_redemption_options',
        ] as string[],

        popularityScore: 82,
        customerSatisfactionScore: 4.3,
        recommendationScore: 79,
    },

    {
        id: 'card_hdfc_tata_neu_infinity',
        name: 'HDFC Tata Neu Infinity Credit Card',
        slug: 'hdfc-tata-neu-infinity',
        issuerId: 'issuer_hdfc',
        networkId: 'network_visa', // Also available in RuPay
        categoryId: 'cat_cobranded',
        subCategoryId: 'subcat_cobranded_cashback',
        description: 'Premium co-branded card offering up to 10% rewards on Tata Neu ecosystem',
        iconName: 'credit-card',
        color: '#7B68EE',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2022-04-07',
        lastUpdated: '2024-09-01',

        feeStructure: {
            joiningFee: 1499,
            annualFee: 1499,
            renewalFee: 1499,
            foreignMarkupFee: 3.5,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 5000,
                maxWaiverPerCycle: 500,
            },
            feeWaiverCriteria: {
                type: 'spend_based',
                annualSpendRequired: 300000, // Rs 3 lakh
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 21, max: 65 },
            minimumIncome: {
                salaried: 1200000, // Rs 1 lakh per month = Rs 12 lakh per annum
                selfEmployed: 1200000, // Rs 12 lakh ITR
                business: 1200000,
            },
            minimumCreditScore: 700,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'itr_documents'],
        },

        rewardStructure: {
            rewardType: 'points',
            rewardCurrency: 'neu_coins',
            baseRewardRate: 1.5, // 1.5% on non-Tata brands and EMI

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['tata_neu_ecosystem', 'tata_brands'],
                    rewardRate: 5.0, // 5% NeuCoins on Tata brands
                    conditions: ['non_emi_transactions'],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Tata Neu and partner brands (non-EMI)',
                },
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['select_tata_neu_purchases'],
                    rewardRate: 10.0, // Up to 10% total on select purchases
                    conditions: ['special_promotions'],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Select Tata Neu purchases (promotional)',
                },
                {
                    categoryId: 'reward_cat_utilities',
                    merchantPatterns: ['upi_transactions'],
                    rewardRate: 1.5, // 1.5% on UPI (RuPay variant only)
                    conditions: ['rupay_variant_only'],
                    cappingLimit: 500,
                    cappingPeriod: 'monthly',
                    description: 'UPI transactions (RuPay card only)',
                },
            ],

            cappingStructure: [
                {
                    categoryId: 'reward_cat_grocery',
                    cappingLimit: 2000,
                    cappingPeriod: 'monthly',
                    description: 'Grocery purchases capping',
                },
                {
                    categoryId: 'reward_cat_utilities',
                    cappingLimit: 2000,
                    cappingPeriod: 'monthly',
                    description: 'Utility bill payments capping',
                },
                {
                    categoryId: 'telecom_cable',
                    cappingLimit: 2000,
                    cappingPeriod: 'monthly',
                    description: 'Telecom & cable transactions capping',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases',
                },
                {
                    categoryId: 'rent_payments',
                    description: 'Property rent payments',
                },
                {
                    categoryId: 'government_transactions',
                    description: 'Government and tax payments',
                },
                {
                    categoryId: 'wallet_loads',
                    description: 'Digital wallet top-ups',
                },
                {
                    categoryId: 'emi_transactions',
                    description: 'EMI purchases and conversions',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
            ],

            pointsConversion: {
                isApplicable: true,
                conversionRate: 1.0, // 1 NeuCoin = Rs 1 across Tata Neu ecosystem
                minimumRedemption: 100, // NeuCoins
                validityMonths: 12, // From Aug 2025
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'neucoins',
                        benefitName: 'Welcome NeuCoins',
                        benefitValue: 1499,
                        benefitCurrency: 'neu_coins',
                        conditions: ['joining_fee_payment'],
                        validityDays: 365,
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [], // No specific milestone benefits
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'ecosystem_access',
                        benefitName: 'Tata Neu Ecosystem Benefits',
                        benefitValue: 0,
                        benefitCurrency: 'INR',
                        conditions: ['wide_redemption_network'],
                        description: 'Access to entire Tata Neu ecosystem for redemption',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Domestic & International Lounge Access',
                        benefitValue: 12,
                        domesticVisitsPerYear: 8,
                        internationalVisitsPerYear: 4,
                        conditions: [],
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [
                    {
                        benefitType: 'air_accident_cover',
                        benefitName: 'Air Accident Insurance',
                        benefitValue: 10000000,
                        benefitCurrency: 'INR',
                        conditions: ['air_travel_related_accidents'],
                        description: 'Rs 1 crore air accident insurance',
                        isActive: true,
                    },
                ],
            },
        ],

        uniqueFeatures: [
            'tata_ecosystem_integration',
            'rupay_upi_rewards',
            'wide_brand_network',
            'premium_lounge_access',
        ] as string[],

        popularityScore: 71,
        customerSatisfactionScore: 4.1,
        recommendationScore: 68,
    },

    {
        id: 'card_hdfc_regalia_gold',
        name: 'HDFC Regalia Gold Credit Card',
        slug: 'hdfc-regalia-gold',
        issuerId: 'issuer_hdfc',
        networkId: 'network_visa',
        categoryId: 'cat_rewards_points',
        subCategoryId: 'subcat_multi_category_rewards',
        description: 'All-round premium credit card with travel benefits and lifestyle rewards',
        iconName: 'credit-card',
        color: '#D4AF37',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2022-08-15',
        lastUpdated: '2024-11-01',

        feeStructure: {
            joiningFee: 2500,
            annualFee: 2500,
            renewalFee: 2500,
            foreignMarkupFee: 2.0,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 5000,
                maxWaiverPerCycle: 250,
            },
            feeWaiverCriteria: {
                type: 'spend_based',
                annualSpendRequired: 400000, // Rs 4 lakh
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 21, max: 60 },
            minimumIncome: {
                salaried: 1800000, // Rs 1.5 lakh per month = Rs 18 lakh per annum
                selfEmployed: 1800000, // Rs 18 lakh ITR
                business: 1800000,
            },
            minimumCreditScore: 750,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'bank_statements'],
        },

        rewardStructure: {
            rewardType: 'points',
            rewardCurrency: 'reward_points',
            baseRewardRate: 2.67, // 4 RPs per Rs 150 = 2.67% (4/150*100)

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['marks_spencer', 'myntra', 'nykaa', 'reliance_digital'],
                    rewardRate: 13.33, // 20 RPs per Rs 150 = 13.33%
                    conditions: [],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Lifestyle brands - 5X reward points',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
                {
                    categoryId: 'outstanding_payments',
                    description: 'Outstanding balance payments',
                },
                {
                    categoryId: 'card_fees',
                    description: 'Card fees and charges',
                },
            ],

            pointsConversion: {
                isApplicable: true,
                conversionRate: 0.65, // 1 RP = Rs 0.65 (Gold Catalogue)
                alternateConversionRate: 0.50, // 1 RP = Rs 0.50 (flights/hotels)
                minimumRedemption: 1000, // Reward Points
                validityMonths: 24, // 2 years
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'voucher',
                        benefitName: 'Welcome Voucher',
                        benefitValue: 2500,
                        benefitCurrency: 'INR',
                        conditions: ['equivalent_to_joining_fee'],
                        validityDays: 365,
                        isActive: true,
                    },
                    {
                        benefitType: 'membership',
                        benefitName: 'Swiggy One Membership',
                        benefitValue: 0,
                        benefitCurrency: 'INR',
                        conditions: ['replaced_club_vistara_nov_2024'],
                        validityDays: 365,
                        isActive: true,
                    },
                    {
                        benefitType: 'membership',
                        benefitName: 'MMT Black Elite Membership',
                        benefitValue: 0,
                        benefitCurrency: 'INR',
                        conditions: ['complimentary_membership'],
                        validityDays: 365,
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [
                    {
                        benefitType: 'voucher',
                        benefitName: 'Quarterly Milestone Voucher',
                        benefitValue: 1500,
                        benefitCurrency: 'INR',
                        conditions: ['quarterly_spend_150k'],
                        description: 'Rs 1,500 voucher on Rs 1.5 lakh quarterly spend',
                        isActive: true,
                    },
                    {
                        benefitType: 'voucher',
                        benefitName: 'Annual Flight Voucher',
                        benefitValue: 5000,
                        benefitCurrency: 'INR',
                        conditions: ['annual_spend_500k'],
                        description: 'Rs 5,000 flight voucher on Rs 5 lakh annual spend',
                        isActive: true,
                    },
                    {
                        benefitType: 'voucher',
                        benefitName: 'Additional Flight Voucher',
                        benefitValue: 5000,
                        benefitCurrency: 'INR',
                        conditions: ['annual_spend_750k'],
                        description: 'Additional Rs 5,000 flight voucher on Rs 7.5 lakh annual spend',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'concierge_service',
                        benefitName: '24/7 Concierge Service',
                        benefitValue: 0,
                        benefitCurrency: 'INR',
                        conditions: ['premium_lifestyle_assistance'],
                        description: 'Personal assistance for travel and lifestyle needs',
                        isActive: true,
                    },
                    {
                        benefitType: 'travel_voucher',
                        benefitName: 'Airport Pick/Drop Vouchers',
                        benefitValue: 300,
                        benefitCurrency: 'INR',
                        conditions: ['flight_bookings_via_smartbuy'],
                        description: 'Uber vouchers for airport transfers',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Comprehensive Lounge Access',
                        benefitValue: 18,
                        domesticVisitsPerYear: 12,
                        internationalVisitsPerYear: 6,
                        conditions: ['priority_pass_membership_required'],
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [
                    {
                        benefitType: 'air_accident_cover',
                        benefitName: 'Air Accident Insurance',
                        benefitValue: 10000000,
                        benefitCurrency: 'INR',
                        conditions: ['air_travel_related_accidents'],
                        description: 'Rs 1 crore air accident insurance',
                        isActive: true,
                    },
                    {
                        benefitType: 'emergency_hospitalization',
                        benefitName: 'Emergency Overseas Hospitalization',
                        benefitValue: 1500000,
                        benefitCurrency: 'INR',
                        conditions: ['overseas_medical_emergencies'],
                        description: 'Rs 15 lakh emergency overseas hospitalization',
                        isActive: true,
                    },
                    {
                        benefitType: 'credit_liability_cover',
                        benefitName: 'Credit Liability Cover',
                        benefitValue: 900000,
                        benefitCurrency: 'INR',
                        conditions: ['fraudulent_transactions'],
                        description: 'Rs 9 lakh credit liability cover',
                        isActive: true,
                    },
                ],
            },
        ],

        uniqueFeatures: [
            'comprehensive_travel_benefits',
            'exclusive_gold_catalogue',
            'premium_lifestyle_privileges',
            'milestone_reward_structure',
        ] as string[],

        popularityScore: 84,
        customerSatisfactionScore: 4.4,
        recommendationScore: 81,
    },

    {
        id: 'card_hdfc_diners_black',
        name: 'HDFC Diners Club Black Credit Card',
        slug: 'hdfc-diners-black',
        issuerId: 'issuer_hdfc',
        networkId: 'network_diners',
        categoryId: 'cat_premium_lifestyle',
        subCategoryId: 'subcat_super_premium',
        description: 'Ultra-premium credit card with luxury lifestyle privileges and unlimited lounge access',
        iconName: 'credit-card',
        color: '#000000',
        isActive: false, // Card discontinued
        isLifetimeFree: false,
        launchDate: '2018-01-15',
        lastUpdated: '2024-07-15',

        feeStructure: {
            joiningFee: 10000,
            annualFee: 10000,
            renewalFee: 10000,
            foreignMarkupFee: 2.0,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 5000,
                maxWaiverPerCycle: 250,
            },
            feeWaiverCriteria: {
                type: 'no_waiver',
                annualSpendRequired: 0,
                waiverPeriod: null,
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 21, max: 60 },
            minimumIncome: {
                salaried: 2400000, // Rs 2 lakh per month = Rs 24 lakh per annum
                selfEmployed: 2400000, // Rs 24 lakh ITR
                business: 2400000,
            },
            minimumCreditScore: 800,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'bank_statements', 'itr_documents'],
        },

        rewardStructure: {
            rewardType: 'points',
            rewardCurrency: 'reward_points',
            baseRewardRate: 3.33, // 5 RPs per Rs 150 = 3.33%

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_travel',
                    merchantPatterns: ['smartbuy_portal'],
                    rewardRate: 33.33, // 10X reward points = 33.33%
                    conditions: ['smartbuy_portal_only'],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'SmartBuy portal purchases',
                },
                {
                    categoryId: 'reward_cat_dining',
                    merchantPatterns: ['weekend_dining'],
                    rewardRate: 6.67, // 2X reward points = 6.67%
                    conditions: ['weekend_only'],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Weekend dining',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
                {
                    categoryId: 'outstanding_payments',
                    description: 'Outstanding balance payments',
                },
                {
                    categoryId: 'card_fees',
                    description: 'Card fees and charges',
                },
            ],

            pointsConversion: {
                isApplicable: true,
                conversionRate: 1.0, // 1 RP = Rs 1 (flights/hotels)
                alternateConversionRate: 0.50, // 1 RP = Rs 0.50 (vouchers)
                cashbackConversionRate: 0.30, // 1 RP = Rs 0.30 (cashback)
                minimumRedemption: 1000,
                validityMonths: 36, // 3 years
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'membership_bundle',
                        benefitName: 'Premium Memberships',
                        benefitValue: 15000,
                        benefitCurrency: 'INR',
                        conditions: ['spend_150k_in_90_days'],
                        description: 'Club Marriott, Amazon Prime, Swiggy One, MMT Black, Times Prime',
                        validityDays: 365,
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [
                    {
                        benefitType: 'voucher_choice',
                        benefitName: 'Monthly Voucher Choice',
                        benefitValue: 500,
                        benefitCurrency: 'INR',
                        conditions: ['monthly_spend_80k'],
                        description: 'Choice of BookMyShow, TataCliQ, cult.fit, or Ola vouchers',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'golf_access',
                        benefitName: 'Complimentary Golf Games',
                        benefitValue: 6,
                        benefitCurrency: 'games_per_quarter',
                        conditions: ['premium_golf_courses_worldwide'],
                        description: '6 complimentary golf games per quarter',
                        isActive: true,
                    },
                    {
                        benefitType: 'concierge_service',
                        benefitName: '24/7 Premium Concierge',
                        benefitValue: 0,
                        benefitCurrency: 'INR',
                        conditions: ['luxury_lifestyle_assistance'],
                        description: 'Personal assistance for luxury lifestyle needs',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Unlimited Global Lounge Access',
                        benefitValue: 0, // Unlimited
                        domesticVisitsPerYear: null, // Unlimited
                        internationalVisitsPerYear: null, // Unlimited
                        conditions: ['1000_plus_lounges_worldwide'],
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [
                    {
                        benefitType: 'air_accident_cover',
                        benefitName: 'Air Accident Insurance',
                        benefitValue: 20000000,
                        benefitCurrency: 'INR',
                        conditions: ['air_travel_related_accidents'],
                        description: 'Rs 2 crore air accident insurance',
                        isActive: true,
                    },
                    {
                        benefitType: 'emergency_hospitalization',
                        benefitName: 'Emergency Overseas Hospitalization',
                        benefitValue: 5000000,
                        benefitCurrency: 'INR',
                        conditions: ['overseas_medical_emergencies'],
                        description: 'Rs 50 lakh emergency overseas hospitalization',
                        isActive: true,
                    },
                    {
                        benefitType: 'credit_liability_cover',
                        benefitName: 'Credit Liability Cover',
                        benefitValue: 900000,
                        benefitCurrency: 'INR',
                        conditions: ['fraudulent_transactions'],
                        description: 'Rs 9 lakh credit liability cover',
                        isActive: true,
                    },
                ],
            },
        ],

        uniqueFeatures: [
            'unlimited_global_lounge_access',
            'luxury_golf_privileges',
            'premium_concierge_service',
            'ultra_high_reward_rates',
        ] as string[],

        popularityScore: 65, // Lower due to discontinuation
        customerSatisfactionScore: 4.7,
        recommendationScore: 55, // Lower due to unavailability
    },

    {
        id: 'card_axis_ace',
        name: 'Axis Bank ACE Credit Card',
        slug: 'axis-ace',
        issuerId: 'issuer_axis',
        networkId: 'network_visa',
        categoryId: 'cat_cashback',
        subCategoryId: 'subcat_category_cashback',
        description: 'Entry-level cashback card optimized for utility payments and digital spending',
        iconName: 'credit-card',
        color: '#97144D',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2020-09-22',
        lastUpdated: '2024-04-20',

        feeStructure: {
            joiningFee: 499,
            annualFee: 499,
            renewalFee: 499,
            foreignMarkupFee: 3.5,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 4000,
                maxWaiverPerCycle: 500,
            },
            feeWaiverCriteria: {
                type: 'joining_spend_based',
                joiningSpendRequired: 10000, // Rs 10,000 in 45 days
                joiningWaiverPeriod: 45, // days
                annualSpendRequired: 200000, // Rs 2 lakh for renewal waiver
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 18, max: 70 },
            minimumIncome: {
                salaried: 250000,
                selfEmployed: 400000,
                business: 400000,
            },
            minimumCreditScore: 600,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'salary_slips'],
        },

        rewardStructure: {
            rewardType: 'cashback',
            rewardCurrency: 'statement_credit',
            baseRewardRate: 1.5, // 1.5% on all other spends

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_utilities',
                    merchantPatterns: ['google_pay_bills'],
                    rewardRate: 5.0, // 5% cashback
                    conditions: ['google_pay_android_only', 'utilities_and_recharges'],
                    cappingLimit: 500, // Combined with 4% category
                    cappingPeriod: 'monthly',
                    description: 'Bill payments and recharges via Google Pay',
                },
                {
                    categoryId: 'reward_cat_brand_specific',
                    merchantPatterns: ['swiggy', 'zomato', 'ola'],
                    rewardRate: 4.0, // 4% cashback
                    conditions: [],
                    cappingLimit: 500, // Combined with 5% category
                    cappingPeriod: 'monthly',
                    description: 'Swiggy, Zomato, and Ola',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases (surcharge waiver available)',
                },
                {
                    categoryId: 'utility_non_gpay',
                    description: 'Utility spends on platforms other than Google Pay',
                },
                {
                    categoryId: 'emi_transactions',
                    description: 'EMI purchases and conversions',
                },
                {
                    categoryId: 'wallet_loads',
                    description: 'Digital wallet top-ups',
                },
                {
                    categoryId: 'gold_purchases',
                    description: 'Gold and precious metal purchases',
                },
                {
                    categoryId: 'insurance_transactions',
                    description: 'Insurance premium payments',
                },
                {
                    categoryId: 'government_transactions',
                    description: 'Government and tax payments',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
            ],

            pointsConversion: {
                isApplicable: false,
                conversionRate: null,
                minimumRedemption: null,
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [], // No major welcome benefits
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [], // No milestone benefits
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'dining_discount',
                        benefitName: 'Restaurant Discounts',
                        benefitValue: 15,
                        benefitCurrency: 'percentage',
                        conditions: ['4000_plus_partner_restaurants'],
                        description: 'Up to 15% off at 4,000+ partner restaurants',
                        isActive: true,
                    },
                    {
                        benefitType: 'emi_conversion',
                        benefitName: 'Easy EMI Conversion',
                        benefitValue: 2500,
                        benefitCurrency: 'minimum_transaction',
                        conditions: ['transactions_above_2500'],
                        description: 'Convert transactions above Rs 2,500 to EMI',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Domestic Airport Lounge Access',
                        benefitValue: 4,
                        domesticVisitsPerYear: 4,
                        internationalVisitsPerYear: 0,
                        conditions: ['spend_50k_previous_3_months'], // Updated April 2024
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [], // No major insurance benefits
            },
        ],

        uniqueFeatures: [
            'google_pay_optimization',
            'utility_bill_rewards',
            'entry_level_accessibility',
            'digital_first_approach',
        ] as string[],

        popularityScore: 76,
        customerSatisfactionScore: 4.0,
        recommendationScore: 73,
    },

    {
        id: 'card_axis_magnus',
        name: 'Axis Magnus Credit Card',
        slug: 'axis-magnus',
        issuerId: 'issuer_axis',
        networkId: 'network_mastercard',
        categoryId: 'cat_travel_miles',
        subCategoryId: 'subcat_general_travel',
        description: 'High-reward premium card with excellent miles transfer program and travel benefits',
        iconName: 'credit-card',
        color: '#8B0000',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2021-08-10',
        lastUpdated: '2024-04-20',

        feeStructure: {
            joiningFee: 12500,
            annualFee: 12500,
            renewalFee: 12500,
            foreignMarkupFee: 2.0,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 400,
                maxTransaction: 4000,
                maxWaiverPerCycle: 400,
            },
            feeWaiverCriteria: {
                type: 'spend_based',
                annualSpendRequired: 2500000, // Rs 25 lakh
                burgundyAnnualSpendRequired: 3000000, // Rs 30 lakh (for Burgundy variant)
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 18, max: 70 },
            minimumIncome: {
                salaried: 2400000, // Rs 24 lakh per annum
                selfEmployed: 2400000,
                business: 2400000,
            },
            minimumCreditScore: 750,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'bank_statements', 'itr_documents'],
        },

        rewardStructure: {
            rewardType: 'points',
            rewardCurrency: 'edge_reward_points',
            baseRewardRate: 6.0, // 12 EDGE points per Rs 200 = 6%

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_general',
                    merchantPatterns: ['monthly_spends_above_150k'],
                    rewardRate: 17.5, // 35 EDGE points per Rs 200 = 17.5%
                    conditions: ['monthly_spend_above_150k'],
                    cappingLimit: null,
                    cappingPeriod: null,
                    description: 'Incremental spends above Rs 1.5 lakh monthly',
                },
                {
                    categoryId: 'reward_cat_travel',
                    merchantPatterns: ['travel_edge_portal'],
                    rewardRate: 30.0, // 60 EDGE points per Rs 200 = 30%
                    conditions: ['travel_edge_portal_only'],
                    cappingLimit: 200000,
                    cappingPeriod: 'monthly',
                    description: 'Travel Edge portal bookings',
                },
            ],

            milestoneBenefits: [
                {
                    spendAmount: 400000,
                    period: 'quarterly',
                    benefitType: 'bonus_points',
                    benefitValue: 10000,
                    description: '10,000 bonus EDGE Reward Points on Rs 4 lakh quarterly spend',
                },
            ],

            transferPartners: {
                conversionRatio: '5:2', // 5 EDGE points = 2 miles
                burgundyConversionRatio: '5:4', // 5 EDGE points = 4 miles (for Burgundy customers)
                maxTransferRegular: 500000, // EDGE points per year
                maxTransferBurgundy: 1000000, // EDGE points per year for Burgundy
                groupAMaxTransfer: 100000, // EDGE points per year
                groupBMaxTransfer: 400000, // EDGE points per year
                partnersCount: 20,
            },

            excludedCategories: [
                {
                    categoryId: 'utilities_telecom',
                    description: 'Utilities and telecom transactions',
                },
                {
                    categoryId: 'government_transactions',
                    description: 'Government and tax payments',
                },
                {
                    categoryId: 'wallet_loads',
                    description: 'Digital wallet top-ups',
                },
                {
                    categoryId: 'insurance_transactions',
                    description: 'Insurance premium payments',
                },
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases',
                },
                {
                    categoryId: 'gold_jewelry',
                    description: 'Gold and jewelry purchases',
                },
                {
                    categoryId: 'rent_payments',
                    description: 'Rent payments (Rs 50,000 monthly cap)',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
            ],

            pointsConversion: {
                isApplicable: true,
                conversionRate: 0.20, // 1 EDGE point = Rs 0.20 (product catalog)
                milesConversionRatio: 0.4, // 5:2 ratio = 0.4 miles per point
                burgundyMilesConversionRatio: 0.8, // 5:4 ratio = 0.8 miles per point
                minimumRedemption: 1000,
                validityMonths: 36, // 3 years
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'voucher_choice',
                        benefitName: 'Welcome Voucher',
                        benefitValue: 12500,
                        benefitCurrency: 'INR',
                        conditions: ['choice_of_yatra_luxe_postcard'],
                        description: 'Choice of Yatra, Luxe, or Postcard Hotels voucher',
                        validityDays: 365,
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [
                    {
                        benefitType: 'bonus_points',
                        benefitName: 'Quarterly Milestone',
                        benefitValue: 10000,
                        benefitCurrency: 'edge_points',
                        conditions: ['quarterly_spend_400k'],
                        description: '10,000 bonus EDGE points on Rs 4 lakh quarterly spend',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'hotel_discount',
                        benefitName: 'Hotel Discounts',
                        benefitValue: 15,
                        benefitCurrency: 'percentage',
                        conditions: ['trident_oberoi_hotels'],
                        description: 'Up to 15% off at Trident and Oberoi hotels',
                        isActive: true,
                    },
                    {
                        benefitType: 'dining_discount',
                        benefitName: 'Restaurant Discounts',
                        benefitValue: 30,
                        benefitCurrency: 'percentage',
                        conditions: ['4000_plus_restaurants'],
                        description: 'Up to 30% off at 4,000+ restaurants',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Unlimited Lounge Access',
                        benefitValue: 0, // Unlimited
                        domesticVisitsPerYear: null, // Unlimited
                        internationalVisitsPerYear: null, // Unlimited with 4 guest visits
                        conditions: ['spend_50k_previous_3_months_domestic'], // May 2024 update for domestic
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [
                    {
                        benefitType: 'purchase_protection',
                        benefitName: 'Purchase Protection',
                        benefitValue: 200000,
                        benefitCurrency: 'INR',
                        conditions: ['theft_and_damage_protection'],
                        description: 'Rs 2 lakh purchase protection',
                        isActive: true,
                    },
                    {
                        benefitType: 'credit_shield',
                        benefitName: 'Credit Card Shield',
                        benefitValue: 500000,
                        benefitCurrency: 'INR',
                        conditions: ['credit_protection_cover'],
                        description: 'Rs 5 lakh credit card shield',
                        isActive: true,
                    },
                ],
            },
        ],

        uniqueFeatures: [
            'premium_miles_transfer_program',
            'burgundy_enhanced_benefits',
            'unlimited_earning_potential',
            'comprehensive_travel_ecosystem',
        ] as string[],

        popularityScore: 89,
        customerSatisfactionScore: 4.5,
        recommendationScore: 86,
    },

    {
        id: 'card_sbi_cashback',
        name: 'SBI Cashback Credit Card',
        slug: 'sbi-cashback',
        issuerId: 'issuer_sbi',
        networkId: 'network_visa',
        categoryId: 'cat_cashback',
        subCategoryId: 'subcat_unrestricted_cashback',
        description: 'Unrestricted cashback card offering 5% on online and 1% on offline transactions',
        iconName: 'credit-card',
        color: '#1C4A90',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2020-02-14',
        lastUpdated: '2024-05-01',

        feeStructure: {
            joiningFee: 999,
            annualFee: 999,
            renewalFee: 999,
            foreignMarkupFee: 3.5,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 500,
                maxTransaction: 3000,
                maxWaiverPerCycle: 100,
            },
            feeWaiverCriteria: {
                type: 'spend_based',
                annualSpendRequired: 200000, // Rs 2 lakh
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 21, max: 70 },
            minimumIncome: {
                salaried: 300000,
                selfEmployed: 500000,
                business: 500000,
            },
            minimumCreditScore: 650,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'salary_slips'],
        },

        rewardStructure: {
            rewardType: 'cashback',
            rewardCurrency: 'statement_credit',
            baseRewardRate: 1.0, // 1% on offline spends

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_online_shopping',
                    merchantPatterns: ['all_online_transactions'],
                    rewardRate: 5.0, // 5% cashback
                    conditions: [],
                    cappingLimit: 5000, // Rs 5,000 per month
                    cappingPeriod: 'monthly',
                    description: 'All online transactions',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'utility_transactions',
                    description: 'Utility bill payments',
                },
                {
                    categoryId: 'insurance_transactions',
                    description: 'Insurance premium payments',
                },
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases',
                },
                {
                    categoryId: 'rent_payments',
                    description: 'Property rent payments',
                },
                {
                    categoryId: 'wallet_loads',
                    description: 'Digital wallet top-ups',
                },
                {
                    categoryId: 'educational_services',
                    description: 'School and educational services',
                },
                {
                    categoryId: 'jewelry_purchases',
                    description: 'Jewelry and precious metal purchases',
                },
                {
                    categoryId: 'railway_transactions',
                    description: 'Railway ticket bookings',
                },
                {
                    categoryId: 'merchant_emi',
                    description: 'Merchant EMI transactions',
                },
                {
                    categoryId: 'flexipay_emi',
                    description: 'Flexipay EMI transactions',
                },
            ],

            pointsConversion: {
                isApplicable: false,
                conversionRate: null,
                minimumRedemption: null,
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [], // No major welcome benefits
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [], // No milestone benefits
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'auto_cashback_credit',
                        benefitName: 'Auto Cashback Credit',
                        benefitValue: 0,
                        benefitCurrency: 'feature',
                        conditions: ['automatic_within_2_working_days'],
                        description: 'Cashback auto-credited within 2 working days of statement generation',
                        isActive: true,
                    },
                    {
                        benefitType: 'no_expiry',
                        benefitName: 'No Cashback Expiry',
                        benefitValue: 0,
                        benefitCurrency: 'feature',
                        conditions: [],
                        description: 'Earned cashback does not expire',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Domestic Airport Lounge Access',
                        benefitValue: 8,
                        domesticVisitsPerYear: 8,
                        internationalVisitsPerYear: 0,
                        conditions: [],
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [], // No major insurance benefits
            },
        ],

        uniqueFeatures: [
            'unrestricted_online_cashback',
            'simple_cashback_structure',
            'no_merchant_restrictions',
            'automatic_cashback_credit',
        ] as string[],

        popularityScore: 88,
        customerSatisfactionScore: 4.4,
        recommendationScore: 85,
    },

    {
        id: 'card_sbi_prime',
        name: 'SBI Card PRIME',
        slug: 'sbi-prime',
        issuerId: 'issuer_sbi',
        networkId: 'network_visa', // Also available in Mastercard, RuPay, Amex
        categoryId: 'cat_rewards_points',
        subCategoryId: 'subcat_lifestyle_rewards',
        description: 'Lifestyle-focused premium card with accelerated rewards on dining, groceries, and entertainment',
        iconName: 'credit-card',
        color: '#1C4A90',
        isActive: true,
        isLifetimeFree: false,
        launchDate: '2017-06-20',
        lastUpdated: '2025-07-15',

        feeStructure: {
            joiningFee: 2999,
            annualFee: 2999,
            renewalFee: 2999,
            foreignMarkupFee: 3.5,
            fuelSurchargeWaiver: {
                isAvailable: true,
                waiverPercentage: 1.0,
                minTransaction: 500,
                maxTransaction: 4000,
                maxWaiverPerCycle: 250,
            },
            feeWaiverCriteria: {
                type: 'spend_based',
                annualSpendRequired: 300000, // Rs 3 lakh
                waiverPeriod: 'annual',
            },
        },

        eligibilityRequirements: {
            ageRange: { min: 21, max: 70 },
            minimumIncome: {
                salaried: 500000,
                selfEmployed: 700000,
                business: 700000,
            },
            minimumCreditScore: 700,
            employmentTypes: ['salaried', 'self-employed', 'business'],
            residencyRequired: 'indian_resident',
            documentsRequired: ['pan_card', 'aadhaar_card', 'income_proof', 'bank_statements'],
        },

        rewardStructure: {
            rewardType: 'points',
            rewardCurrency: 'reward_points',
            baseRewardRate: 2.0, // 2 RPs per Rs 100 = 2%

            acceleratedRewards: [
                {
                    categoryId: 'reward_cat_dining',
                    merchantPatterns: ['dining_restaurants'],
                    rewardRate: 10.0, // 10 RPs per Rs 100 = 10%
                    conditions: [],
                    cappingLimit: 7500,
                    cappingPeriod: 'monthly',
                    description: 'Dining at restaurants',
                },
                {
                    categoryId: 'reward_cat_entertainment',
                    merchantPatterns: ['movies_entertainment'],
                    rewardRate: 10.0, // 10 RPs per Rs 100 = 10%
                    conditions: [],
                    cappingLimit: 7500,
                    cappingPeriod: 'monthly',
                    description: 'Movies and entertainment',
                },
                {
                    categoryId: 'reward_cat_grocery',
                    merchantPatterns: ['departmental_stores_grocery'],
                    rewardRate: 10.0, // 10 RPs per Rs 100 = 10%
                    conditions: [],
                    cappingLimit: 7500,
                    cappingPeriod: 'monthly',
                    description: 'Departmental stores and groceries',
                },
                {
                    categoryId: 'birthday_spends',
                    merchantPatterns: ['all_categories'],
                    rewardRate: 20.0, // 20 RPs per Rs 100 = 20%
                    conditions: ['birthday_plus_minus_one_day'],
                    cappingLimit: 2000,
                    cappingPeriod: 'yearly',
                    description: 'Birthday spends (one day before, on, and after birthday)',
                },
            ],

            excludedCategories: [
                {
                    categoryId: 'fuel_transactions',
                    description: 'Fuel purchases',
                },
                {
                    categoryId: 'cash_advances',
                    description: 'Cash withdrawals and advances',
                },
                {
                    categoryId: 'outstanding_payments',
                    description: 'Outstanding balance payments',
                },
            ],

            pointsConversion: {
                isApplicable: true,
                conversionRate: 0.25, // 1 Reward Point = Rs 0.25
                minimumRedemption: 1000, // Reward Points
                redemptionFee: 99, // Rs 99 per redemption for statement credit
                validityMonths: 24, // 2 years
            },
        },

        additionalBenefits: [
            {
                categoryId: 'welcome_benefits',
                benefits: [
                    {
                        benefitType: 'voucher_choice',
                        benefitName: 'Welcome e-Gift Voucher',
                        benefitValue: 3000,
                        benefitCurrency: 'INR',
                        conditions: ['choice_of_multiple_brands'],
                        description: 'Choice from Yatra, Aditya Birla Fashion, Bata/Hush Puppies, Shoppers Stop, Pantaloons',
                        validityDays: 365,
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'milestone_benefits',
                benefits: [
                    {
                        benefitType: 'voucher',
                        benefitName: 'Quarterly Pizza Hut Voucher',
                        benefitValue: 1000,
                        benefitCurrency: 'INR',
                        conditions: ['quarterly_spend_50k'],
                        description: 'Pizza Hut voucher on Rs 50,000 quarterly spend',
                        isActive: true,
                    },
                    {
                        benefitType: 'voucher',
                        benefitName: 'Annual Gift Vouchers',
                        benefitValue: 11000,
                        benefitCurrency: 'INR',
                        conditions: ['annual_spend_500k'],
                        description: 'Gift vouchers worth Rs 11,000 on Rs 5 lakh annual spend',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lifestyle_benefits',
                benefits: [
                    {
                        benefitType: 'golf_access',
                        benefitName: 'Complimentary Golf Benefits',
                        benefitValue: 4,
                        benefitCurrency: 'rounds_per_month',
                        conditions: ['50_percent_off_additional_games'],
                        description: '4 complimentary golf rounds, 50% off additional games, 1 lesson per month',
                        isActive: true,
                    },
                    {
                        benefitType: 'hotel_discount',
                        benefitName: 'Lalit Hotels Discount',
                        benefitValue: 15,
                        benefitCurrency: 'percentage',
                        conditions: ['room_rates_and_food_beverage'],
                        description: 'Up to 15% discount on room rates and F&B at Lalit Hotels',
                        isActive: true,
                    },
                    {
                        benefitType: 'dining_discount',
                        benefitName: 'Restaurant Discounts',
                        benefitValue: 20,
                        benefitCurrency: 'percentage',
                        conditions: ['700_plus_restaurants'],
                        description: 'Up to 20% discount at 700+ restaurants',
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'lounge_access',
                benefits: [
                    {
                        benefitType: 'airport_lounge',
                        benefitName: 'Domestic & International Lounge Access',
                        benefitValue: 12,
                        domesticVisitsPerYear: 8,
                        internationalVisitsPerYear: 4,
                        conditions: ['priority_pass_membership'],
                        isActive: true,
                    },
                ],
            },
            {
                categoryId: 'insurance_coverage',
                benefits: [
                    {
                        benefitType: 'air_accident_cover',
                        benefitName: 'Air Accident Liability Cover',
                        benefitValue: 5000000,
                        benefitCurrency: 'INR',
                        conditions: ['being_discontinued_july_2025'],
                        description: 'Rs 50 lakh air accident liability cover (being discontinued July 2025)',
                        isActive: false, // Being discontinued
                    },
                    {
                        benefitType: 'fraud_liability_cover',
                        benefitName: 'Fraud Liability Cover',
                        benefitValue: 100000,
                        benefitCurrency: 'INR',
                        conditions: ['48_hours_to_7_days_post_reporting'],
                        description: 'Rs 1 lakh fraud liability cover',
                        isActive: true,
                    },
                ],
            },
        ],

        uniqueFeatures: [
            'lifestyle_category_focus',
            'multiple_network_variants',
            'birthday_bonus_rewards',
            'comprehensive_golf_benefits',
        ] as string[],

        popularityScore: 79,
        customerSatisfactionScore: 4.2,
        recommendationScore: 76,
    },
] as const;

/**
 * Seed Indian credit cards database - COMPLETED VERSION
 */
export async function seedIndianCreditCards(prisma: PrismaClient): Promise<void> {
    try {
        logger.info('Starting Indian credit cards database seeding...');

        // 1. Seed card categories
        logger.info('Seeding card categories...');
        for (const category of CARD_CATEGORIES) {
            await prisma.cardCategory.upsert({
                where: { id: category.id },
                update: {
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    iconName: category.iconName,
                    color: category.color,
                    sortOrder: category.sortOrder,
                },
                create: {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    iconName: category.iconName,
                    color: category.color,
                    sortOrder: category.sortOrder,
                },
            });
        }

        // 2. Seed card subcategories
        logger.info('Seeding card subcategories...');
        for (const subCategory of CARD_SUBCATEGORIES) {
            await prisma.cardSubCategory.upsert({
                where: { id: subCategory.id },
                update: {
                    categoryId: subCategory.categoryId,
                    name: subCategory.name,
                    slug: subCategory.slug,
                    description: subCategory.description,
                    sortOrder: subCategory.sortOrder,
                },
                create: {
                    id: subCategory.id,
                    categoryId: subCategory.categoryId,
                    name: subCategory.name,
                    slug: subCategory.slug,
                    description: subCategory.description,
                    sortOrder: subCategory.sortOrder,
                },
            });
        }

        // 3. Seed card networks
        logger.info('Seeding card networks...');
        for (const network of CARD_NETWORKS) {
            await prisma.cardNetwork.upsert({
                where: { id: network.id },
                update: {
                    name: network.name,
                    slug: network.slug,
                    description: network.description,
                    iconName: network.iconName,
                    color: network.color,
                    isActive: network.isActive,
                },
                create: {
                    id: network.id,
                    name: network.name,
                    slug: network.slug,
                    description: network.description,
                    iconName: network.iconName,
                    color: network.color,
                    isActive: network.isActive,
                },
            });
        }

        // 4. Seed card issuers
        logger.info('Seeding card issuers...');
        for (const issuer of CARD_ISSUERS) {
            await prisma.cardIssuer.upsert({
                where: { id: issuer.id },
                update: {
                    name: issuer.name,
                    slug: issuer.slug,
                    description: issuer.description,
                    iconName: issuer.iconName,
                    color: issuer.color,
                    isActive: issuer.isActive,
                    marketShare: issuer.marketShare,
                },
                create: {
                    id: issuer.id,
                    name: issuer.name,
                    slug: issuer.slug,
                    description: issuer.description,
                    iconName: issuer.iconName,
                    color: issuer.color,
                    isActive: issuer.isActive,
                    marketShare: issuer.marketShare,
                },
            });
        }

        // 5. Seed reward categories
        logger.info('Seeding reward categories...');
        for (const rewardCategory of REWARD_CATEGORIES) {
            await prisma.rewardCategory.upsert({
                where: { id: rewardCategory.id },
                update: {
                    name: rewardCategory.name,
                    slug: rewardCategory.slug,
                    description: rewardCategory.description,
                    mccCodes: rewardCategory.mccCodes,
                    sortOrder: rewardCategory.sortOrder,
                },
                create: {
                    id: rewardCategory.id,
                    name: rewardCategory.name,
                    slug: rewardCategory.slug,
                    description: rewardCategory.description,
                    mccCodes: rewardCategory.mccCodes,
                    sortOrder: rewardCategory.sortOrder,
                },
            });
        }

        // 6. Seed credit cards
        logger.info('Seeding credit cards...');
        for (const card of INDIAN_CREDIT_CARDS) {
            // First create the main card record
            const createdCard = await prisma.creditCard.upsert({
                where: { id: card.id },
                update: {
                    name: card.name,
                    slug: card.slug,
                    issuerId: card.issuerId,
                    networkId: card.networkId,
                    categoryId: card.categoryId,
                    subCategoryId: card.subCategoryId,
                    description: card.description,
                    iconName: card.iconName,
                    color: card.color,
                    isActive: card.isActive,
                    isLifetimeFree: card.isLifetimeFree,
                    launchDate: card.launchDate ? new Date(card.launchDate) : null,
                    lastUpdated: card.lastUpdated ? new Date(card.lastUpdated) : null,
                    feeStructure: card.feeStructure,
                    eligibilityRequirements: card.eligibilityRequirements,
                    rewardStructure: card.rewardStructure,
                    additionalBenefits: card.additionalBenefits,
                    uniqueFeatures: [...card.uniqueFeatures],
                    popularityScore: card.popularityScore,
                    customerSatisfactionScore: card.customerSatisfactionScore,
                    recommendationScore: card.recommendationScore,
                },
                create: {
                    id: card.id,
                    name: card.name,
                    slug: card.slug,
                    issuerId: card.issuerId,
                    networkId: card.networkId,
                    categoryId: card.categoryId,
                    subCategoryId: card.subCategoryId,
                    description: card.description,
                    iconName: card.iconName,
                    color: card.color,
                    isActive: card.isActive,
                    isLifetimeFree: card.isLifetimeFree,
                    launchDate: card.launchDate ? new Date(card.launchDate) : null,
                    lastUpdated: card.lastUpdated ? new Date(card.lastUpdated) : null,
                    feeStructure: card.feeStructure,
                    eligibilityRequirements: card.eligibilityRequirements,
                    rewardStructure: card.rewardStructure,
                    additionalBenefits: card.additionalBenefits,
                    uniqueFeatures: [...card.uniqueFeatures],
                    popularityScore: card.popularityScore,
                    customerSatisfactionScore: card.customerSatisfactionScore,
                    recommendationScore: card.recommendationScore,
                },
            });

            // Create accelerated reward records for this card
            if (card.rewardStructure?.acceleratedRewards) {
                // First, delete existing accelerated rewards for this card
                await prisma.acceleratedReward.deleteMany({
                    where: { cardId: card.id },
                });

                // Then create new ones
                for (const [index, reward] of card.rewardStructure.acceleratedRewards.entries()) {
                    // Check if reward category exists before creating accelerated reward
                    const rewardCategoryExists = await prisma.rewardCategory.findUnique({
                        where: { id: reward.categoryId }
                    });

                    if (!rewardCategoryExists) {
                        logger.warn(`Reward category ${reward.categoryId} not found for card ${card.name}. Skipping this accelerated reward.`);
                        continue;
                    }

                    await prisma.acceleratedReward.create({
                        data: {
                            cardId: card.id,
                            rewardCategoryId: reward.categoryId,
                            merchantPatterns: reward.merchantPatterns ? [...reward.merchantPatterns] : [],
                            rewardRate: reward.rewardRate,
                            conditions: reward.conditions ? [...reward.conditions] : [],
                            cappingLimit: reward.cappingLimit,
                            cappingPeriod: reward.cappingPeriod,
                            description: reward.description,
                        },
                    });
                }
            }

            logger.info(`Seeded card: ${card.name}`);
        }

        logger.info('Indian credit cards database seeding completed successfully!');
    } catch (error) {
        logger.error('Error seeding Indian credit cards database:', error);
        throw error;
    }
}

// ==================== STRUCTURAL IMPROVEMENTS NEEDED ====================

// 1. ADD VALIDATION HELPER FUNCTIONS
export function validateCardData(card: any): boolean {
    const requiredFields = ['id', 'name', 'slug', 'issuerId', 'networkId', 'categoryId'];
    return requiredFields.every(field => card[field] !== undefined && card[field] !== null);
}

// 2. ADD DATA INTEGRITY CHECKS
export async function verifyDataIntegrity(prisma: PrismaClient): Promise<void> {
    try {
        // Check for duplicate slugs
        const duplicateSlugs = await prisma.creditCard.groupBy({
            by: ['slug'],
            having: {
                slug: {
                    _count: {
                        gt: 1
                    }
                }
            }
        });

        if (duplicateSlugs.length > 0) {
            logger.warn(`Found duplicate slugs: ${duplicateSlugs.map(d => d.slug).join(', ')}`);
        }

        // Check total counts
        const totalCards = await prisma.creditCard.count();
        logger.info(`Total credit cards in database: ${totalCards}`);
    } catch (error) {
        logger.error('Error during data integrity verification:', error);
    }
}

// 3. BATCH PROCESSING FOR PERFORMANCE
export async function seedIndianCreditCardsBatch(prisma: PrismaClient): Promise<void> {
    try {
        // Use transactions for better performance and data consistency
        await prisma.$transaction(async (tx) => {
            // Seed all lookup tables first
            await Promise.all([
                ...CARD_CATEGORIES.map(category =>
                    tx.cardCategory.upsert({
                        where: { id: category.id },
                        update: {
                            name: category.name,
                            slug: category.slug,
                            description: category.description,
                            iconName: category.iconName,
                            color: category.color,
                            sortOrder: category.sortOrder,
                        },
                        create: {
                            id: category.id,
                            name: category.name,
                            slug: category.slug,
                            description: category.description,
                            iconName: category.iconName,
                            color: category.color,
                            sortOrder: category.sortOrder,
                        }
                    })
                )
            ]);

            // Then seed cards in batches
            const batchSize = 10;
            for (let i = 0; i < INDIAN_CREDIT_CARDS.length; i += batchSize) {
                const batch = INDIAN_CREDIT_CARDS.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(card =>
                        tx.creditCard.upsert({
                            where: { id: card.id },
                            update: {
                                name: card.name,
                                slug: card.slug,
                                issuerId: card.issuerId,
                                networkId: card.networkId,
                                categoryId: card.categoryId,
                                subCategoryId: card.subCategoryId,
                                description: card.description,
                                iconName: card.iconName,
                                color: card.color,
                                isActive: card.isActive,
                                isLifetimeFree: card.isLifetimeFree,
                                launchDate: card.launchDate ? new Date(card.launchDate) : null,
                                lastUpdated: card.lastUpdated ? new Date(card.lastUpdated) : null,
                                feeStructure: card.feeStructure,
                                eligibilityRequirements: card.eligibilityRequirements,
                                rewardStructure: card.rewardStructure,
                                additionalBenefits: card.additionalBenefits,
                                uniqueFeatures: [...card.uniqueFeatures],
                                popularityScore: card.popularityScore,
                                customerSatisfactionScore: card.customerSatisfactionScore,
                                recommendationScore: card.recommendationScore,
                            },
                            create: {
                                id: card.id,
                                name: card.name,
                                slug: card.slug,
                                issuerId: card.issuerId,
                                networkId: card.networkId,
                                categoryId: card.categoryId,
                                subCategoryId: card.subCategoryId,
                                description: card.description,
                                iconName: card.iconName,
                                color: card.color,
                                isActive: card.isActive,
                                isLifetimeFree: card.isLifetimeFree,
                                launchDate: card.launchDate ? new Date(card.launchDate) : null,
                                lastUpdated: card.lastUpdated ? new Date(card.lastUpdated) : null,
                                feeStructure: card.feeStructure,
                                eligibilityRequirements: card.eligibilityRequirements,
                                rewardStructure: card.rewardStructure,
                                additionalBenefits: card.additionalBenefits,
                                uniqueFeatures: [...card.uniqueFeatures],
                                popularityScore: card.popularityScore,
                                customerSatisfactionScore: card.customerSatisfactionScore,
                                recommendationScore: card.recommendationScore,
                            }
                        })
                    )
                );
            }
        });
    } catch (error) {
        logger.error('Batch seeding failed:', error);
        throw error;
    }
}