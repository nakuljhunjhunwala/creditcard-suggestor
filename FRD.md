# Credit Card Recommendation System - Backend FRD

## **Project Overview**
Develop a scalable Node.js backend system that processes credit card statements via PDF upload, extracts transactions using Gemini AI, intelligently discovers MCC codes through fuzzy matching and AI research, categorizes spending with self-improving accuracy, and provides personalized credit card recommendations with detailed savings analysis. The system features background processing with real-time status updates to handle time-intensive MCC discovery operations.

## **Processing Flow Architecture**
1. **Immediate Response**: PDF upload returns session ID instantly
2. **Background Pipeline**: 
   - Extract transactions (Gemini cheap model)
   - Fuzzy search existing MCC database
   - AI discovery for unknown merchants (Gemini premium + Google search)
   - Update database with new MCC codes
   - Generate recommendations and analysis
3. **Real-time Updates**: Frontend polls status endpoint for progress
4. **Self-Improvement**: System gets smarter with each processed statement

---

## **PHASE 1: Core Infrastructure & Database Setup**

### **Sub-Phase 1.1: Project Foundation**
**Objective**: Establish basic project structure and dependencies

**Requirements**:
- Initialize Node.js project with TypeScript configuration
- Setup Prisma ORM with PostgreSQL connection
- Configure environment variables management (.env, validation)
- Implement basic error handling middleware and logging system
- Setup development, testing, and production database configurations
- Create database connection pooling and health check endpoints

**Deliverables**:
- Functional project skeleton with all dependencies installed
- Database connection established and tested
- Environment configuration system working
- Basic server running with health check endpoint

### **Sub-Phase 1.2: Database Migration & Seeding**
**Objective**: Create database schema and populate initial data

**Requirements**:
- Execute Prisma migrations to create all required tables
- Implement comprehensive MCC code seeding (4000+ codes)
- Create category and subcategory seed data with proper hierarchical relationships
- Setup initial credit card database with major cards (Chase, Amex, Citi, etc.)
- Populate card benefits for top 20-30 popular cards
- Create database indexes for performance optimization
- Implement data validation rules and constraints

**Deliverables**:
- Complete database schema deployed
- MCC codes fully populated with accurate categorization
- Initial credit card database with benefits structure
- Data integrity constraints and validations active

---

## **PHASE 2: PDF Processing & Transaction Extraction**

### **Sub-Phase 2.1: File Upload Handler**
**Objective**: Handle secure PDF file uploads and validation

**Requirements**:
- Implement multipart file upload endpoint with size limits (10MB max)
- Validate file types (PDF only) and file integrity
- Generate unique session tokens for each upload
- Implement temporary file storage with automatic cleanup
- Add file sanitization and security checks
- Create upload progress tracking system
- Implement rate limiting per IP address

**Deliverables**:
- Secure file upload API endpoint
- File validation and sanitization working
- Session-based file handling implemented
- Automatic cleanup system functional

### **Sub-Phase 2.2: PDF Text Extraction**
**Objective**: Extract raw text content from PDF files

**Requirements**:
- Implement PDF parsing using appropriate Node.js library (pdf-parse or similar)
- Handle various PDF formats and layouts (different banks have different formats)
- Extract text while preserving structure and formatting
- Implement error handling for corrupted or password-protected PDFs
- Add support for multi-page statements
- Create text preprocessing to clean extracted content
- Log extraction quality metrics for monitoring

**Deliverables**:
- Reliable PDF text extraction functionality
- Support for multiple PDF formats and layouts
- Error handling for various PDF issues
- Text quality assessment system

### **Sub-Phase 2.3: Gemini AI Integration**
**Objective**: Process extracted text using Gemini AI for transaction parsing

**Requirements**:
- Setup Gemini API integration with proper authentication
- Design comprehensive prompt templates for transaction extraction
- Implement structured JSON response parsing from Gemini
- Create retry logic for API failures and rate limiting
- Add confidence scoring for AI-extracted data
- Implement cost optimization (use cheapest Gemini model)
- Create fallback parsing methods if AI fails
- Add transaction validation rules post-AI processing

**Deliverables**:
- Gemini AI integration fully functional
- Reliable transaction extraction from various statement formats
- Confidence scoring system operational
- Cost-optimized API usage with retry mechanisms

---

## **PHASE 3: MCC Categorization & Spending Analysis**

### **Sub-Phase 3.1: Smart Transaction Categorization**
**Objective**: Accurately categorize transactions using MCC codes and merchant matching

