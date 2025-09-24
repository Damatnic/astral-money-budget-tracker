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
      include: {
        billHistory: {
          orderBy: { billDate: 'desc' },
          take: 5, // Get last 5 history entries
        },
      },
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
    const { 
      name, 
      amount, 
      frequency, 
      category, 
      startDate, 
      endDate,
      isVariableAmount,
      provider,
      notes,
      billType 
    } = await request.json();

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
          baseAmount: amount,
          frequency,
          category,
          startDate: startDate || new Date().toISOString(),
          endDate: endDate || null,
          isActive: true,
          isVariableAmount: isVariableAmount || false,
          provider: provider || null,
          notes: notes || null,
          billType: billType || 'expense',
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
        baseAmount: amount, // Set baseAmount to the initial amount
        frequency,
        category,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
        isVariableAmount: isVariableAmount || false,
        averageAmount: amount, // Start with current amount as average
        minAmount: amount,
        maxAmount: amount,
        lastBillAmount: amount,
        estimationMethod: isVariableAmount ? 'average' : 'base',
        provider: provider || null,
        notes: notes || null,
        billType: billType || 'expense',
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
    const { 
      id, 
      name, 
      amount, 
      baseAmount,
      frequency, 
      category, 
      startDate, 
      endDate, 
      isActive,
      isVariableAmount,
      provider,
      notes,
      billType,
      estimationMethod
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Simulated update - database not configured',
        recurring: { id, name, amount, frequency, category, startDate, endDate, isActive }
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (baseAmount !== undefined) updateData.baseAmount = baseAmount;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (category !== undefined) updateData.category = category;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVariableAmount !== undefined) updateData.isVariableAmount = isVariableAmount;
    if (provider !== undefined) updateData.provider = provider;
    if (notes !== undefined) updateData.notes = notes;
    if (billType !== undefined) updateData.billType = billType;
    if (estimationMethod !== undefined) updateData.estimationMethod = estimationMethod;

    // Update recurring bill
    const updatedBill = await prisma.recurringBill.update({
      where: { id },
      data: updateData
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

export async function DELETE(request: Request) {
  try {
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

    // Delete recurring bill
    await prisma.recurringBill.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Recurring bill deleted successfully',
      source: 'database'
    });

  } catch (error) {
    console.error('Recurring bill delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring bill' },
      { status: 500 }
    );
  }
}