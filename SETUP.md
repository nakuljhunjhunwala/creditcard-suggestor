# 🚀 Setup Guide - Credit Card Recommendation System

This guide will help you set up the Credit Card Recommendation System on your local machine for development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher (comes with Node.js)
- **PostgreSQL** 14.0 or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

## 🔑 Required API Keys

### Google Gemini AI API Key (Required)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key (starts with `AIza...`)
5. **Free Tier**: 15 requests per minute, 1500 requests per day

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed)
2. **Create a database**:
   ```sql
   createdb credit_card_suggestor
   ```
3. **Create a user** (optional but recommended):
   ```sql
   psql credit_card_suggestor
   CREATE USER cc_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE credit_card_suggestor TO cc_user;
   ```

### Option 2: Cloud Database (Recommended for Production)

- **Railway**: [railway.app](https://railway.app/) - Free PostgreSQL
- **Supabase**: [supabase.com](https://supabase.com/) - Free tier available
- **Neon**: [neon.tech](https://neon.tech/) - Serverless PostgreSQL

## 🛠️ Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd CreditCardSuggestor
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env
```

**Edit `backend/.env`** with your configuration:

```env
# Required - Your database connection
DATABASE_URL=postgresql://username:password@localhost:5432/credit_card_suggestor

# Required - Your Gemini AI API key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional - Customize as needed
NODE_ENV=development
PORT=3000
MAX_UPLOAD_SIZE_MB=10
SESSION_EXPIRY_HOURS=24
```

**Initialize the database**:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:dev

# Seed the database with sample data
npm run db:seed
```

**Start the backend server**:

```bash
npm run dev
```

✅ **Backend should now be running at**: http://localhost:3000

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp env.example .env
```

**Edit `frontend/.env`** with your configuration:

```env
# Required - Backend API URL
VITE_API_URL=http://localhost:3000/api/v1

# Optional - Customize branding
VITE_APP_NAME=Credit Card Optimizer
VITE_APP_VERSION=1.0.0
```

**Start the frontend server**:

```bash
npm run dev
```

✅ **Frontend should now be running at**: http://localhost:5173

## 🧪 Verify Installation

### 1. Check Backend Health

Visit: http://localhost:3000/health

Expected response:
```json
{
  "status": "success",
  "message": "Health check successful",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "database": "connected"
  }
}
```

### 2. Check API Documentation

Visit: http://localhost:3000/api-docs

You should see the Swagger UI with all API endpoints documented.

### 3. Test the Frontend

1. Visit: http://localhost:5173
2. Click "Start Free Analysis"
3. You should be redirected to the upload page
4. The session should be created successfully

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Error

**Error**: `Error: P1001: Can't reach database server`

**Solutions**:
1. Ensure PostgreSQL is running: `brew services start postgresql` (macOS) or `sudo service postgresql start` (Linux)
2. Check your `DATABASE_URL` in `.env`
3. Verify database exists: `psql -l | grep credit_card`

#### Gemini API Key Error

**Error**: `Gemini API key is required`

**Solutions**:
1. Ensure `GEMINI_API_KEY` is set in `backend/.env`
2. Verify the API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Check for extra spaces or quotes around the key

#### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Kill the process: `lsof -ti:3000 | xargs kill -9`
2. Use a different port: Set `PORT=3001` in `backend/.env`
3. Update frontend API URL accordingly

#### Frontend Build Errors

**Error**: TypeScript or build errors

**Solutions**:
1. Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
2. Check Node.js version: `node --version` (should be 18+)
3. Restart the development server

### Reset Everything

If you encounter persistent issues:

```bash
# Backend reset
cd backend
rm -rf node_modules package-lock.json
npm install
npm run db:reset  # This will reset and reseed the database
npm run dev

# Frontend reset
cd frontend
rm -rf node_modules package-lock.json dist
npm install
npm run dev
```

## 📊 Database Management

### Useful Prisma Commands

```bash
# View database in browser
npm run prisma:studio

# Reset database and reseed
npm run db:reset

# Create new migration
npm run prisma:migrate:dev --name your_migration_name

# Generate Prisma client after schema changes
npm run prisma:generate
```

### Sample Data

The `npm run db:seed` command populates your database with:

- **14 spending categories** (Dining, Travel, Shopping, etc.)
- **500+ MCC codes** with merchant patterns
- **50+ credit cards** with benefits and rates
- **Merchant aliases** for better categorization

## 🚀 Next Steps

Once everything is running:

1. **Test the full workflow**:
   - Upload a sample PDF statement
   - Watch the real-time processing
   - View the generated recommendations

2. **Explore the API**:
   - Check out the Swagger documentation
   - Test endpoints with sample data

3. **Customize the application**:
   - Modify the branding in environment variables
   - Add your own credit card data
   - Adjust processing parameters

## 📞 Getting Help

If you're still having issues:

1. **Check the logs**: Both frontend and backend show detailed error messages
2. **Verify prerequisites**: Ensure all required software is installed and running
3. **Review environment variables**: Double-check all required values are set
4. **Database connectivity**: Test your PostgreSQL connection independently

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database users
- Keep your Gemini API key secure
- Consider using environment-specific configurations for production

---

**Happy coding! 🎉**

If you encounter any issues not covered here, please create an issue in the repository with:
- Your operating system
- Node.js version (`node --version`)
- Complete error messages
- Steps to reproduce the issue
