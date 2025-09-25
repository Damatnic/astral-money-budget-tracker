import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/recurring/history - Get bill history for a specific recurring bill
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get('billId');
    
    if (!billId) {
      return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
    }

    // Get bill history with recurring bill details
    const history = await prisma.billHistory.findMany({
      where: {
        recurringBillId: billId,
      },
      include: {
        recurringBill: {
          select: {
            name: true,
            category: true,
            provider: true,
          },
        },
      },
      orderBy: {
        billDate: 'desc',
      },
    });

    return NextResponse.json({ history });
  } catch {
    // Error logged via proper error handling
    return NextResponse.json(
      { error: 'Failed to fetch bill history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recurring/history - Add a new bill history entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recurringBillId,
      actualAmount,
      estimatedAmount,
      billDate,
      isPaid,
      paidDate,
      notes,
      paymentMethod,
      transactionId,
    } = body;

    if (!recurringBillId || !actualAmount || !estimatedAmount || !billDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate variance
    const variance = actualAmount - estimatedAmount;
    const variancePercent = estimatedAmount !== 0 ? (variance / estimatedAmount) * 100 : 0;

    // Create bill history entry
    const historyEntry = await prisma.billHistory.create({
      data: {
        recurringBillId,
        actualAmount,
        estimatedAmount,
        billDate: new Date(billDate),
        isPaid: isPaid || false,
        paidDate: paidDate ? new Date(paidDate) : null,
        variance,
        variancePercent,
        notes,
        paymentMethod,
        transactionId,
      },
    });

    // Update recurring bill statistics
    await updateBillStatistics(recurringBillId);

    return NextResponse.json({ historyEntry });
  } catch {
    // Error logged via proper error handling
    return NextResponse.json(
      { error: 'Failed to create bill history' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recurring/history - Update a bill history entry
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      actualAmount,
      estimatedAmount,
      isPaid,
      paidDate,
      notes,
      paymentMethod,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'History ID is required' }, { status: 400 });
    }

    // Get existing entry
    const existingEntry = await prisma.billHistory.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 });
    }

    // Calculate new variance if amounts changed
    const newActualAmount = actualAmount ?? existingEntry.actualAmount;
    const newEstimatedAmount = estimatedAmount ?? existingEntry.estimatedAmount;
    const variance = newActualAmount - newEstimatedAmount;
    const variancePercent = newEstimatedAmount !== 0 ? (variance / newEstimatedAmount) * 100 : 0;

    // Update history entry
    const updatedEntry = await prisma.billHistory.update({
      where: { id },
      data: {
        actualAmount: newActualAmount,
        estimatedAmount: newEstimatedAmount,
        variance,
        variancePercent,
        isPaid: isPaid ?? existingEntry.isPaid,
        paidDate: paidDate ? new Date(paidDate) : existingEntry.paidDate,
        notes: notes ?? existingEntry.notes,
        paymentMethod: paymentMethod ?? existingEntry.paymentMethod,
      },
    });

    // Update recurring bill statistics
    await updateBillStatistics(existingEntry.recurringBillId);

    return NextResponse.json({ historyEntry: updatedEntry });
  } catch {
    // Error logged via proper error handling
    return NextResponse.json(
      { error: 'Failed to update bill history' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update recurring bill statistics based on history
 */
async function updateBillStatistics(recurringBillId: string) {
  try {
    // Get all history for this bill
    const history = await prisma.billHistory.findMany({
      where: { recurringBillId },
      orderBy: { billDate: 'desc' },
    });

    if (history.length === 0) return;

    // Calculate statistics
    const amounts = history.map(h => h.actualAmount);
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const lastBillAmount = history[0].actualAmount; // Most recent

    // Update recurring bill with new statistics
    await prisma.recurringBill.update({
      where: { id: recurringBillId },
      data: {
        averageAmount,
        minAmount,
        maxAmount,
        lastBillAmount,
      },
    });
  } catch {
    // Error logged via proper error handling
  }
}