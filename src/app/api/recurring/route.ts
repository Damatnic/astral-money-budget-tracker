import { NextResponse } from 'next/server';
import prisma from '../../../../lib/db';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        recurring: [],
        note: 'Database not configured - using fallback data'
      });
    }

    const recurringBills = await prisma.recurringBill.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      recurring: recurringBills,
      count: recurringBills.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Recurring bills API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring bills' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, amount, frequency, category, startDate, endDate } = await request.json();

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!frequency || !['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Valid frequency is required' },
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
        recurring: {
          id: 'sim_' + Date.now(),
          name,
          amount,
          frequency,
          category,
          startDate: startDate || new Date().toISOString(),
          endDate: endDate || null,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        note: 'Simulated recurring bill - database not configured'
      });
    }

    // Create recurring bill
    const recurringBill = await prisma.recurringBill.create({
      data: {
        name,
        amount,
        frequency,
        category,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      }
    });

    return NextResponse.json({
      recurring: recurringBill,
      source: 'database'
    });

  } catch (error) {
    console.error('Recurring bill creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring bill' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Simulated update - database not configured'
      });
    }

    // Update recurring bill active status
    const updatedBill = await prisma.recurringBill.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({
      recurring: updatedBill,
      source: 'database'
    });

  } catch (error) {
    console.error('Recurring bill update error:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring bill' },
      { status: 500 }
    );
  }
}