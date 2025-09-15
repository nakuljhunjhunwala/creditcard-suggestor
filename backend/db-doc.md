# Credit Card Recommendation System - Database Documentation

## **Database Overview**

The database is designed as a high-performance, session-based system that processes credit card statements, intelligently discovers MCC codes, and provides personalized credit card recommendations. The schema uses plain text references for maximum flexibility and performance.

### **Core Design Principles**
- **Session-Based**: No user accounts required for MVP
- **Self-Improving**: AI discoveries enhance the database over time
- **Background Processing**: Long operations handled via job queues
- **Plain Text Relations**: Manual joins for maximum control and performance
- **Scalability**: Optimized indexes and flexible schema design

---

## **Table Definitions & Examples**

### **🔄 Background Processing Tables**

#### **processing_jobs**
Manages background job queue system for time-intensive operations.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique job identifier | `clxy123abc...` |
| `sessionId` | String | Reference to sessions.id | `clxy456def...` |
| `jobType` | String | Type of background job | `mcc_discovery` |
| `status` | String | Current job status | `processing` |
| `priority` | Int | Job priority (1=high, 3=low) | `1` |
| `progress` | Int | Completion percentage | `65` |
| `currentStep` | String | Human-readable step | `Researching merchant: COSTCO` |
| `estimatedTime` | Int | ETA in seconds | `120` |
| `inputData` | Json | Job parameters | `{"transactions": ["tx1", "tx2"]}` |
| `outputData` | Json | Job results | `{"discoveredMCCs": 3}` |

**Example Usage:**
```sql
-- Create a new MCC discovery job
INSERT INTO processing_jobs (sessionId, jobType, priority, inputData) 
VALUES ('session123', 'mcc_discovery', 1, '{"unknownTransactions": ["tx1", "tx2"]}');

-- Check job status
SELECT status, progress, currentStep, estimatedTime 
FROM processing_jobs 
WHERE sessionId = 'session123' 
ORDER BY priority, queuedAt;
```

---

### **📊 Core Session Management**

#### **sessions**
Central table tracking PDF processing sessions and overall status.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique session identifier | `clxy789ghi...` |
| `sessionToken` | String | Public session token | `sess_abc123def456` |
| `status` | String | Processing pipeline status | `mcc_discovery` |
| `progress` | Int | Overall completion percentage | `75` |
| `totalSpend` | Decimal | Total spending in statement | `4567.89` |
| `topCategory` | String | Reference to categories.slug | `dining` |
| `totalTransactions` | Int | Number of transactions found | `87` |
| `categorizedCount` | Int | Successfully categorized | `82` |
| `unknownMccCount` | Int | Transactions needing AI research | `5` |
| `newMccDiscovered` | Int | New MCC codes discovered | `2` |
| `expiresAt` | DateTime | Session expiration | `2025-09-20T14:30:00Z` |

**Status Flow:**
`uploading` → `extracting` → `categorizing` → `mcc_discovery` → `analyzing` → `completed`

**Example Queries:**
```sql
-- Get session overview
SELECT s.sessionToken, s.status, s.progress, s.totalSpend, s.totalTransactions,
       c.name as topCategoryName
FROM sessions s
LEFT JOIN categories c ON c.slug = s.topCategory
WHERE s.id = 'session123';

-- Check if session needs MCC discovery
SELECT sessionId, unknownMccCount, newMccDiscovered
FROM sessions 
WHERE status = 'mcc_discovery' AND unknownMccCount > 0;
```

---

### **💳 Credit Card System**

#### **credit_cards**
Master database of all available credit cards with basic information.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique card identifier | `card_chase_sapphire` |
| `name` | String | Card display name | `Chase Sapphire Preferred` |
| `issuer` | String | Card issuing bank | `Chase` |
| `network` | String | Payment network | `Visa` |
| `annualFee` | Decimal | Yearly fee in dollars | `95.00` |
| `signupBonus` | Decimal | Sign-up bonus value | `60000.00` |
| `signupSpendReq` | Decimal | Required spend for bonus | `4000.00` |
| `signupTimeReq` | Int | Months to meet requirement | `3` |
| `defaultCashback` | Decimal | Base reward rate | `0.010` |
| `tier` | String | Card tier level | `premium` |
| `creditRequirement` | String | Required credit score | `excellent` |

