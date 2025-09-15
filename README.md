# 🏦 Credit Card Recommendation System

An AI-powered application that analyzes credit card statements and provides personalized credit card recommendations to maximize rewards and optimize spending.

## 🚀 Features

- **PDF Statement Analysis**: Upload credit card statements for automated transaction extraction
- **AI-Powered Categorization**: Advanced transaction categorization using Google Gemini AI
- **MCC Discovery**: Intelligent merchant category code identification and research
- **Personalized Recommendations**: Credit card suggestions based on spending patterns
- **Real-time Processing**: Background job system with live progress updates
- **Secure & Private**: Session-based architecture with automatic data cleanup

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Express.js** REST API with comprehensive error handling
- **Prisma ORM** with PostgreSQL database
- **Google Gemini AI** integration for transaction analysis
- **Background job processing** with retry mechanisms
- **File upload validation** and security measures
- **Rate limiting** and request throttling

### Frontend (React + TypeScript)
- **Vite + React 18** with modern development tooling
- **Zustand** for lightweight state management
- **shadcn/ui + Tailwind CSS** for beautiful, accessible UI
- **React Router** for client-side navigation
- **Real-time progress tracking** during processing

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ database
- **Google Gemini API Key** (free tier available)

## ⚡ Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd CreditCardSuggestor
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp env.example .env
# Edit .env with your database URL and Gemini API key

# Setup database
npm run prisma:generate
npm run prisma:migrate:dev
npm run db:seed

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp env.example .env
# Edit .env with your API URL (default: http://localhost:3000/api/v1)

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `GEMINI_API_KEY` | Google Gemini AI API key | - | ✅ |
| `PORT` | Server port | 3000 | ❌ |
| `NODE_ENV` | Environment mode | development | ❌ |
| `MAX_UPLOAD_SIZE_MB` | Max file upload size | 10 | ❌ |
| `MAX_CONCURRENT_JOBS` | Background job concurrency | 10 | ❌ |
| `SESSION_EXPIRY_HOURS` | Session expiration time | 24 | ❌ |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | http://localhost:3000/api/v1 | ✅ |
| `VITE_APP_NAME` | Application display name | Credit Card Optimizer | ❌ |
| `VITE_APP_VERSION` | Application version | 1.0.0 | ❌ |

## 📚 API Documentation

The backend provides comprehensive OpenAPI documentation available at `/api-docs` when running in development mode.

### Key Endpoints

- `POST /api/v1/sessions` - Create new analysis session
- `POST /api/v1/sessions/:token/upload` - Upload PDF statement
- `GET /api/v1/sessions/:token/status` - Get processing status
- `GET /api/v1/sessions/:token/recommendations` - Get card recommendations
- `GET /api/v1/sessions/:token/analysis` - Get spending analysis

## 🗄️ Database Schema

The application uses PostgreSQL with the following key models:

- **Sessions**: User analysis sessions with expiration
- **Transactions**: Extracted and categorized transactions
- **CreditCards**: Available credit cards with benefits
- **Recommendations**: Personalized card suggestions
- **ProcessingJobs**: Background job queue and status

## 🧪 Development

### Backend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run quality      # Run full quality checks (lint, format, build)
npm run db:seed      # Populate database with sample data
npm run db:reset     # Reset database and reseed
```

### Frontend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🔒 Security Features

- **File Validation**: Comprehensive PDF validation and security checks
- **Rate Limiting**: Request throttling to prevent abuse
- **Session Management**: Automatic session expiration and cleanup
- **Input Sanitization**: All user inputs are validated and sanitized
- **Error Handling**: Secure error messages without sensitive data exposure

## 🚀 Deployment

### Backend Deployment

1. Set production environment variables
2. Run database migrations: `npm run prisma:migrate:deploy`
3. Build the application: `npm run build`
4. Start the server: `npm start`

### Frontend Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Serve the `dist` folder using a static file server

### Recommended Hosting

- **Backend**: Railway, Render, or AWS ECS
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Database**: Railway PostgreSQL, Supabase, or AWS RDS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the API documentation at `/api-docs`
- Review the environment configuration examples

## 🔮 Roadmap

- [ ] User authentication and saved sessions
- [ ] Multiple credit card comparison tools
- [ ] Advanced spending analytics and insights
- [ ] Mobile application
- [ ] Integration with bank APIs
- [ ] Machine learning model improvements

---

**Built with ❤️ using Node.js, React, PostgreSQL, and Google Gemini AI**
