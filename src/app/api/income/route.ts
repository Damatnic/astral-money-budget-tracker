import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await requireAuth();
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        income: [],
        note: 'Database not configured - using fallback data'
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
    const user = await requireAuth();
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

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const { id, amount, description, source, date } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Simulated update - database not configured',
        income: { id, amount, description, source, date }
      });
    }

    // Get the old income to calculate balance adjustment
    const oldIncome = await prisma.transaction.findUnique({
      where: { id, userId: user.id }
    });

    if (!oldIncome) {
      return NextResponse.json(
        { error: 'Income not found' },
        { status: 404 }
      );
    }

    // Update income
    const updatedIncome = await prisma.transaction.update({
      where: { id, userId: user.id },
      data: {
        amount: amount || oldIncome.amount,
        description: description || oldIncome.description,
        category: source || oldIncome.category,
        date: date ? new Date(date) : oldIncome.date,
      }
    });

    // Update user balance (adjust for the difference)
    const balanceAdjustment = (updatedIncome.amount as number) - (oldIncome.amount as number);
    const newBalance = user.balance + balanceAdjustment;
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: newBalance }
    });

    return NextResponse.json({
      income: updatedIncome,
      newBalance,
      source: 'database'
    });

  } catch (error) {
    console.error('Income update error:', error);
    return NextResponse.json(
      { error: 'Failed to update income entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Simulated delete - database not configured'
      });
    }

    // Get the income to adjust the balance
    const income = await prisma.transaction.findUnique({
      where: { id, userId: user.id }
    });

    if (!income) {
      return NextResponse.json(
        { error: 'Income not found' },
        { status: 404 }
      );
    }

    // Delete income
    await prisma.transaction.delete({
      where: { id, userId: user.id }
    });

    // Adjust balance (subtract the income)
    const newBalance = user.balance - (income.amount as number);
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: newBalance }
    });

    return NextResponse.json({
      message: 'Income deleted successfully',
      newBalance,
      source: 'database'
    });

  } catch (error) {
    console.error('Income deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete income entry' },
      { status: 500 }
    );
  }
}