**Example Queries:**
```sql
-- Find premium cards with no annual fee
SELECT name, issuer, defaultCashback
FROM credit_cards 
WHERE tier = 'premium' AND annualFee = 0 AND isActive = true;

-- Get cards by issuer with signup bonuses
SELECT name, signupBonus, signupSpendReq, signupTimeReq
FROM credit_cards 
WHERE issuer = 'Chase' AND signupBonus > 0
ORDER BY signupBonus DESC;
```

#### **card_benefits**
Detailed benefit structure for each credit card including category bonuses.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `cardId` | String | Reference to credit_cards.id | `card_chase_sapphire` |
| `benefitType` | String | Type of reward | `points` |
| `categoryId` | String | Reference to categories.id | `cat_dining` |
| `mccCodes` | String[] | Applicable MCC codes | `["5812", "5813", "5814"]` |
| `rate` | Decimal | Reward rate (5% = 0.050) | `0.020` |
| `maxSpend` | Decimal | Quarterly/annual spend cap | `1500.00` |
| `isRotating` | Boolean | Changes quarterly | `true` |
| `quarterActive` | Int[] | Active quarters | `[1, 2]` |
| `title` | String | Benefit description | `2x on dining` |

**Example Queries:**
```sql
-- Get all dining benefits for active cards
SELECT cc.name, cb.rate, cb.maxSpend, cb.title
FROM card_benefits cb
JOIN credit_cards cc ON cc.id = cb.cardId
WHERE cb.categoryId = 'cat_dining' 
  AND cc.isActive = true
ORDER BY cb.rate DESC;

-- Find rotating category cards for current quarter
SELECT cc.name, cb.title, cb.rate, cb.maxSpend
FROM card_benefits cb
JOIN credit_cards cc ON cc.id = cb.cardId
WHERE cb.isRotating = true 
  AND EXTRACT(QUARTER FROM NOW()) = ANY(cb.quarterActive);
```

---

### **🏷️ Category & MCC System**

#### **categories**
Main spending categories for transaction classification.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique category identifier | `cat_dining` |
| `name` | String | Display name | `Dining & Restaurants` |
| `slug` | String | URL-friendly identifier | `dining` |
| `iconName` | String | UI icon reference | `utensils` |
| `color` | String | UI color hex code | `#FF6B6B` |
| `sortOrder` | Int | Display priority | `10` |

**Example Categories:**
```sql
INSERT INTO categories (id, name, slug, iconName, color, sortOrder) VALUES
('cat_dining', 'Dining & Restaurants', 'dining', 'utensils', '#FF6B6B', 10),
('cat_grocery', 'Groceries', 'grocery', 'shopping-cart', '#4ECDC4', 20),
('cat_gas', 'Gas & Fuel', 'gas', 'gas-pump', '#45B7D1', 30),
('cat_travel', 'Travel', 'travel', 'plane', '#96CEB4', 40),
('cat_shopping', 'Shopping', 'shopping', 'shopping-bag', '#FFEAA7', 50);
```

#### **sub_categories**
Detailed subcategories within main categories.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `categoryId` | String | Reference to categories.id | `cat_dining` |
| `name` | String | Subcategory name | `Fast Food` |
| `slug` | String | URL-friendly identifier | `fast-food` |

**Example Subcategories:**
```sql
-- Dining subcategories
INSERT INTO sub_categories (categoryId, name, slug) VALUES
('cat_dining', 'Fast Food', 'fast-food'),
('cat_dining', 'Fine Dining', 'fine-dining'),
('cat_dining', 'Coffee Shops', 'coffee'),
('cat_dining', 'Bars & Nightlife', 'bars');

-- Travel subcategories  
INSERT INTO sub_categories (categoryId, name, slug) VALUES
('cat_travel', 'Airlines', 'airlines'),
('cat_travel', 'Hotels', 'hotels'),
('cat_travel', 'Car Rental', 'car-rental'),
('cat_travel', 'Ride Sharing', 'rideshare');
```

#### **mcc_codes**
Comprehensive MCC code database with AI discovery tracking.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `code` | String | 4-digit MCC code | `5812` |
| `categoryId` | String | Reference to categories.id | `cat_dining` |
| `subCategoryId` | String | Reference to sub_categories.id | `subcat_restaurants` |
| `description` | String | Official MCC description | `Eating Places, Restaurants` |
| `discoveryMethod` | String | How code was added | `ai_discovered` |
| `confidence` | Decimal | AI discovery confidence | `0.95` |
| `discoveredBy` | String | Session that found it | `session123` |
| `verifiedCount` | Int | Usage confirmations | `15` |
| `merchantPatterns` | String[] | Fuzzy match patterns | `["mcdonald", "mcd", "mcdonalds"]` |
| `tags` | String[] | Classification tags | `["fast-food", "chain", "drive-thru"]` |

