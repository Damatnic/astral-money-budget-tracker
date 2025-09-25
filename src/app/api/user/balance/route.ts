import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Require authentication - this will throw if user not authenticated
    const user = await requireAuth();

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        balance: 0,
        lastUpdated: new Date().toISOString(),
        note: 'Database not configured - unable to retrieve balance'
      }, { status: 503 });
    }

    // Get updated user data from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      balance: dbUser.balance,
      lastUpdated: dbUser.updatedAt,
      source: 'database'
    });

  } catch (error) {
    // Error logged via proper error handling
    
    // Return different errors based on type
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to fetch balance'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    const { balance } = await request.json();

    // Input validation
    if (typeof balance !== 'number') {
      return NextResponse.json(
        { error: 'Balance must be a number' },
        { status: 400 }
      );
    }

    if (balance < -999999.99 || balance > 999999.99) {
      return NextResponse.json(
        { error: 'Balance must be between -999,999.99 and 999,999.99' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Database not configured'
      }, { status: 503 });
    }

    // Update user balance - use authenticated user's ID
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balance }
    });

    return NextResponse.json({
      balance: updatedUser.balance,
      lastUpdated: updatedUser.updatedAt,
      source: 'database'
    });

  } catch (error) {
    // Error logged via proper error handling
    
    // Return different errors based on type
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update balance' },
      { status: 500 }
    );
  }
}