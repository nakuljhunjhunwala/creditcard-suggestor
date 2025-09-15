import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.util';

/**
 * Main spending categories for credit card transactions - India specific
 */
const CATEGORIES = [
  {
    id: 'cat_ecommerce',
    name: 'E-commerce & Online Shopping',
    slug: 'ecommerce',
    description: 'Flipkart, Amazon India, Myntra, JioMart, and online retail platforms',
    iconName: 'shopping-bag',
    color: '#FF6B6B',
    sortOrder: 10,
  },
  {
    id: 'cat_grocery',
    name: 'Groceries & Quick Commerce',
    slug: 'grocery',
    description: 'Supermarkets, kirana stores, BigBasket, Blinkit, Swiggy Instamart, and quick delivery',
    iconName: 'shopping-cart',
    color: '#4ECDC4',
    sortOrder: 20,
  },
  {
    id: 'cat_utilities',
    name: 'Utilities & Digital Services',
    slug: 'utilities',
    description: 'Mobile recharges, DTH, electricity bills, internet, and digital wallet top-ups',
    iconName: 'zap',
    color: '#45B7D1',
    sortOrder: 30,
  },
  {
    id: 'cat_dining',
    name: 'Dining & Food Delivery',
    slug: 'dining',
    description: 'Restaurants, Zomato, Swiggy, street food, cafes, and food delivery services',
    iconName: 'utensils',
    color: '#96CEB4',
    sortOrder: 40,
  },
  {
    id: 'cat_fuel',
    name: 'Fuel & Automotive',
    slug: 'fuel',
    description: 'Petrol pumps, diesel, two-wheeler fuel, car services, and automotive maintenance',
    iconName: 'gas-pump',
    color: '#FFEAA7',
    sortOrder: 50,
  },
  {
    id: 'cat_transport',
    name: 'Transportation',
    slug: 'transport',
    description: 'Metro, buses, auto-rickshaws, Ola, Uber, trains, and local transportation',
    iconName: 'car',
    color: '#DDA0DD',
    sortOrder: 60,
  },
  {
    id: 'cat_travel',
    name: 'Travel & Tourism',
    slug: 'travel',
    description: 'Airlines, hotels, MakeMyTrip, Goibibo, railway bookings, and travel services',
    iconName: 'plane',
    color: '#98D8C8',
    sortOrder: 70,
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment & OTT',
    slug: 'entertainment',
    description: 'Disney+ Hotstar, Netflix, BookMyShow, gaming, and entertainment subscriptions',
    iconName: 'film',
    color: '#F7DC6F',
    sortOrder: 80,
  },
  {
    id: 'cat_healthcare',
    name: 'Healthcare & Wellness',
    slug: 'healthcare',
    description: 'Hospitals, Apollo, pharmacy, diagnostic centers, and medical services',
    iconName: 'heart',
    color: '#BB8FCE',
    sortOrder: 90,
  },
  {
    id: 'cat_education',
    name: 'Education & Coaching',
    slug: 'education',
    description: 'Schools, BYJU\'S, Unacademy, competitive coaching, and online courses',
    iconName: 'book',
    color: '#85C1E9',
    sortOrder: 100,
  },
  {
    id: 'cat_shopping',
    name: 'Retail Shopping',
    slug: 'shopping',
    description: 'Reliance Retail, Tata stores, malls, clothing, electronics, and offline retail',
    iconName: 'store',
    color: '#82E0AA',
    sortOrder: 110,
  },
  {
    id: 'cat_finance',
    name: 'Financial Services',
    slug: 'finance',
    description: 'Banking, insurance, mutual funds, loan EMIs, and investment platforms',
    iconName: 'dollar-sign',
    color: '#F8C471',
    sortOrder: 120,
  },
  {
    id: 'cat_home',
    name: 'Home & Lifestyle',
    slug: 'home',
    description: 'Home improvement, furniture, Urban Company, appliances, and household services',
    iconName: 'home',
    color: '#AED6F1',
    sortOrder: 130,
  },
  {
    id: 'cat_other',
    name: 'Other',
    slug: 'other',
    description: 'Miscellaneous and uncategorized transactions',
    iconName: 'more-horizontal',
    color: '#D5DBDB',
    sortOrder: 140,
  },
] as const;