**Example MCC Data:**
```sql
-- Popular dining MCC codes
INSERT INTO mcc_codes (code, categoryId, subCategoryId, description, merchantPatterns, tags) VALUES
('5812', 'cat_dining', 'subcat_restaurants', 'Eating Places, Restaurants', 
 '["restaurant", "eatery", "bistro"]', '["dining", "food"]'),
('5814', 'cat_dining', 'subcat_fast_food', 'Fast Food Restaurants',
 '["mcdonald", "burger", "kfc", "subway"]', '["fast-food", "quick-service"]'),
('5811', 'cat_dining', 'subcat_bars', 'Caterers', 
 '["cater", "banquet"]', '["catering", "events"]');

-- Query for fuzzy matching
SELECT code, description, merchantPatterns
FROM mcc_codes 
WHERE 'mcdonald' = ANY(merchantPatterns) 
   OR description ILIKE '%restaurant%';
```

#### **merchant_aliases**
Merchant name variations for improved fuzzy matching.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `merchantName` | String | Normalized merchant name | `MCDONALDS` |
| `aliases` | String[] | All known variations | `["McDonald's", "MCD", "MCDONALD'S #12345"]` |
| `mccCode` | String | Reference to mcc_codes.code | `5814` |
| `confidence` | Decimal | Mapping confidence | `0.98` |
| `usageCount` | Int | Times this alias was used | `47` |
| `createdBy` | String | Session that created it | `session456` |

**Example Usage:**
```sql
-- Find merchant aliases for fuzzy matching
SELECT merchantName, aliases, mccCode
FROM merchant_aliases
WHERE 'walmart' = ANY(aliases) OR merchantName ILIKE '%walmart%';

-- Update usage statistics
UPDATE merchant_aliases 
SET usageCount = usageCount + 1, lastUsed = NOW()
WHERE merchantName = 'MCDONALDS';
```

---

### **💰 Transaction System**

#### **transactions**
Individual transactions with categorization and MCC discovery status.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sessionId` | String | Reference to sessions.id | `session123` |
| `date` | DateTime | Transaction date | `2025-09-10T12:30:00Z` |
| `description` | String | Transaction description | `MCDONALD'S #12345` |
| `merchant` | String | Cleaned merchant name | `McDonald's` |
| `amount` | Decimal | Transaction amount | `12.47` |
| `mccCode` | String | Reference to mcc_codes.code | `5814` |
| `categoryId` | String | Reference to categories.id | `cat_dining` |
| `subCategoryId` | String | Reference to sub_categories.id | `subcat_fast_food` |
| `mccStatus` | String | Discovery status | `found_fuzzy` |
| `mccConfidence` | Decimal | Categorization confidence | `0.95` |
| `aiSearchQuery` | String | AI search query used | `McDonald's restaurant MCC code` |
| `aiSearchResult` | Json | Full AI response | `{"mcc": "5814", "confidence": 0.95}` |
| `rawDescription` | String | Original from PDF | `MCDONALD'S #12345 ANYTOWN USA` |

**MCC Status Values:**
- `pending` - Awaiting categorization
- `found_fuzzy` - Found via fuzzy database search
- `found_ai` - Discovered via AI research
- `not_found` - Could not categorize
- `manual_override` - User corrected

**Example Queries:**
```sql
-- Get transactions with full category info
SELECT t.description, t.amount, t.mccCode, 
       c.name as category, sc.name as subcategory,
       mc.description as mccDescription
FROM transactions t
LEFT JOIN categories c ON c.id = t.categoryId
LEFT JOIN sub_categories sc ON sc.id = t.subCategoryId  
LEFT JOIN mcc_codes mc ON mc.code = t.mccCode
WHERE t.sessionId = 'session123'
ORDER BY t.date DESC;

-- Find transactions needing AI research
SELECT id, description, merchant, amount
FROM transactions 
WHERE mccStatus = 'pending' AND mccCode IS NULL
ORDER BY amount DESC;

-- Get spending by category
SELECT c.name, COUNT(*) as transaction_count, SUM(t.amount) as total_spent
FROM transactions t
JOIN categories c ON c.id = t.categoryId
WHERE t.sessionId = 'session123'
GROUP BY c.id, c.name
ORDER BY total_spent DESC;
```

---