**Requirements**:
- Implement merchant name standardization and matching algorithms
- Create MCC code assignment logic based on merchant patterns
- Develop fuzzy matching for merchant names (handle variations like "McDonald's" vs "MCDONALD'S #12345")
- Implement machine learning-enhanced categorization using historical data
- Add manual override capabilities for incorrect categorizations
- Create confidence scoring for each categorization decision
- Implement category validation rules and business logic

**Deliverables**:
- Accurate transaction categorization system (>90% accuracy target)
- Merchant matching algorithms operational
- MCC code assignment working reliably
- Categorization confidence scoring implemented

### **Sub-Phase 3.2: Spending Pattern Analysis**
**Objective**: Analyze user spending patterns and generate insights

**Requirements**:
- Calculate total spending by category and subcategory
- Implement monthly/quarterly spending trend analysis
- Generate spending distribution percentages and ratios
- Identify top spending categories and merchants
- Calculate average transaction amounts by category
- Detect seasonal spending patterns and anomalies
- Create spending velocity analysis (spending frequency)
- Generate risk assessment based on spending patterns

**Deliverables**:
- Comprehensive spending analysis engine
- Pattern recognition algorithms functional
- Statistical insights generation working
- Risk assessment system operational

---

## **PHASE 4: Card Database & Benefits Management**

### **Sub-Phase 4.1: Credit Card Data Management**
**Objective**: Maintain comprehensive and up-to-date credit card database

**Requirements**:
- Implement CRUD operations for credit card management
- Create automated card benefit updates system
- Build card comparison algorithms and ranking systems
- Implement benefit calculation engine for different reward types
- Add support for rotating category benefits (quarterly updates)
- Create card eligibility assessment based on credit requirements
- Implement annual fee vs benefits break-even calculations
- Add card application tracking and affiliate link management

**Deliverables**:
- Dynamic credit card database management system
- Benefit calculation engine operational
- Card ranking and comparison algorithms working
- Break-even analysis functionality implemented

### **Sub-Phase 4.2: Benefits Optimization Engine**
**Objective**: Calculate optimal benefits for specific spending patterns

**Requirements**:
- Implement benefit calculation algorithms for cashback, points, miles
- Create spending cap and benefit limit tracking
- Add support for sign-up bonus calculations and timelines
- Implement multi-card strategy optimization
- Create benefit stacking analysis (multiple cards usage)
- Add temporal benefit analysis (rotating categories, limited-time offers)
- Implement redemption value calculations for points/miles
- Create benefit opportunity cost analysis

**Deliverables**:
- Advanced benefit calculation system
- Multi-card optimization algorithms
- Sign-up bonus analysis functional
- Comprehensive benefit tracking operational

---

## **PHASE 5: Recommendation Engine**

### **Sub-Phase 5.1: Card Matching Algorithm**
**Objective**: Match user spending patterns to optimal credit cards

