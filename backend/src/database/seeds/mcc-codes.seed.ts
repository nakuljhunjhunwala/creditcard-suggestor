import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.util';

/**
 * Comprehensive Indian MCC codes with merchant patterns for intelligent categorization
 * Based on RuPay, Visa, Mastercard, and Amex standards for India
 * Aligned with Indian category and subcategory structure
 */
const INDIAN_MCC_CODES = [
    // === E-COMMERCE & ONLINE SHOPPING ===
    {
        id: 'mcc_5399_marketplace',
        code: '5399',
        categoryId: 'cat_ecommerce',
        subCategoryId: 'subcat_marketplace',
        description: 'Online Marketplaces - General Merchandise',
        merchantPatterns: [
            // Major e-commerce platforms
            'amazon', 'amazon.in', 'flipkart', 'snapdeal', 'paytm mall',
            'shopclues', 'jiomart online', 'meesho', 'shopsy', 'glowroad',
            'udaan', 'business2business', 'india mart', 'trade india',
            // Marketplace patterns
            'online shopping', 'e-commerce', 'marketplace', 'multi-category'
        ],
        tags: ['e-commerce', 'marketplace', 'amazon', 'flipkart', 'online-shopping'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5651_fashion_online',
        code: '5651',
        categoryId: 'cat_ecommerce',
        subCategoryId: 'subcat_fashion_online',
        description: 'Online Fashion & Lifestyle Stores',
        merchantPatterns: [
            // Fashion e-commerce
            'myntra', 'ajio', 'jabong', 'koovs', 'limeroad', 'voonik',
            'tata cliq fashion', 'nykaa fashion', 'lifestyle stores',
            // Beauty and fashion online
            'nykaa', 'purplle', 'sugar cosmetics', 'mamaearth',
            // Fashion brands online
            'zara online', 'h&m online', 'uniqlo online', 'forever 21 online'
        ],
        tags: ['fashion-online', 'myntra', 'ajio', 'nykaa', 'online-fashion'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5732_electronics_online',
        code: '5732',
        categoryId: 'cat_ecommerce',
        subCategoryId: 'subcat_electronics_online',
        description: 'Online Electronics & Gadgets Stores',
        merchantPatterns: [
            // Electronics e-commerce
            'amazon electronics', 'flipkart electronics', 'tatacliq electronics',
            'croma online', 'reliance digital online', 'vijay sales online',
            // Brand stores online
            'mi store online', 'xiaomi online', 'samsung online', 'apple store online',
            'oneplus store', 'realme store', 'oppo store', 'vivo store'
        ],
        tags: ['electronics-online', 'gadgets-online', 'mobile-online', 'appliances-online'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === GROCERIES & QUICK COMMERCE ===
    {
        id: 'mcc_5499_quick_commerce',
        code: '5499',
        categoryId: 'cat_grocery',
        subCategoryId: 'subcat_quick_commerce',
        description: 'Quick Commerce & Instant Delivery',
        merchantPatterns: [
            // Quick commerce platforms
            'blinkit', 'swiggy instamart', 'zepto', 'dunzo', 'bb instant',
            'amazon fresh instant', 'flipkart quick', 'jiomart express',
            'grofers now', 'milk basket', 'daily ninja', 'supr daily',
            // Quick delivery patterns
            'instant delivery', 'quick commerce', '10 minute delivery',
            '30 minute delivery', 'express grocery'
        ],
        tags: ['quick-commerce', 'blinkit', 'instamart', 'zepto', 'instant-delivery'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5411_supermarkets',
        code: '5411',
        categoryId: 'cat_grocery',
        subCategoryId: 'subcat_supermarkets',
        description: 'Supermarkets & Hypermarkets',
        merchantPatterns: [
            // Major retail chains
            'reliance fresh', 'reliance smart', 'big bazaar', 'more supermarket',
            'dmart', 'avenue supermarts', 'spencer retail', 'food bazaar',
            'hypercity', 'star bazaar', 'easy day', 'nilgiris',
            'godrej nature basket', 'le marche', 'supermarket', 'hypermarket'
        ],
        tags: ['supermarket', 'reliance-fresh', 'dmart', 'big-bazaar', 'grocery-store'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5499_kirana_local',
        code: '5499',
        categoryId: 'cat_grocery',
        subCategoryId: 'subcat_kirana_local',
        description: 'Kirana & Local Grocery Stores',
        merchantPatterns: [
            // Local stores
            'kirana', 'kirana store', 'general store', 'provision store',
            'local grocery', 'neighborhood store', 'corner shop',
            'family mart', 'grocery shop', 'provisions', 'local mart'
        ],
        tags: ['kirana', 'local-grocery', 'neighborhood-store', 'general-store'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5411_online_grocery',
        code: '5411',
        categoryId: 'cat_grocery',
        subCategoryId: 'subcat_online_grocery',
        description: 'Online Grocery Delivery',
        merchantPatterns: [
            // Online grocery platforms
            'bigbasket', 'grofers', 'jiomart', 'amazon fresh', 'flipkart grocery',
            'nature basket online', 'dmart ready', 'bb daily', 'big basket'
        ],
        tags: ['online-grocery', 'bigbasket', 'jiomart', 'amazon-fresh', 'grofers'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === UTILITIES & DIGITAL SERVICES ===
    {
        id: 'mcc_4814_mobile_recharge',
        code: '4814',
        categoryId: 'cat_utilities',
        subCategoryId: 'subcat_mobile_recharge',
        description: 'Mobile & DTH Recharge Services',
        merchantPatterns: [
            // Mobile operators
            'jio recharge', 'airtel recharge', 'vi recharge', 'vodafone idea recharge',
            'bsnl recharge', 'mtnl recharge',
            // DTH services
            'tata sky', 'dish tv', 'sun direct', 'd2h', 'airtel digital tv',
            // Recharge platforms
            'paytm recharge', 'mobikwik recharge', 'freecharge', 'amazon pay recharge',
            'phonepe recharge', 'google pay recharge'
        ],
        tags: ['mobile-recharge', 'dth', 'telecom', 'jio', 'airtel'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_4900_electricity_bills',
        code: '4900',
        categoryId: 'cat_utilities',
        subCategoryId: 'subcat_electricity_bills',
        description: 'Electricity & Water Bill Payments',
        merchantPatterns: [
            // Electricity boards
            'adani electricity', 'tata power', 'reliance energy', 'bescom',
            'kseb', 'tneb', 'mseb', 'pseb', 'uppcl', 'bseb', 'wbsedcl',
            'aptransco', 'tsspdcl', 'rrvpnl', 'jvvnl', 'dhbvn', 'uhbvn',
            // Water utilities
            'delhi jal board', 'mumbai water', 'bangalore water supply',
            'chennai water', 'hyderabad water', 'kolkata water',
            // Gas utilities
            'indraprastha gas', 'mahanagar gas', 'gujarat gas'
        ],
        tags: ['electricity-bill', 'water-bill', 'utility-payment', 'adani-power', 'tata-power'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_6540_digital_wallets',
        code: '6540',
        categoryId: 'cat_utilities',
        subCategoryId: 'subcat_digital_wallets',
        description: 'Digital Wallet Top-ups & UPI',
        merchantPatterns: [
            // Digital wallets
            'paytm', 'paytm wallet', 'mobikwik', 'mobikwik wallet', 'freecharge',
            'amazon pay', 'phonepe', 'google pay', 'gpay', 'bhim upi',
            'ola money', 'airtel money', 'jio money', 'yono wallet',
            'axis pay', 'icici pockets', 'hdfc payzapp', 'sbi buddy'
        ],
        tags: ['digital-wallet', 'upi', 'paytm', 'phonepe', 'gpay', 'wallet-topup'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_4814_internet_broadband',
        code: '4814',
        categoryId: 'cat_utilities',
        subCategoryId: 'subcat_internet_broadband',
        description: 'Internet & Broadband Services',
        merchantPatterns: [
            // Broadband providers
            'jio fiber', 'airtel xstream', 'bsnl broadband', 'railwire',
            'hathway', 'tikona', 'spectranet', 'act fibernet',
            'you broadband', 'alliance broadband'
        ],
        tags: ['broadband', 'internet', 'jio-fiber', 'airtel-broadband', 'wifi'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === DINING & FOOD DELIVERY ===
    {
        id: 'mcc_5814_food_delivery',
        code: '5814',
        categoryId: 'cat_dining',
        subCategoryId: 'subcat_food_delivery',
        description: 'Food Delivery Apps & Platforms',
        merchantPatterns: [
            // Food delivery platforms
            'swiggy', 'zomato', 'uber eats', 'food panda', 'dunzo food',
            'box8', 'faasos', 'oven story', 'behrouz biryani', 'the good bowl',
            'lunch box', 'fresh menu', 'eatfit', 'rebel foods'
        ],
        tags: ['food-delivery', 'swiggy', 'zomato', 'uber-eats', 'online-food'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5812_restaurants',
        code: '5812',
        categoryId: 'cat_dining',
        subCategoryId: 'subcat_restaurants',
        description: 'Restaurants & Fine Dining',
        merchantPatterns: [
            // Restaurant chains
            'haldirams restaurant', 'barbeque nation', 'mainland china', 'punjab grill',
            'saravana bhavan', 'paradise biryani', 'absolute barbecues',
            // Fine dining patterns
            'restaurant', 'fine dining', 'family restaurant', 'casual dining',
            'dhaba', 'biryani house', 'south indian restaurant', 'north indian restaurant'
        ],
        tags: ['restaurant', 'fine-dining', 'casual-dining', 'indian-restaurant'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5814_quick_service',
        code: '5814',
        categoryId: 'cat_dining',
        subCategoryId: 'subcat_quick_service',
        description: 'Quick Service & Fast Food',
        merchantPatterns: [
            // International fast food
            'mcdonalds', 'kfc', 'pizza hut', 'dominos', 'burger king', 'subway',
            'taco bell', 'dunkin donuts', 'baskin robbins',
            // Indian QSR
            'wow momo', 'goli vada pav', 'jumboking', 'chai kings'
        ],
        tags: ['fast-food', 'qsr', 'quick-service', 'mcdonalds', 'kfc', 'dominos'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5499_cafes_beverages',
        code: '5499',
        categoryId: 'cat_dining',
        subCategoryId: 'subcat_cafes_beverages',
        description: 'Cafes & Beverage Establishments',
        merchantPatterns: [
            // Coffee chains
            'starbucks', 'costa coffee', 'cafe coffee day', 'ccd', 'barista',
            'blue tokai', 'third wave coffee', 'chaayos', 'chai point',
            // Local cafes
            'cafe', 'coffee shop', 'tea stall', 'irani cafe', 'filter coffee'
        ],
        tags: ['cafe', 'coffee', 'tea', 'starbucks', 'ccd', 'beverages'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5812_street_food',
        code: '5812',
        categoryId: 'cat_dining',
        subCategoryId: 'subcat_street_food',
        description: 'Street Food & Local Vendors',
        merchantPatterns: [
            'street food', 'food cart', 'local vendor', 'roadside stall',
            'chaat', 'pani puri', 'dosa cart', 'vada pav stall',
            'tea vendor', 'juice stall', 'local eatery'
        ],
        tags: ['street-food', 'local-vendor', 'chaat', 'roadside-food'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === FUEL & AUTOMOTIVE ===
    {
        id: 'mcc_5541_petrol_stations',
        code: '5541',
        categoryId: 'cat_fuel',
        subCategoryId: 'subcat_petrol_stations',
        description: 'Petrol Stations & Fuel Purchase',
        merchantPatterns: [
            // Indian Oil companies
            'indian oil', 'iocl', 'bharat petroleum', 'bpcl', 'hindustan petroleum',
            'hpcl', 'reliance petroleum', 'essar oil', 'nayara energy',
            'shell india', 'total energies'
        ],
        tags: ['petrol', 'diesel', 'fuel', 'indian-oil', 'bpcl', 'hpcl'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_7538_automotive_services',
        code: '7538',
        categoryId: 'cat_fuel',
        subCategoryId: 'subcat_automotive_services',
        description: 'Automotive Services & Maintenance',
        merchantPatterns: [
            'car service', 'bike service', 'automotive repair', 'car wash',
            'oil change', 'tire service', 'battery service', 'garage',
            'motor service', 'vehicle maintenance'
        ],
        tags: ['car-service', 'automotive-repair', 'vehicle-maintenance', 'garage'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === TRANSPORTATION ===
    {
        id: 'mcc_4121_ride_hailing',
        code: '4121',
        categoryId: 'cat_transport',
        subCategoryId: 'subcat_ride_hailing',
        description: 'Ride-hailing Services & App-based Transport',
        merchantPatterns: [
            // Ride-hailing platforms
            'ola', 'ola cabs', 'uber', 'uber india', 'rapido', 'namma yatri',
            'blu smart', 'quick ride', 'sride', 'bla bla car',
            // Traditional services
            'meru cabs', 'mega cabs', 'taxi for sure'
        ],
        tags: ['ride-hailing', 'ola', 'uber', 'rapido', 'taxi', 'cab'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_4111_public_transport',
        code: '4111',
        categoryId: 'cat_transport',
        subCategoryId: 'subcat_public_transport',
        description: 'Public Transportation Systems',
        merchantPatterns: [
            // Metro systems
            'delhi metro', 'mumbai metro', 'bangalore metro', 'kolkata metro',
            'chennai metro', 'hyderabad metro', 'kochi metro', 'jaipur metro',
            // Bus services
            'bmtc', 'best', 'dtc', 'ksrtc', 'tsrtc', 'apsrtc', 'msrtc',
            'volvo bus', 'city bus', 'ac bus'
        ],
        tags: ['metro', 'bus', 'public-transport', 'delhi-metro', 'city-bus'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_4121_auto_rickshaw',
        code: '4121',
        categoryId: 'cat_transport',
        subCategoryId: 'subcat_auto_rickshaw',
        description: 'Auto-rickshaw & Local Transport',
        merchantPatterns: [
            'auto rickshaw', 'auto', 'three wheeler', 'shared auto',
            'local transport', 'rickshaw', 'tempo', 'share auto'
        ],
        tags: ['auto-rickshaw', 'three-wheeler', 'local-transport', 'shared-auto'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_4784_parking_tolls',
        code: '4784',
        categoryId: 'cat_transport',
        subCategoryId: 'subcat_parking_tolls',
        description: 'Parking Fees & Highway Tolls',
        merchantPatterns: [
            'toll plaza', 'highway toll', 'express highway', 'fastag',
            'parking fee', 'mall parking', 'airport parking', 'valet parking'
        ],
        tags: ['toll', 'parking', 'fastag', 'highway-toll', 'parking-fee'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === TRAVEL & TOURISM ===
    {
        id: 'mcc_3000_flight_bookings',
        code: '3000',
        categoryId: 'cat_travel',
        subCategoryId: 'subcat_flight_bookings',
        description: 'Flight Bookings & Airlines',
        merchantPatterns: [
            // Indian airlines
            'air india', 'indigo', 'spicejet', 'go first', 'vistara',
            'air asia india', 'alliance air',
            // International airlines
            'emirates', 'qatar airways', 'singapore airlines', 'etihad',
            // Booking platforms
            'makemytrip flights', 'goibibo flights', 'cleartrip flights',
            'yatra flights', 'ixigo flights'
        ],
        tags: ['flight', 'airline', 'air-india', 'indigo', 'spicejet', 'flight-booking'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_7011_hotels_accommodation',
        code: '7011',
        categoryId: 'cat_travel',
        subCategoryId: 'subcat_hotels_accommodation',
        description: 'Hotels & Accommodation Services',
        merchantPatterns: [
            // Hotel chains
            'taj hotels', 'oberoi', 'leela', 'itc hotels', 'hyatt', 'marriott',
            'hilton', 'radisson', 'sheraton', 'westin',
            // Budget accommodations
            'oyo', 'oyo rooms', 'zostel', 'treebo', 'fab hotels',
            'spot on', 'capital o', 'collection o',
            // Booking platforms
            'makemytrip hotels', 'goibibo hotels', 'booking.com'
        ],
        tags: ['hotel', 'accommodation', 'oyo', 'taj', 'marriott', 'booking'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_4112_railway_bookings',
        code: '4112',
        categoryId: 'cat_travel',
        subCategoryId: 'subcat_railway_bookings',
        description: 'Railway Bookings & Train Services',
        merchantPatterns: [
            'irctc', 'indian railways', 'railway booking', 'train booking',
            'tatkal booking', 'uts', 'unreserved ticketing', 'platform ticket',
            'railway enquiry', 'pnr status', 'confirm ticket'
        ],
        tags: ['railway', 'irctc', 'train', 'train-booking', 'tatkal'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_4722_travel_packages',
        code: '4722',
        categoryId: 'cat_travel',
        subCategoryId: 'subcat_travel_packages',
        description: 'Travel Packages & Tour Operators',
        merchantPatterns: [
            // Travel agencies
            'cox and kings', 'thomas cook', 'sotc', 'club mahindra',
            'sterling holidays', 'travel triangle', 'thrillophilia',
            'indian holidays', 'kesari tours', 'veena world',
            // Holiday packages
            'holiday package', 'tour package', 'travel agency'
        ],
        tags: ['travel-package', 'tour-operator', 'holiday-package', 'travel-agency'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === ENTERTAINMENT & OTT ===
    {
        id: 'mcc_5815_ott_streaming',
        code: '5815',
        categoryId: 'cat_entertainment',
        subCategoryId: 'subcat_ott_streaming',
        description: 'OTT & Streaming Platforms',
        merchantPatterns: [
            // Streaming services
            'netflix', 'amazon prime', 'disney hotstar', 'sony liv', 'zee5',
            'voot', 'alt balaji', 'mx player', 'jio cinema', 'eros now',
            'hungama play', 'aha', 'hoichoi', 'addatimes',
            // Music streaming
            'spotify', 'gaana', 'jiosaavn', 'wynk music', 'amazon music',
            'youtube music', 'apple music', 'hungama music'
        ],
        tags: ['ott', 'streaming', 'netflix', 'hotstar', 'prime-video', 'music-streaming'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_7832_movies_events',
        code: '7832',
        categoryId: 'cat_entertainment',
        subCategoryId: 'subcat_movies_events',
        description: 'Movies & Live Events',
        merchantPatterns: [
            // Cinema chains
            'pvr cinemas', 'inox', 'cinepolis', 'carnival cinemas', 'fun cinemas',
            'wave cinemas', 'miraj cinemas', 'mukta cinemas',
            // Booking platforms
            'bookmyshow', 'paytm movies', 'movie booking', 'concert booking',
            'event booking', 'live events'
        ],
        tags: ['cinema', 'movies', 'pvr', 'inox', 'bookmyshow', 'live-events'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5816_gaming_digital',
        code: '5816',
        categoryId: 'cat_entertainment',
        subCategoryId: 'subcat_gaming_digital',
        description: 'Gaming & Digital Content',
        merchantPatterns: [
            // Mobile gaming
            'pubg mobile', 'free fire', 'cod mobile', 'clash of clans',
            'candy crush', 'temple run', 'subway surfers',
            // Gaming platforms
            'steam', 'epic games', 'google play games',
            // Real money gaming
            'dream11', 'mpl', 'winzo', 'paytm first games', 'gamezy',
            'my11circle', 'fanfight'
        ],
        tags: ['gaming', 'mobile-games', 'fantasy-sports', 'steam', 'dream11'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === HEALTHCARE & WELLNESS ===
    {
        id: 'mcc_8062_hospitals_medical',
        code: '8062',
        categoryId: 'cat_healthcare',
        subCategoryId: 'subcat_hospitals_medical',
        description: 'Hospitals & Medical Services',
        merchantPatterns: [
            // Major hospital chains
            'apollo hospitals', 'fortis healthcare', 'max healthcare',
            'manipal hospitals', 'narayana health', 'aster dm healthcare',
            'columbia asia', 'lilavati hospital', 'kokilaben hospital',
            'medanta', 'artemis hospital',
            // Government hospitals
            'aiims', 'pgimer', 'government hospital', 'civil hospital',
            // Telemedicine
            'practo', 'lybrate', 'mfine', 'myupchar'
        ],
        tags: ['hospital', 'medical', 'apollo', 'fortis', 'max-healthcare', 'doctor'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5912_pharmacies_medicines',
        code: '5912',
        categoryId: 'cat_healthcare',
        subCategoryId: 'subcat_pharmacies_medicines',
        description: 'Pharmacies & Medicine Stores',
        merchantPatterns: [
            // Pharmacy chains
            'apollo pharmacy', 'medplus', 'wellness forever', '98.4',
            'pharmeasy', '1mg', 'netmeds', 'myra medicines', 'truemeds',
            // Local pharmacy patterns
            'medical store', 'pharmacy', 'chemist', 'drug store', 'medicine shop'
        ],
        tags: ['pharmacy', 'medicine', 'apollo-pharmacy', 'medplus', '1mg', 'pharmeasy'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_8071_diagnostic_tests',
        code: '8071',
        categoryId: 'cat_healthcare',
        subCategoryId: 'subcat_diagnostic_tests',
        description: 'Diagnostic & Laboratory Services',
        merchantPatterns: [
            'pathology lab', 'diagnostic center', 'lab test', 'blood test',
            'health checkup', 'medical test', 'x-ray', 'ultrasound',
            'mri scan', 'ct scan', 'health screening'
        ],
        tags: ['diagnostic', 'lab-test', 'pathology', 'health-checkup', 'medical-test'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === EDUCATION & COACHING ===
    {
        id: 'mcc_8299_online_coaching',
        code: '8299',
        categoryId: 'cat_education',
        subCategoryId: 'subcat_online_coaching',
        description: 'Online Coaching & EdTech Platforms',
        merchantPatterns: [
            // Ed-tech platforms
            'byjus', 'unacademy', 'vedantu', 'toppr', 'extramarks',
            'white hat jr', 'coding ninjas', 'physics wallah',
            // Online learning
            'coursera', 'udemy', 'skillshare', 'linkedin learning',
            'upgrad', 'simplilearn', 'great learning'
        ],
        tags: ['edtech', 'online-learning', 'byjus', 'unacademy', 'vedantu'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_8299_competitive_exams',
        code: '8299',
        categoryId: 'cat_education',
        subCategoryId: 'subcat_competitive_exams',
        description: 'Competitive Exam Preparation',
        merchantPatterns: [
            // Coaching institutes
            'aakash institute', 'allen career institute', 'fiitjee', 'resonance',
            'vibrant academy', 'motion iit', 'kota coaching',
            // Exam prep
            'iit jee coaching', 'neet coaching', 'upsc coaching', 'cat coaching',
            'gate coaching', 'bank exam prep'
        ],
        tags: ['competitive-exams', 'iit-jee', 'neet', 'upsc', 'coaching-institute'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_8220_schools_colleges',
        code: '8220',
        categoryId: 'cat_education',
        subCategoryId: 'subcat_schools_colleges',
        description: 'Schools & Colleges',
        merchantPatterns: [
            // Universities and colleges
            'school fees', 'college fees', 'university fees', 'admission fees',
            'tuition fees', 'education fees', 'semester fees'
        ],
        tags: ['school-fees', 'college-fees', 'education-fees', 'tuition'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === RETAIL SHOPPING ===
    {
        id: 'mcc_5311_retail_stores',
        code: '5311',
        categoryId: 'cat_shopping',
        subCategoryId: 'subcat_retail_stores',
        description: 'Retail Stores & Shopping Malls',
        merchantPatterns: [
            // Department stores
            'shoppers stop', 'lifestyle', 'central', 'westside', 'max',
            'pantaloons', 'brand factory', 'reliance trends', 'v-mart',
            // Malls and retail
            'shopping mall', 'retail store', 'department store'
        ],
        tags: ['retail-store', 'shopping-mall', 'shoppers-stop', 'lifestyle', 'westside'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5651_clothing_fashion',
        code: '5651',
        categoryId: 'cat_shopping',
        subCategoryId: 'subcat_clothing_fashion',
        description: 'Clothing & Fashion Stores',
        merchantPatterns: [
            // Fashion brands
            'allen solly', 'peter england', 'van heusen', 'louis philippe',
            'arrow', 'zara', 'h&m', 'uniqlo', 'forever 21',
            // Indian ethnic wear
            'fabindia', 'global desi', 'biba', 'aurelia', 'w for woman'
        ],
        tags: ['clothing', 'fashion', 'apparel', 'ethnic-wear', 'fashion-store'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5732_electronics_appliances',
        code: '5732',
        categoryId: 'cat_shopping',
        subCategoryId: 'subcat_electronics_appliances',
        description: 'Electronics & Appliances Retail',
        merchantPatterns: [
            // Electronics retail chains
            'croma', 'reliance digital', 'vijay sales', 'ezone', 'poorvika',
            'lot mobiles', 'sangeetha mobiles', 'big c', 'great eastern',
            // Brand stores
            'mi store', 'samsung plaza', 'apple store', 'oneplus store'
        ],
        tags: ['electronics-store', 'appliances', 'croma', 'reliance-digital', 'mobile-store'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === FINANCIAL SERVICES ===
    {
        id: 'mcc_6012_financial_services',
        code: '6012',
        categoryId: 'cat_finance',
        subCategoryId: null,
        description: 'Financial Institutions - Banking & Investment Services',
        merchantPatterns: [
            // Banks
            'state bank', 'sbi', 'hdfc bank', 'icici bank', 'axis bank',
            'kotak mahindra', 'yes bank', 'indusind bank', 'federal bank',
            // NBFCs and fintech
            'bajaj finserv', 'mahindra finance', 'tata capital',
            // New age fintech
            'cred', 'slice', 'jupiter', 'fi money', 'niyo', 'onecard',
            'groww', 'zerodha', 'upstox', 'paytm money'
        ],
        tags: ['banking', 'fintech', 'investment', 'cred', 'groww', 'zerodha'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_6300_insurance',
        code: '6300',
        categoryId: 'cat_finance',
        subCategoryId: null,
        description: 'Insurance Sales & Premium Payments',
        merchantPatterns: [
            // Life insurance
            'lic', 'sbi life', 'hdfc life', 'icici prudential', 'max life',
            // General insurance
            'bajaj allianz', 'hdfc ergo', 'icici lombard', 'sbi general',
            // Health insurance
            'star health', 'care health', 'acko', 'digit insurance',
            'policybazaar', 'coverfox'
        ],
        tags: ['insurance', 'lic', 'health-insurance', 'life-insurance', 'general-insurance'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_6513_rent_payments',
        code: '6513',
        categoryId: 'cat_finance',
        subCategoryId: null,
        description: 'Rent Payments & Real Estate',
        merchantPatterns: [
            // Property rental platforms
            'nobroker', 'nestaway', 'zolo', 'stanza living', 'oyo life',
            'colive', 'hello world', 'your space',
            // Rent patterns
            'rent payment', 'house rent', 'flat rent', 'office rent'
        ],
        tags: ['rent', 'property', 'real-estate', 'house-rent', 'accommodation'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === HOME & LIFESTYLE ===
    {
        id: 'mcc_7349_home_services',
        code: '7349',
        categoryId: 'cat_home',
        subCategoryId: 'subcat_home_services',
        description: 'Home Services & Maintenance',
        merchantPatterns: [
            // Home service platforms
            'urban company', 'housejoy', 'zimmber', 'justdial services',
            'sulekha services', 'home services', 'cleaning services',
            'repair services', 'maintenance services', 'handyman services'
        ],
        tags: ['home-services', 'urban-company', 'cleaning', 'repair', 'maintenance'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },
    {
        id: 'mcc_5712_furniture_decor',
        code: '5712',
        categoryId: 'cat_home',
        subCategoryId: 'subcat_furniture_decor',
        description: 'Furniture & Home Decor',
        merchantPatterns: [
            // Furniture e-commerce
            'pepperfry', 'urban ladder', 'fabfurnish', 'hometown',
            'godrej interio', 'nilkamal', 'durian', 'evok',
            // Home decor
            'ikea', 'home centre', 'westside home', 'fabindia home',
            'good earth', 'chumbak'
        ],
        tags: ['furniture', 'home-decor', 'pepperfry', 'urban-ladder', 'ikea'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    },

    // === OTHER CATEGORIES ===
    {
        id: 'mcc_9999_other',
        code: '9999',
        categoryId: 'cat_other',
        subCategoryId: null,
        description: 'Miscellaneous and Uncategorized Transactions',
        merchantPatterns: [
            'miscellaneous', 'other', 'unclassified', 'unknown merchant',
            'cash withdrawal', 'atm', 'bank charges', 'fees'
        ],
        tags: ['miscellaneous', 'other', 'unclassified', 'cash', 'atm'],
        discoveryMethod: 'manual',
        confidence: 1.0,
        verifiedCount: 0,
    }
] as const;

/**
 * Seed Indian MCC codes aligned with category structure
 */
export async function seedIndianMCCCodes(prisma: PrismaClient): Promise<void> {
    try {
        for (const mccCode of INDIAN_MCC_CODES) {
            await prisma.mCCCode.upsert({
                where: { code: mccCode.code },
                update: {
                    code: mccCode.code,
                    categoryId: mccCode.categoryId,
                    subCategoryId: mccCode.subCategoryId,
                    description: mccCode.description,
                    merchantPatterns: [...mccCode.merchantPatterns],
                    tags: [...mccCode.tags],
                    discoveryMethod: mccCode.discoveryMethod,
                    confidence: mccCode.confidence,
                    verifiedCount: mccCode.verifiedCount,
                },
                create: {
                    id: mccCode.id,
                    code: mccCode.code,
                    categoryId: mccCode.categoryId,
                    subCategoryId: mccCode.subCategoryId ?? null,
                    description: mccCode.description,
                    merchantPatterns: [...mccCode.merchantPatterns],
                    tags: [...mccCode.tags],
                    discoveryMethod: mccCode.discoveryMethod,
                    confidence: mccCode.confidence,
                    verifiedCount: mccCode.verifiedCount,
                },
            });
        }

        logger.info(`✅ Successfully seeded ${INDIAN_MCC_CODES.length} Indian MCC codes`);
    } catch (error) {
        logger.error('❌ Error seeding Indian MCC codes:', error);
        throw error;
    }
}