/**
 * Subcategories for detailed transaction classification - India specific
 */
const SUBCATEGORIES = [
  // E-commerce subcategories
  {
    id: 'subcat_marketplace',
    categoryId: 'cat_ecommerce',
    name: 'Online Marketplaces',
    slug: 'marketplace',
    description: 'Flipkart, Amazon India, and multi-category e-commerce platforms',
    sortOrder: 10,
  },
  {
    id: 'subcat_fashion_online',
    categoryId: 'cat_ecommerce',
    name: 'Fashion & Lifestyle',
    slug: 'fashion-online',
    description: 'Myntra, AJIO, Nykaa, and online fashion platforms',
    sortOrder: 20,
  },
  {
    id: 'subcat_electronics_online',
    categoryId: 'cat_ecommerce',
    name: 'Electronics & Gadgets',
    slug: 'electronics-online',
    description: 'Croma, Vijay Sales, and online electronics purchases',
    sortOrder: 30,
  },

  // Grocery subcategories
  {
    id: 'subcat_quick_commerce',
    categoryId: 'cat_grocery',
    name: 'Quick Commerce',
    slug: 'quick-commerce',
    description: 'Blinkit, Swiggy Instamart, Zepto, and 10-30 minute delivery',
    sortOrder: 10,
  },
  {
    id: 'subcat_supermarkets',
    categoryId: 'cat_grocery',
    name: 'Supermarkets & Hypermarkets',
    slug: 'supermarkets',
    description: 'Reliance Fresh, More, Spencer\'s, and large grocery stores',
    sortOrder: 20,
  },
  {
    id: 'subcat_kirana_local',
    categoryId: 'cat_grocery',
    name: 'Kirana & Local Stores',
    slug: 'kirana-local',
    description: 'Local grocery stores, neighborhood shops, and traditional retailers',
    sortOrder: 30,
  },
  {
    id: 'subcat_online_grocery',
    categoryId: 'cat_grocery',
    name: 'Online Grocery',
    slug: 'online-grocery',
    description: 'BigBasket, JioMart, Amazon Fresh, and scheduled grocery delivery',
    sortOrder: 40,
  },

  // Utilities subcategories
  {
    id: 'subcat_mobile_recharge',
    categoryId: 'cat_utilities',
    name: 'Mobile & DTH Recharge',
    slug: 'mobile-recharge',
    description: 'Prepaid recharges, DTH subscriptions, and telecom services',
    sortOrder: 10,
  },
  {
    id: 'subcat_electricity_bills',
    categoryId: 'cat_utilities',
    name: 'Electricity & Water Bills',
    slug: 'electricity-bills',
    description: 'State electricity boards, Adani Power, and utility bill payments',
    sortOrder: 20,
  },
  {
    id: 'subcat_digital_wallets',
    categoryId: 'cat_utilities',
    name: 'Digital Wallet Top-ups',
    slug: 'digital-wallets',
    description: 'Paytm, PhonePe, Google Pay wallet loading and digital payments',
    sortOrder: 30,
  },
  {
    id: 'subcat_internet_broadband',
    categoryId: 'cat_utilities',
    name: 'Internet & Broadband',
    slug: 'internet-broadband',
    description: 'Jio Fiber, Airtel Broadband, and internet service providers',
    sortOrder: 40,
  },

  // Dining subcategories
  {
    id: 'subcat_food_delivery',
    categoryId: 'cat_dining',
    name: 'Food Delivery Apps',
    slug: 'food-delivery',
    description: 'Zomato, Swiggy, and online food ordering platforms',
    sortOrder: 10,
  },
  {
    id: 'subcat_restaurants',
    categoryId: 'cat_dining',
    name: 'Restaurants & Fine Dining',
    slug: 'restaurants',
    description: 'Full-service restaurants and dining establishments',
    sortOrder: 20,
  },
  {
    id: 'subcat_quick_service',
    categoryId: 'cat_dining',
    name: 'Quick Service & Fast Food',
    slug: 'quick-service',
    description: 'McDonald\'s, KFC, Domino\'s, and quick service restaurants',
    sortOrder: 30,
  },
  {
    id: 'subcat_cafes_beverages',
    categoryId: 'cat_dining',
    name: 'Cafes & Beverages',
    slug: 'cafes-beverages',
    description: 'Starbucks, CCD, tea stalls, and beverage establishments',
    sortOrder: 40,
  },
  {
    id: 'subcat_street_food',
    categoryId: 'cat_dining',
    name: 'Street Food & Local Vendors',
    slug: 'street-food',
    description: 'Street vendors, local food stalls, and traditional food outlets',
    sortOrder: 50,
  },

  // Fuel subcategories
  {
    id: 'subcat_petrol_stations',
    categoryId: 'cat_fuel',
    name: 'Petrol Stations',
    slug: 'petrol-stations',
    description: 'Indian Oil, BPCL, HPCL, and fuel purchases',
    sortOrder: 10,
  },
  {
    id: 'subcat_automotive_services',
    categoryId: 'cat_fuel',
    name: 'Automotive Services',
    slug: 'automotive-services',
    description: 'Car/bike maintenance, repairs, and automotive services',
    sortOrder: 20,
  },

  // Transportation subcategories
  {
    id: 'subcat_ride_hailing',
    categoryId: 'cat_transport',
    name: 'Ride-hailing Services',
    slug: 'ride-hailing',
    description: 'Ola, Uber, auto-rickshaw booking, and ride-sharing apps',
    sortOrder: 10,
  },
  {
    id: 'subcat_public_transport',
    categoryId: 'cat_transport',
    name: 'Public Transport',
    slug: 'public-transport',
    description: 'Metro, buses, local trains, and public transportation',
    sortOrder: 20,
  },
  {
    id: 'subcat_auto_rickshaw',
    categoryId: 'cat_transport',
    name: 'Auto-rickshaw & Local Transport',
    slug: 'auto-rickshaw',
    description: 'Three-wheelers, shared autos, and local transportation',
    sortOrder: 30,
  },
  {
    id: 'subcat_parking_tolls',
    categoryId: 'cat_transport',
    name: 'Parking & Tolls',
    slug: 'parking-tolls',
    description: 'Parking fees, highway tolls, and infrastructure charges',
    sortOrder: 40,
  },

  // Travel subcategories
  {
    id: 'subcat_flight_bookings',
    categoryId: 'cat_travel',
    name: 'Flight Bookings',
    slug: 'flight-bookings',
    description: 'Airlines, MakeMyTrip, Goibibo, and flight reservations',
    sortOrder: 10,
  },
  {
    id: 'subcat_hotels_accommodation',
    categoryId: 'cat_travel',
    name: 'Hotels & Accommodation',
    slug: 'hotels-accommodation',
    description: 'Hotels, OYO, homestays, and lodging services',
    sortOrder: 20,
  },
  {
    id: 'subcat_railway_bookings',
    categoryId: 'cat_travel',
    name: 'Railway Bookings',
    slug: 'railway-bookings',
    description: 'IRCTC, train tickets, and railway reservations',
    sortOrder: 30,
  },
  {
    id: 'subcat_travel_packages',
    categoryId: 'cat_travel',
    name: 'Travel Packages & Tours',
    slug: 'travel-packages',
    description: 'Holiday packages, tour operators, and travel agencies',
    sortOrder: 40,
  },

  // Entertainment subcategories
  {
    id: 'subcat_ott_streaming',
    categoryId: 'cat_entertainment',
    name: 'OTT & Streaming Platforms',
    slug: 'ott-streaming',
    description: 'Disney+ Hotstar, Netflix, Prime Video, and streaming services',
    sortOrder: 10,
  },
  {
    id: 'subcat_movies_events',
    categoryId: 'cat_entertainment',
    name: 'Movies & Events',
    slug: 'movies-events',
    description: 'BookMyShow, cinema tickets, concerts, and live events',
    sortOrder: 20,
  },
  {
    id: 'subcat_gaming_digital',
    categoryId: 'cat_entertainment',
    name: 'Gaming & Digital Content',
    slug: 'gaming-digital',
    description: 'Mobile games, Steam, and digital entertainment purchases',
    sortOrder: 30,
  },

  // Healthcare subcategories
  {
    id: 'subcat_hospitals_medical',
    categoryId: 'cat_healthcare',
    name: 'Hospitals & Medical Services',
    slug: 'hospitals-medical',
    description: 'Apollo Hospitals, Fortis, and medical consultations',
    sortOrder: 10,
  },
  {
    id: 'subcat_pharmacies_medicines',
    categoryId: 'cat_healthcare',
    name: 'Pharmacies & Medicines',
    slug: 'pharmacies-medicines',
    description: 'Apollo Pharmacy, Netmeds, and medicine purchases',
    sortOrder: 20,
  },
  {
    id: 'subcat_diagnostic_tests',
    categoryId: 'cat_healthcare',
    name: 'Diagnostic & Lab Tests',
    slug: 'diagnostic-tests',
    description: 'Pathology labs, diagnostic centers, and health checkups',
    sortOrder: 30,
  },

  // Education subcategories
  {
    id: 'subcat_online_coaching',
    categoryId: 'cat_education',
    name: 'Online Coaching & EdTech',
    slug: 'online-coaching',
    description: 'BYJU\'S, Unacademy, Vedantu, and online learning platforms',
    sortOrder: 10,
  },
  {
    id: 'subcat_competitive_exams',
    categoryId: 'cat_education',
    name: 'Competitive Exam Prep',
    slug: 'competitive-exams',
    description: 'IIT-JEE, NEET, UPSC coaching institutes and exam preparation',
    sortOrder: 20,
  },
  {
    id: 'subcat_schools_colleges',
    categoryId: 'cat_education',
    name: 'Schools & Colleges',
    slug: 'schools-colleges',
    description: 'School fees, college fees, and educational institutions',
    sortOrder: 30,
  },

  // Shopping subcategories
  {
    id: 'subcat_retail_stores',
    categoryId: 'cat_shopping',
    name: 'Retail Stores & Malls',
    slug: 'retail-stores',
    description: 'Reliance Retail, Westside, malls, and physical retail stores',
    sortOrder: 10,
  },
  {
    id: 'subcat_clothing_fashion',
    categoryId: 'cat_shopping',
    name: 'Clothing & Fashion',
    slug: 'clothing-fashion',
    description: 'Clothing stores, fashion retailers, and apparel purchases',
    sortOrder: 20,
  },
  {
    id: 'subcat_electronics_appliances',
    categoryId: 'cat_shopping',
    name: 'Electronics & Appliances',
    slug: 'electronics-appliances',
    description: 'Croma, Vijay Sales, and electronics retail stores',
    sortOrder: 30,
  },

  // Home subcategories
  {
    id: 'subcat_home_services',
    categoryId: 'cat_home',
    name: 'Home Services',
    slug: 'home-services',
    description: 'Urban Company, cleaning, repairs, and household services',
    sortOrder: 10,
  },
  {
    id: 'subcat_furniture_decor',
    categoryId: 'cat_home',
    name: 'Furniture & Home Decor',
    slug: 'furniture-decor',
    description: 'Furniture stores, home decor, and household items',
    sortOrder: 20,
  },
] as const;

/**
 * Seed categories
 */
export async function seedCategories(prisma: PrismaClient): Promise<void> {
  try {
    for (const category of CATEGORIES) {
      await prisma.category.upsert({
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

    logger.info(`✅ Successfully seeded ${CATEGORIES.length} categories`);
  } catch (error) {
    logger.error('❌ Error seeding categories:', error);
    throw error;
  }
}

/**
 * Seed subcategories
 */
export async function seedSubCategories(prisma: PrismaClient): Promise<void> {
  try {
    for (const subCategory of SUBCATEGORIES) {
      await prisma.subCategory.upsert({
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

    logger.info(`✅ Successfully seeded ${SUBCATEGORIES.length} subcategories`);
  } catch (error) {
    logger.error('❌ Error seeding subcategories:', error);
    throw error;
  }
}