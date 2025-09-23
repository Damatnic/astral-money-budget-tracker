# 🚀 Astral Money Deployment Guide

Complete guide for deploying the Ultimate Budget Tracker 2025 to Vercel with Neon database integration.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)
- [Vercel CLI](https://vercel.com/cli)
- [Neon](https://neon.tech/) account for database

## 🗄️ Database Setup (Neon)

### 1. Create Neon Database

1. Go to [Neon.tech](https://neon.tech/) and create a free account
2. Create a new project: **"Astral Money Budget Tracker"**
3. Choose region closest to your users
4. Copy the connection string when provided

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your database URL
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialize Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed
```

## 🌐 Vercel Deployment

### Method 1: Automated Deployment Script

```bash
# Run the automated deployment script
npm run deploy
```

This script will:
- ✅ Check all dependencies
- ✅ Setup environment variables
- ✅ Initialize database
- ✅ Deploy to Vercel

### Method 2: Manual Deployment

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy Application

```bash
# Deploy to production
vercel --prod
```

#### 4. Set Environment Variables

In the Vercel dashboard, add these environment variables:

```
DATABASE_URL=your_neon_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=your_vercel_domain
```

## 🔧 Local Development

### 1. Clone Repository

```bash
git clone https://github.com/Damatnic/astral-money-budget-tracker.git
cd astral-money-budget-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local with your database URL
```

### 4. Initialize Database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 📊 Database Management

### Useful Commands

```bash
# View database in browser
npm run db:studio

# Reset database (destructive)
npm run db:reset

# Generate client after schema changes
npm run db:generate

# Push schema changes
npm run db:push

# Reseed database
npm run db:seed
```

### Database Schema

The application includes these main tables:
- **Users** - User accounts and balances
- **Budgets** - Monthly budget tracking
- **Bills** - Individual bills and expenses
- **Transactions** - Financial transactions
- **FinancialGoals** - Savings and debt goals
- **RecurringBills** - Template for recurring expenses

## 🎯 Features Included

### ✅ Core Features
- Real-time financial health scoring
- Expandable Hell Week bills display
- Smart recurring bill management
- Professional glass morphism design
- Mobile-responsive interface
- Database persistence with Neon

### ✅ API Endpoints
- `GET /api/health` - System health check
- `GET /api/budget/[month]` - Monthly budget data
- `GET /api/bills` - Bill management
- `GET /api/analytics/health-score` - Financial health
- `GET /api/user/balance` - User balance

### ✅ Database Features
- Complete Prisma schema
- Automated seeding with real data
- Financial health calculations
- Transaction tracking
- Goal progress monitoring

## 🔐 Security Features

- Environment variable protection
- Database connection security
- API rate limiting ready
- CORS protection
- XSS protection headers

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile navigation
- Progressive Web App ready

## 🎨 Design Highlights

- **Glass Morphism** UI with backdrop blur effects
- **Dark Theme** optimized for financial data
- **Professional Typography** and spacing
- **Smooth Animations** and micro-interactions
- **Visual Indicators** for financial health

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check database connection
npx prisma db push

# Verify environment variables
echo $DATABASE_URL
```

### Deployment Issues

```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod --force
```

### Local Development Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/Damatnic/astral-money-budget-tracker/issues)
2. Review this deployment guide
3. Check Vercel deployment logs
4. Verify database connection

## 🎉 Success!

Once deployed, your Astral Money Budget Tracker will include:

- ✅ Current balance: $11.29 (from bank statement)
- ✅ 30+ recurring bills automatically populated
- ✅ Hell Week bills ($870) with expandable display
- ✅ 3 paychecks per month tracking
- ✅ Real-time financial health scoring
- ✅ Professional dashboard interface
- ✅ Database persistence with Neon
- ✅ Vercel production deployment

Your budget tracker is now live and ready for financial management! 🎯