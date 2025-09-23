import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        income: [],
        note: 'Database not configured - using fallback data'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: 'user@astralmoney.com' }
    });

    if (!user) {
      return NextResponse.json({
        income: [],
        note: 'User not found'
      });
    }

    // Get recent income (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const income = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'income',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      income,
      count: income.length,
      total: income.reduce((sum, item) => sum + item.amount, 0),
      source: 'database'
    });

  } catch (error) {
    console.error('Income API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { amount, description, source, date } = await request.json();

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!source || typeof source !== 'string') {
      return NextResponse.json(
        { error: 'Income source is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        income: {
          id: 'sim_' + Date.now(),
          amount,
          description,
          category: source,
          date: date || new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        note: 'Simulated income - database not configured'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: 'user@astralmoney.com' }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create income transaction
    const income = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'income',
        amount,
        description,
        category: source,
        date: date ? new Date(date) : new Date(),
      }
    });

    // Update user balance
    const newBalance = user.balance + amount;
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: newBalance }
    });

    return NextResponse.json({
      income,
      newBalance,
      source: 'database'
    });

  } catch (error) {
    console.error('Income creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create income entry' },
      { status: 500 }
    );
  }
}