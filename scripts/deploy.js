#!/usr/bin/env node

/**
 * Deployment script for Astral Money Budget Tracker
 * Sets up Neon database and deploys to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Astral Money deployment process...\n');

// Check if required dependencies are installed
function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    console.log('✅ Vercel CLI is installed');
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed');
  }

  try {
    execSync('prisma --version', { stdio: 'ignore' });
    console.log('✅ Prisma CLI is available');
  } catch (error) {
    console.log('❌ Prisma not found. Installing...');
    execSync('npm install prisma @prisma/client', { stdio: 'inherit' });
    console.log('✅ Prisma installed');
  }
}

// Setup environment variables
function setupEnvironment() {
  console.log('\n🔧 Setting up environment...');
  
  const envExample = path.join(process.cwd(), '.env.example');
  const envLocal = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envLocal) && fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envLocal);
    console.log('✅ Created .env.local from .env.example');
    console.log('⚠️  Please update .env.local with your Neon database URL');
  }
}

// Database setup
function setupDatabase() {
  console.log('\n🗄️  Setting up database...');
  
  try {
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
    
    console.log('Running database migrations...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema synchronized');
    
    console.log('Seeding database...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
    console.log('✅ Database seeded with initial data');
    
  } catch (error) {
    console.log('⚠️  Database setup skipped (make sure to set DATABASE_URL in .env.local)');
    console.log('   You can run these commands manually after setting up your database:');
    console.log('   npx prisma generate');
    console.log('   npx prisma db push');
    console.log('   node prisma/seed.js');
  }
}

// Vercel deployment
function deployToVercel() {
  console.log('\n🚀 Deploying to Vercel...');
  
  try {
    // Login to Vercel (if not already logged in)
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Already logged in to Vercel');
    } catch (error) {
      console.log('🔐 Please log in to Vercel...');
      execSync('vercel login', { stdio: 'inherit' });
    }
    
    // Deploy
    console.log('Deploying application...');
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment completed successfully!');
    
  } catch (error) {
    console.log('❌ Deployment failed:', error.message);
    console.log('You can deploy manually by running: vercel --prod');
  }
}

// Instructions
function showInstructions() {
  console.log('\n📋 Next Steps:');
  console.log('1. 🔗 Create a Neon database at: https://neon.tech');
  console.log('2. 📝 Copy your database URL to .env.local');
  console.log('3. 🔄 Run: npx prisma db push');
  console.log('4. 🌱 Run: node prisma/seed.js');
  console.log('5. 🚀 Run: vercel --prod');
  console.log('\n🎉 Your Astral Money Budget Tracker will be live!');
  console.log('\n💡 Features included:');
  console.log('   • Real-time financial health scoring');
  console.log('   • Expandable Hell Week bills display');
  console.log('   • Smart recurring bill management');
  console.log('   • Professional glass morphism design');
  console.log('   • Mobile-responsive interface');
  console.log('   • Database persistence with Neon');
}

// Main execution
async function main() {
  try {
    checkDependencies();
    setupEnvironment();
    
    // Check if DATABASE_URL is set
    const envLocal = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocal)) {
      const envContent = fs.readFileSync(envLocal, 'utf8');
      if (envContent.includes('DATABASE_URL="postgresql://')) {
        setupDatabase();
        deployToVercel();
      } else {
        console.log('\n⚠️  DATABASE_URL not configured in .env.local');
        showInstructions();
      }
    } else {
      showInstructions();
    }
    
  } catch (error) {
    console.error('❌ Deployment script failed:', error.message);
    process.exit(1);
  }
}

main();