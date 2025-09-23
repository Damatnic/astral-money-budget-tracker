import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        expenses: [],
        note: 'Database not configured - using fallback data'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: 'user@astralmoney.com' }
    });

    if (!user) {
      return NextResponse.json({
        expenses: [],
        note: 'User not found'
      });
    }

    // Get recent expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      expenses,
      count: expenses.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Expenses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { amount, description, category, date } = await request.json();

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

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        expense: {
          id: 'sim_' + Date.now(),
          amount,
          description,
          category,
          date: date || new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        note: 'Simulated expense - database not configured'
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

    // Create expense
    const expense = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'expense',
        amount,
        description,
        category,
        date: date ? new Date(date) : new Date(),
      }
    });

    // Update user balance
    const newBalance = user.balance - amount;
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: newBalance }
    });

    return NextResponse.json({
      expense,
      newBalance,
      source: 'database'
    });

  } catch (error) {
    console.error('Expense creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}