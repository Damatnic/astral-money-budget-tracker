# 🚀 Astral Money - Enterprise Financial Management System

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Damatnic/astral-money-budget-tracker)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.17.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.6.3-blue.svg)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/security-enterprise--grade-red.svg)](#security-features)
[![Production Ready](https://img.shields.io/badge/production-ready-success.svg)](#production-features)

**Enterprise-grade financial management application built with Next.js 14, TypeScript, and comprehensive security features.**

## 🌟 Key Features

### 💼 Financial Management
- **Real-time Budget Tracking** - Monitor expenses, income, and financial goals
- **Transaction Management** - Create, update, and categorize financial transactions
- **Recurring Bills** - Automated bill tracking with variable amount support
- **Financial Analytics** - Comprehensive reporting and insights
- **Multi-user Support** - Secure user isolation and data protection

### 🔐 Enterprise Security
- **Comprehensive Input Validation** - XSS, SQL injection, and CSRF protection
- **Rate Limiting** - API endpoint protection with configurable limits
- **Secure Authentication** - bcrypt PIN hashing with NextAuth.js
- **Audit Logging** - Complete security event tracking
- **Security Headers** - CSP, HSTS, and other protective headers
- **Session Management** - Secure, configurable session timeouts

### 🚀 Production Features
- **Database Connection Pooling** - Enterprise-grade database management
- **Health Check Endpoints** - Comprehensive system monitoring
- **Error Handling** - Graceful error management and logging
- **Performance Monitoring** - Query performance and metrics tracking
- **Docker Support** - Containerization for easy deployment
- **CI/CD Ready** - Automated testing and deployment pipelines

## 📋 Prerequisites

- **Node.js** >= 18.17.0
- **npm** >= 9.0.0
- **PostgreSQL** database (recommended: Neon, Supabase, or AWS RDS)
- **TypeScript** knowledge recommended

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Damatnic/astral-money-budget-tracker.git
cd astral-money-budget-tracker
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-256-bit-cryptographically-secure-random-secret-key"

# Application Configuration
NODE_ENV="development"
APP_NAME="Astral Money"
APP_VERSION="2.0.0"

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_MAX_AGE=3600
BCRYPT_SALT_ROUNDS=12

# Monitoring Configuration
LOG_LEVEL="info"
ENABLE_REQUEST_LOGGING="true"
ENABLE_AUDIT_LOGGING="true"
ENABLE_DATABASE_METRICS="true"

# Health Check Configuration
HEALTH_CHECK_TOKEN="your-health-check-secret-token"

# Database Connection Pool Settings
DATABASE_MAX_CONNECTIONS=10
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_IDLE_TIMEOUT=10000
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

### 4. Start Development

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14 + React 18 | Server-side rendering and modern UI |
| **Styling** | Tailwind CSS | Utility-first styling framework |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | PostgreSQL + Prisma | Type-safe database operations |
| **Authentication** | NextAuth.js | Secure authentication system |
| **Security** | Custom middleware | Enterprise security layer |
| **Monitoring** | Winston + Custom | Comprehensive logging system |
| **Testing** | Jest + Playwright | Unit and E2E testing |
| **DevOps** | Docker + Vercel | Containerization and deployment |

### Security Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │───▶│   Middleware    │───▶│   API Routes    │
│   (Browser)     │    │   Security      │    │   (Validated)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Rate Limiter  │    │   Database      │
                       │   CSRF/XSS      │    │   (Pooled)      │
                       │   Input Validation│   │                 │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build production bundle
npm run start           # Start production server
npm run clean           # Clean build artifacts

# Code Quality
npm run lint            # Lint and fix code
npm run type-check      # TypeScript type checking
npm run format          # Format code with Prettier
npm run security:audit  # Security vulnerability audit

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run E2E tests
npm run test:security   # Run security tests
npm run test:all        # Run all tests

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Create and run migrations
npm run db:seed         # Seed database with sample data
npm run db:studio       # Open Prisma Studio
npm run db:backup       # Backup database

# Production
npm run production:build    # Production build with checks
npm run production:start    # Start in production mode
npm run production:migrate  # Deploy database migrations

# Monitoring
npm run monitoring:health   # Check system health
npm run monitoring:metrics  # Collect system metrics

# Deployment
npm run deploy:staging  # Deploy to staging
npm run deploy:prod     # Deploy to production
```

### Project Structure

```
astral-money/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── api/            # API routes with validation
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── expenses/   # Expense management
│   │   │   ├── income/     # Income tracking
│   │   │   ├── health/     # Health check endpoint
│   │   │   └── user/       # User management
│   │   ├── auth/           # Authentication pages
│   │   ├── components/     # Reusable UI components
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── ui/            # Base UI components
│   │   └── forms/         # Form components
│   ├── lib/               # Core libraries
│   │   ├── auth.ts        # Authentication configuration
│   │   ├── database.ts    # Database connection pool
│   │   ├── validation.ts  # Input validation engine
│   │   └── auth-utils.ts  # Auth utility functions
│   ├── middleware/        # Custom middleware
│   │   └── security.ts    # Security middleware
│   ├── utils/             # Utility functions
│   │   └── security.ts    # Security utilities
│   └── types/             # TypeScript type definitions
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Database seeding
├── tests/                 # Test files
│   ├── __tests__/        # Unit tests
│   ├── e2e/              # E2E tests
│   └── fixtures/         # Test data
├── scripts/              # Utility scripts
│   ├── deploy.js         # Deployment script
│   ├── health-check.ts   # Health check script
│   └── backup-database.ts # Database backup
├── docs/                 # Documentation
│   ├── api.md           # API documentation
│   ├── security.md      # Security documentation
│   └── deployment.md    # Deployment guide
└── docker/               # Docker configuration
    ├── Dockerfile       # Production Dockerfile
    └── docker-compose.yml # Local development
```

## 🔒 Security Features

### Input Validation & Sanitization
- **XSS Prevention** - Comprehensive input sanitization
- **SQL Injection Protection** - Parameterized queries with Prisma
- **CSRF Protection** - Token-based request validation
- **Input Schema Validation** - Type-safe validation with custom engine

### Authentication & Authorization
- **Secure PIN Authentication** - bcrypt hashing with configurable rounds
- **Session Management** - Secure JWT tokens with configurable timeouts
- **Multi-provider Support** - NextAuth.js with Google/GitHub OAuth
- **Rate Limiting** - Configurable request limits per endpoint

### Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Audit Logging
- **Security Events** - Authentication, authorization failures
- **Data Access** - All CRUD operations logged
- **Performance Metrics** - Query performance tracking
- **Error Tracking** - Comprehensive error logging

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
GET /api/health?token=your-health-check-token
```

**Response:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600000,
  "environment": "production",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database healthy",
      "responseTime": 45
    },
    "memory": {
      "status": "pass",
      "message": "Memory usage normal",
      "details": {
        "usedMB": 128,
        "totalMB": 512,
        "percentage": 25
      }
    },
    "security": {
      "status": "pass",
      "message": "Security configuration healthy"
    }
  },
  "metrics": {
    "responseTime": 95,
    "memoryUsage": {...},
    "processUptime": 3600,
    "requestCount": 1542
  }
}
```

## 🚀 Production Deployment

### Environment Preparation

1. **Database Migration:**
```bash
npm run production:migrate
```

2. **Build Application:**
```bash
npm run production:build
```

3. **Security Audit:**
```bash
npm run security:audit
```

### Vercel Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production (with full checks)
npm run deploy:prod
```