### **🎯 Recommendation System**

#### **recommendations**
Personalized credit card recommendations with detailed analysis.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sessionId` | String | Reference to sessions.id | `session123` |
| `cardId` | String | Reference to credit_cards.id | `card_chase_sapphire` |
| `score` | Decimal | Recommendation score (0-100) | `87.5` |
| `rank` | Int | Recommendation ranking | `1` |
| `potentialSavings` | Decimal | Annual savings estimate | `245.60` |
| `currentEarnings` | Decimal | Current card earnings | `45.60` |
| `yearlyEstimate` | Decimal | Projected yearly value | `291.20` |
| `benefitBreakdown` | Json | Per-category analysis | See example below |
| `primaryReason` | String | Main recommendation reason | `5x points on dining matches your spending` |
| `pros` | String[] | Recommendation advantages | `["High dining rewards", "No foreign fees"]` |
| `cons` | String[] | Potential drawbacks | `["$95 annual fee", "Transfer partners limited"]` |
| `signupBonusValue` | Decimal | Current signup bonus value | `600.00` |
| `feeBreakeven` | Int | Months to break even on fee | `4` |

**Example Benefit Breakdown JSON:**
```json
{
  "dining": {
    "spending": 245.60,
    "currentRate": 0.01,
    "newRate": 0.02,
    "currentEarnings": 2.46,
    "newEarnings": 4.91,
    "improvement": 2.45
  },
  "grocery": {
    "spending": 420.30,
    "currentRate": 0.01,
    "newRate": 0.01,
    "currentEarnings": 4.20,
    "newEarnings": 4.20,
    "improvement": 0.00
  }
}
```

**Example Queries:**
```sql
-- Get top recommendations with card details
SELECT r.rank, r.score, cc.name, cc.issuer, r.potentialSavings,
       r.primaryReason, r.signupBonusValue, r.feeBreakeven
FROM recommendations r
JOIN credit_cards cc ON cc.id = r.cardId
WHERE r.sessionId = 'session123'
ORDER BY r.rank;

-- Find best cards for specific spending category
SELECT cc.name, r.score, r.benefitBreakdown->'dining'->>'improvement' as dining_improvement
FROM recommendations r
JOIN credit_cards cc ON cc.id = r.cardId
WHERE r.sessionId = 'session123'
  AND (r.benefitBreakdown->'dining'->>'improvement')::decimal > 0
ORDER BY (r.benefitBreakdown->'dining'->>'improvement')::decimal DESC;
```

---

### **⚙️ Utility Tables**

#### **app_config**
Application configuration and feature flags.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `key` | String | Configuration key | `gemini_api_model_cheap` |
| `value` | String | Configuration value | `gemini-1.5-flash` |
| `description` | String | Setting description | `Cheap Gemini model for transaction extraction` |

**Example Configurations:**
```sql
INSERT INTO app_config (key, value, description) VALUES
('gemini_api_model_cheap', 'gemini-1.5-flash', 'Cheap model for transaction extraction'),
('gemini_api_model_premium', 'gemini-1.5-pro', 'Premium model for MCC discovery'),
('session_expiry_hours', '24', 'Hours before session expires'),
('max_concurrent_jobs', '10', 'Maximum concurrent background jobs'),
('fuzzy_match_threshold', '0.8', 'Minimum similarity for fuzzy matching');
```

---

## **Common Query Patterns**

### **Session Processing Pipeline**
```sql
-- Complete session overview with progress
SELECT 
    s.sessionToken,
    s.status,
    s.progress,
    s.totalTransactions,
    s.categorizedCount,
    s.unknownMccCount,
    COUNT(pj.id) as active_jobs,
    COUNT(CASE WHEN pj.status = 'completed' THEN 1 END) as completed_jobs
FROM sessions s
LEFT JOIN processing_jobs pj ON pj.sessionId = s.id
WHERE s.id = 'session123'
GROUP BY s.id;
```

### **MCC Discovery Analytics**
```sql
-- Track MCC discovery success rates
SELECT 
    discoveryMethod,
    COUNT(*) as total_codes,
    AVG(confidence) as avg_confidence,
    SUM(verifiedCount) as total_verifications
FROM mcc_codes 
GROUP BY discoveryMethod
ORDER BY total_codes DESC;
```

### **Card Recommendation Analysis**
```sql
-- Find most recommended cards across all sessions
SELECT 
    cc.name,
    cc.issuer,
    COUNT(*) as recommendation_count,
    AVG(r.score) as avg_score,
    AVG(r.potentialSavings) as avg_savings
