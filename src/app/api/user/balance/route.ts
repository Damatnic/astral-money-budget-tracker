import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/db';

export async function GET() {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        balance: 11.29,
        lastUpdated: new Date().toISOString(),
        note: 'Using fallback data - database not configured'
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: 'user@astralmoney.com' }
    });

    if (!user) {
      return NextResponse.json({
        balance: 11.29,
        lastUpdated: new Date().toISOString(),
        note: 'User not found - using fallback data'
      });
    }

    return NextResponse.json({
      balance: user.balance,
      lastUpdated: user.updatedAt,
      source: 'database'
    });

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json({
      balance: 11.29,
      lastUpdated: new Date().toISOString(),
      note: 'Error fetching balance - using fallback'
    });
  }
}

export async function PUT(request: Request) {
  try {
    const { balance } = await request.json();

    if (typeof balance !== 'number') {
      return NextResponse.json(
        { error: 'Balance must be a number' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        balance: balance,
        lastUpdated: new Date().toISOString(),
        note: 'Simulated update - database not configured'
      });
    }

    // Update user balance
    const user = await prisma.user.update({
      where: { email: 'user@astralmoney.com' },
      data: { balance }
    });

    return NextResponse.json({
      balance: user.balance,
      lastUpdated: user.updatedAt,
      source: 'database'
    });

  } catch (error) {
    console.error('Balance update error:', error);
    return NextResponse.json(
      { error: 'Failed to update balance' },
      { status: 500 }
    );
  }
}