### Environment Variables (Production)

**Critical Production Settings:**
```env
NODE_ENV=production
NEXTAUTH_SECRET="production-secure-secret-minimum-64-chars"
DATABASE_URL="postgresql://prod-user:secure-password@prod-host/database?sslmode=require"
SESSION_MAX_AGE=3600
ENABLE_AUDIT_LOGGING=true
HEALTH_CHECK_TOKEN="secure-health-check-token"
```

## 📈 Performance Optimization

### Database Optimization
- **Connection Pooling** - Configurable pool size and timeouts
- **Query Optimization** - Prisma query optimization and indexing
- **Caching Strategy** - Redis integration ready
- **Performance Monitoring** - Query performance tracking

### Application Optimization
- **Bundle Analysis** - `npm run analyze` for bundle size analysis
- **Image Optimization** - Next.js Image component with Sharp
- **Code Splitting** - Automatic route-based code splitting
- **Compression** - Gzip compression in production

## 🛠️ API Documentation

### Authentication Endpoints

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "pin": "1234"
}
```

### Financial Data Endpoints

```http
GET /api/expenses?limit=50&offset=0&category=groceries&startDate=2024-01-01
GET /api/income
GET /api/recurring
GET /api/user/balance

POST /api/expenses
Content-Type: application/json

{
  "amount": 29.99,
  "description": "Grocery shopping",
  "category": "groceries",
  "date": "2024-01-01"
}
```

### Response Format

All API responses follow this consistent format:

```json
{
  "success": true,
  "data": {...},
  "metadata": {
    "source": "database",
    "queryTime": 45,
    "requestId": "req_1234567890_abc123"
  }
}
```

## 🔧 Configuration

### Security Configuration

```typescript
// Custom security middleware configuration
const SECURITY_CONFIG = {
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: {
      api: 100,      // API routes
      auth: 10,      // Auth routes
      public: 200    // Public routes
    }
  },
  CSRF: {
    enabled: true,
    cookieName: '_csrf',
    headerName: 'x-csrf-token'
  },
  AUDIT: {
    enabled: true,
    logLevel: 'info',
    sensitiveFields: ['pin', 'password', 'token']
  }
};
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
npm run monitoring:health

# Reset database connection
npm run db:reset

# Regenerate Prisma client
npm run db:generate
```

#### Build Issues
```bash
# Clean build artifacts
npm run clean

# Check TypeScript types
npm run type-check

# Full rebuild
npm run clean && npm install && npm run build
```

#### Security Issues
```bash
# Run security audit
npm run security:audit

# Fix security vulnerabilities
npm run security:fix

# Check for security best practices
npm run lint
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style:** Follow ESLint and Prettier configurations
- **Testing:** Write tests for new features and bug fixes
- **Security:** Follow security best practices and run security audits
- **Documentation:** Update documentation for API changes
- **Type Safety:** Ensure full TypeScript coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Issues:** [GitHub Issues](https://github.com/Damatnic/astral-money-budget-tracker/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Damatnic/astral-money-budget-tracker/discussions)
- **Security:** Report security issues to security@astralmoney.com

## 🚀 What's Next

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Multi-currency support
- [ ] Investment tracking
- [ ] API rate limiting dashboard
- [ ] Real-time notifications
- [ ] Advanced fraud detection
- [ ] Machine learning insights

---

**Built with ❤️ by the Astral Money Team**

*Enterprise-grade security and production-ready architecture for modern financial applications.*