FROM recommendations r
JOIN credit_cards cc ON cc.id = r.cardId
WHERE r.rank <= 3  -- Top 3 recommendations only
GROUP BY cc.id, cc.name, cc.issuer
ORDER BY recommendation_count DESC, avg_score DESC;
```

### **Spending Pattern Analysis**
```sql
-- Analyze spending patterns across categories
WITH category_spending AS (
    SELECT 
        t.sessionId,
        c.name as category,
        COUNT(*) as transaction_count,
        SUM(t.amount) as total_amount,
        AVG(t.amount) as avg_amount
    FROM transactions t
    JOIN categories c ON c.id = t.categoryId
    GROUP BY t.sessionId, c.id, c.name
)
SELECT 
    category,
    AVG(total_amount) as avg_spending,
    AVG(transaction_count) as avg_transactions,
    COUNT(DISTINCT sessionId) as sessions_with_category
FROM category_spending
GROUP BY category
ORDER BY avg_spending DESC;
```

---

## **Performance Optimization**

### **Critical Indexes**
```sql
-- Session processing indexes
CREATE INDEX CONCURRENTLY idx_sessions_status_progress ON sessions(status, progress);
CREATE INDEX CONCURRENTLY idx_processing_jobs_queue ON processing_jobs(status, priority, queuedAt);

-- Transaction lookup indexes
CREATE INDEX CONCURRENTLY idx_transactions_session_date ON transactions(sessionId, date DESC);
CREATE INDEX CONCURRENTLY idx_transactions_mcc_status ON transactions(mccStatus, mccCode);

-- MCC fuzzy search indexes
CREATE INDEX CONCURRENTLY idx_mcc_codes_patterns ON mcc_codes USING GIN(merchantPatterns);
CREATE INDEX CONCURRENTLY idx_merchant_aliases_search ON merchant_aliases USING GIN(aliases);

-- Recommendation indexes
CREATE INDEX CONCURRENTLY idx_recommendations_session_rank ON recommendations(sessionId, rank);
CREATE INDEX CONCURRENTLY idx_recommendations_score ON recommendations(score DESC);
```

### **Query Optimization Tips**

1. **Use Composite Indexes**: Always query by sessionId first
2. **JSON Queries**: Use appropriate operators for JSON fields
3. **Fuzzy Matching**: Leverage GIN indexes for array searches
4. **Pagination**: Use cursor-based pagination for large result sets
5. **Caching**: Cache frequently accessed MCC and card data

---

## **Data Migration & Seeding**

### **Initial MCC Code Seeding**
```sql
-- Seed popular MCC codes
INSERT INTO mcc_codes (code, categoryId, description, merchantPatterns, tags) VALUES
('5411', 'cat_grocery', 'Grocery Stores, Supermarkets', 
 '["walmart", "target", "kroger", "safeway", "publix"]', 
 '["grocery", "supermarket", "food"]'),
('5542', 'cat_gas', 'Automated Fuel Dispensers',
 '["shell", "exxon", "chevron", "bp", "mobil"]',
 '["gas", "fuel", "gasoline"]'),
('5812', 'cat_dining', 'Eating Places, Restaurants',
 '["restaurant", "cafe", "diner", "eatery"]',
 '["dining", "restaurant", "food"]');
```

### **Credit Card Data Seeding**
```sql
-- Popular credit cards
INSERT INTO credit_cards (id, name, issuer, network, annualFee, defaultCashback, tier) VALUES
('chase_sapphire_preferred', 'Chase Sapphire Preferred', 'Chase', 'Visa', 95.00, 0.010, 'premium'),
('amex_gold', 'American Express Gold Card', 'American Express', 'Amex', 250.00, 0.010, 'premium'),
('citi_double_cash', 'Citi Double Cash', 'Citi', 'Mastercard', 0.00, 0.020, 'standard');

-- Card benefits
INSERT INTO card_benefits (cardId, benefitType, categoryId, rate, title) VALUES
('chase_sapphire_preferred', 'points', 'cat_dining', 0.020, '2x points on dining'),
('chase_sapphire_preferred', 'points', 'cat_travel', 0.020, '2x points on travel'),
('amex_gold', 'points', 'cat_dining', 0.040, '4x points on dining'),
('amex_gold', 'points', 'cat_grocery', 0.040, '4x points on groceries');
```

This documentation provides a complete reference for implementing and maintaining the credit card recommendation database system with examples for all common operations.