**Requirements**:
- Implement weighted scoring system based on spending categories
- Create card ranking algorithm considering annual fees, benefits, and spending
- Add personalized recommendation logic based on spending history
- Implement recommendation diversity (avoid suggesting too similar cards)
- Create recommendation explanation system (why this card was recommended)
- Add negative recommendation filtering (cards user shouldn't get)
- Implement recommendation confidence scoring
- Create A/B testing framework for recommendation algorithms

**Deliverables**:
- Intelligent card matching system operational
- Personalized recommendations with high relevance
- Explanation system for recommendations working
- Confidence scoring and validation implemented

### **Sub-Phase 5.2: Savings Calculation Engine**
**Objective**: Calculate precise savings potential for recommended cards

**Requirements**:
- Implement transaction-level benefit calculation
- Create yearly savings projections based on historical spending
- Add break-even analysis for annual fee cards
- Implement opportunity cost calculations (current vs recommended cards)
- Create sensitivity analysis (what if spending patterns change)
- Add Monte Carlo simulations for savings estimates
- Implement savings timeline projections
- Create ROI calculations including sign-up bonuses

**Deliverables**:
- Accurate savings calculation system
- Yearly projection algorithms operational
- Break-even analysis functional
- ROI calculation system implemented

---

## **PHASE 6: API Layer & Session Management**

### **Sub-Phase 6.1: RESTful API Design**
**Objective**: Create comprehensive API endpoints for frontend integration

**Requirements**:
- Design and implement RESTful API endpoints for all functionality
- Create session-based state management (no user accounts for MVP)
- Implement comprehensive input validation and sanitization
- Add proper HTTP status codes and error responses
- Create API documentation using Swagger/OpenAPI
- Implement request/response logging and monitoring
- Add API versioning strategy and backward compatibility
- Create rate limiting and security measures

**API Endpoints Required**:
- POST /api/upload - Handle PDF uploads
- GET /api/session/:id/status - Check processing status
- GET /api/session/:id/transactions - Retrieve parsed transactions
- GET /api/session/:id/analysis - Get spending analysis
- GET /api/session/:id/recommendations - Get card recommendations
- GET /api/cards - List available credit cards
- GET /api/cards/:id - Get specific card details
- POST /api/session/:id/feedback - Handle user feedback

**Deliverables**:
- Complete RESTful API operational
- Comprehensive API documentation
- Session management system working
- Security and validation measures active

### **Sub-Phase 6.2: Response Formatting & Error Handling**
**Objective**: Standardize API responses and implement robust error handling

**Requirements**:
- Create standardized JSON response format across all endpoints
- Implement comprehensive error handling with user-friendly messages
- Add detailed logging for debugging and monitoring
- Create response caching system for improved performance
- Implement graceful degradation for partial failures
- Add request tracing and correlation IDs
- Create health monitoring and alerting system
- Implement graceful shutdown procedures

**Deliverables**:
- Consistent API response format
- Robust error handling system
- Comprehensive logging and monitoring
- Performance optimization measures active

---

## **PHASE 7: Performance Optimization & Caching**

### **Sub-Phase 7.1: Database Optimization**
**Objective**: Optimize database performance and query efficiency

**Requirements**:
- Implement database query optimization and indexing strategies
- Add connection pooling and connection management
- Create read replicas for heavy read operations
- Implement database query caching using Redis
- Add database performance monitoring and alerting
- Create backup and recovery procedures
- Implement data archival strategies for old sessions
- Add database health checks and failover mechanisms

**Deliverables**:
- Optimized database performance
- Caching system operational
- Monitoring and alerting active
- Backup and recovery procedures implemented

### **Sub-Phase 7.2: Application Caching & Memory Management**
**Objective**: Implement comprehensive caching strategy and memory optimization

**Requirements**:
- Implement Redis caching for frequently accessed data (MCC codes, card data)
- Create intelligent cache invalidation strategies
- Add memory usage monitoring and optimization
- Implement result caching for recommendation calculations
- Create session data caching with TTL management
- Add cache warming strategies for critical data
- Implement cache clustering for scalability
- Create cache performance monitoring

**Deliverables**:
- Comprehensive caching system operational
- Memory optimization implemented
- Cache performance monitoring active
- Scalable caching architecture deployed

---

## **PHASE 8: Production Readiness & Monitoring**

### **Sub-Phase 8.1: Security Implementation**
**Objective**: Implement comprehensive security measures

**Requirements**:
- Add input validation and SQL injection prevention
- Implement file upload security (virus scanning, type validation)
- Add rate limiting and DDoS protection
- Create secure session management with proper expiration
- Implement API key management for external services
- Add encryption for sensitive data in transit and at rest
- Create security headers and CORS configuration
- Implement security audit logging

**Deliverables**:
- Comprehensive security measures active
- Vulnerability assessments passed
- Security monitoring operational
- Compliance requirements met

### **Sub-Phase 8.2: Monitoring & Observability**
**Objective**: Implement comprehensive monitoring and observability

**Requirements**:
- Add application performance monitoring (APM)
- Create business metrics tracking (processing success rates, recommendation accuracy)
- Implement log aggregation and analysis
- Add real-time alerting for critical issues
- Create performance dashboards and reporting
- Implement distributed tracing for complex operations
- Add capacity planning and scaling triggers
- Create incident response procedures

**Deliverables**:
- Comprehensive monitoring system operational
- Performance dashboards active
- Alerting and incident response procedures implemented
- Scalability monitoring and planning active

---

## **Technical Requirements Summary**

### **Performance Targets**:
- PDF processing: < 30 seconds for typical statements
- Transaction categorization accuracy: > 90%
- API response time: < 2 seconds for most endpoints
- Recommendation generation: < 5 seconds
- System uptime: > 99.5%

### **Scalability Requirements**:
- Support for concurrent PDF processing (10+ simultaneous)
- Horizontal scaling capability for increased load
- Database connection pooling for high concurrency
- Caching strategy for optimal performance

### **Security Requirements**:
- No persistent storage of PDF files
- Secure session management with automatic expiration
- Input validation and sanitization on all endpoints
- Rate limiting to prevent abuse
- Encryption of sensitive data

### **Integration Requirements**:
- Gemini API integration with error handling and retries
- PostgreSQL database with proper indexing and optimization
- Redis caching for performance optimization
- File processing with automatic cleanup

This FRD provides a comprehensive roadmap for building a scalable, secure, and high-performance credit card recommendation backend system.