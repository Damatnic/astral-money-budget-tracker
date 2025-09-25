/**
 * Enterprise Expenses API Route
 * Comprehensive validation, security, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { ValidationEngine, ValidationSchemas } from '@/lib/validation';
import { AuditLogger } from '@/utils/security';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  
  try {
    // Check database availability
    if (!process.env.DATABASE_URL) {
      await AuditLogger.logSecurityEvent('system', 'database_unavailable', {
        level: 'error' as any,
        data: {
          endpoint: '/api/expenses',
          method: 'GET',
          requestId,
        },
      });
      
      return NextResponse.json({
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Parse query parameters with validation
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 1000);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const category = url.searchParams.get('category');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      userId: user.id,
      type: 'expense',
    };

    // Add category filter if provided
    if (category && ValidationSchemas.transaction.category.enum!.includes(category)) {
      whereClause.category = category;
    }

    // Add date filters with validation
    if (startDate || endDate) {
      whereClause.date = {};
      
      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          whereClause.date.gte = parsedStartDate;
        }
      }
      
      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          whereClause.date.lte = parsedEndDate;
        }
      }
    } else {
      // Default to last 30 days if no date filters
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.createdAt = { gte: thirtyDaysAgo };
    }

    // Execute query with performance monitoring
    const queryStart = Date.now();
    const [expenses, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          amount: true,
          description: true,
          category: true,
          date: true,
          createdAt: true,
        },
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);
    const queryTime = Date.now() - queryStart;

    // Log data access
    await AuditLogger.logDataAccessEvent('read', user.id, 'expenses', {
      recordsAffected: expenses.length,
      success: true,
      metadata: { 
        totalCount,
        queryTime,
        filters: { category, startDate, endDate, limit, offset },
        requestId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: expenses,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + expenses.length < totalCount,
        },
      },
      metadata: {
        source: 'database',
        queryTime,
        requestId,
      },
    });

  } catch (error) {
    await AuditLogger.logSecurityEvent('api', 'error', {
      level: 'error' as any,
      data: {
        endpoint: '/api/expenses',
        method: 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    // Error already logged via AuditLogger
    return NextResponse.json(
      { 
        error: 'Failed to fetch expenses',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        error: 'Invalid JSON payload',
        code: 'INVALID_JSON',
        requestId,
      }, { status: 400 });
    }

    // Comprehensive validation
    const validationResult = await ValidationEngine.validateRequest(
      body, 
      ValidationSchemas.transaction,
      { strictMode: true, sanitize: true }
    );

    if (!validationResult.isValid) {
      // Log validation failures
      await AuditLogger.logSecurityEvent('validation', 'failed', {
        level: 'warn' as any,
        data: {
          endpoint: '/api/expenses',
          method: 'POST',
          errors: validationResult.errors,
          securityScore: validationResult.securityScore,
          securityFlags: validationResult.metadata.securityFlags,
          requestId,
          severity: validationResult.errors.some(e => e.severity === 'critical') ? 'critical' : 'medium',
        }
      });

      return NextResponse.json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationResult.errors.map(e => ({
          field: e.field,
          message: e.message,
          code: e.code,
        })),
        securityScore: validationResult.securityScore,
        requestId,
      }, { status: 400 });
    }

    const { amount, description, category, date } = validationResult.sanitizedData;

    // Check database availability
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Business logic validation
    if (amount > user.balance + 10000) { // Allow some overdraft
      await AuditLogger.logSecurityEvent('transaction', 'suspicious', {
        level: 'error' as any,
        userId: user.id,
        data: {
          amount,
          userBalance: user.balance,
          requestId,
          severity: 'high',
        }
      });

      return NextResponse.json({
        error: 'Transaction amount exceeds available balance',
        code: 'INSUFFICIENT_FUNDS',
        requestId,
      }, { status: 422 });
    }

    // Create expense within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create expense
      const expense = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'expense',
          amount,
          description,
          category,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Update user balance
      const newBalance = user.balance - amount;
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
      });

      return { expense, newBalance: updatedUser.balance };
    });

    // Log successful transaction
    await AuditLogger.logDataAccessEvent('write', user.id, 'expenses', {
      recordsAffected: 1,
      success: true,
      metadata: {
        transactionId: result.expense.id,
        amount,
        category,
        newBalance: result.newBalance,
        requestId,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: result.expense,
        newBalance: result.newBalance,
      },
      metadata: {
        source: 'database',
        requestId,
      },
    }, { status: 201 });

  } catch (error) {
    await AuditLogger.logSecurityEvent('api', 'error', {
      level: 'error' as any,
      data: {
        endpoint: '/api/expenses',
        method: 'POST',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        severity: 'high',
      }
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    // Error already logged via AuditLogger
    return NextResponse.json(
      { 
        error: 'Failed to create expense',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        error: 'Invalid JSON payload',
        code: 'INVALID_JSON',
        requestId,
      }, { status: 400 });
    }

    // Validate ID is provided
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({
        error: 'Transaction ID is required',
        code: 'MISSING_ID',
        requestId,
      }, { status: 400 });
    }

    // Validate update data (partial validation)
    const updateSchema = { ...ValidationSchemas.transaction };
    // Make all fields optional for updates except ID
    Object.keys(updateSchema).forEach(key => {
      updateSchema[key] = { ...updateSchema[key], required: false };
    });

    const validationResult = await ValidationEngine.validateRequest(
      body,
      updateSchema,
      { strictMode: true, sanitize: true }
    );

    if (!validationResult.isValid) {
      await AuditLogger.logSecurityEvent('validation', 'failed', {
        level: 'warn' as any,
        data: {
          endpoint: '/api/expenses',
          method: 'PUT',
          errors: validationResult.errors,
          requestId,
          severity: 'medium',
        }
      });

      return NextResponse.json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationResult.errors.map(e => ({
          field: e.field,
          message: e.message,
          code: e.code,
        })),
        requestId,
      }, { status: 400 });
    }

    const { id, amount, description, category, date } = validationResult.sanitizedData;

    // Check database availability
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Update expense within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the old expense with ownership check
      const oldExpense = await tx.transaction.findUnique({
        where: { id, userId: user.id },
      });

      if (!oldExpense) {
        throw new Error('EXPENSE_NOT_FOUND');
      }

      // Update expense
      const updatedExpense = await tx.transaction.update({
        where: { id, userId: user.id },
        data: {
          amount: amount !== undefined ? amount : oldExpense.amount,
          description: description !== undefined ? description : oldExpense.description,
          category: category !== undefined ? category : oldExpense.category,
          date: date !== undefined ? new Date(date) : oldExpense.date,
        },
      });

      // Calculate and update balance adjustment
      const balanceAdjustment = (oldExpense.amount as number) - (updatedExpense.amount as number);
      const newBalance = user.balance + balanceAdjustment;
      
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
      });

      return { 
        expense: updatedExpense, 
        newBalance: updatedUser.balance,
        oldAmount: oldExpense.amount,
      };
    });

    // Log successful update
    await AuditLogger.logDataAccessEvent('write', user.id, 'expenses', {
      recordsAffected: 1,
      success: true,
      metadata: {
        transactionId: id,
        oldAmount: result.oldAmount,
        newAmount: result.expense.amount,
        balanceChange: (result.oldAmount as number) - (result.expense.amount as number),
        requestId,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: result.expense,
        newBalance: result.newBalance,
      },
      metadata: {
        source: 'database',
        requestId,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'EXPENSE_NOT_FOUND') {
      return NextResponse.json({
        error: 'Expense not found or access denied',
        code: 'NOT_FOUND',
        requestId,
      }, { status: 404 });
    }

    await AuditLogger.logSecurityEvent('api', 'error', {
      level: 'error' as any,
      data: {
        endpoint: '/api/expenses',
        method: 'PUT',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        severity: 'high',
      }
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    // Error already logged via AuditLogger
    return NextResponse.json(
      { 
        error: 'Failed to update expense',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        error: 'Invalid JSON payload',
        code: 'INVALID_JSON',
        requestId,
      }, { status: 400 });
    }

    // Validate ID
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({
        error: 'Transaction ID is required',
        code: 'MISSING_ID',
        requestId,
      }, { status: 400 });
    }

    const { id } = body;

    // Check database availability
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Delete expense within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the expense with ownership check
      const expense = await tx.transaction.findUnique({
        where: { id, userId: user.id },
      });

      if (!expense) {
        throw new Error('EXPENSE_NOT_FOUND');
      }

      // Delete expense
      await tx.transaction.delete({
        where: { id, userId: user.id },
      });

      // Refund balance
      const newBalance = user.balance + (expense.amount as number);
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
      });

      return { 
        deletedExpense: expense,
        newBalance: updatedUser.balance,
      };
    });

    // Log successful deletion
    await AuditLogger.logDataAccessEvent('delete', user.id, 'expenses', {
      recordsAffected: 1,
      success: true,
      metadata: {
        transactionId: id,
        refundedAmount: result.deletedExpense.amount,
        newBalance: result.newBalance,
        requestId,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Expense deleted successfully',
        newBalance: result.newBalance,
        refundedAmount: result.deletedExpense.amount,
      },
      metadata: {
        source: 'database',
        requestId,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'EXPENSE_NOT_FOUND') {
      return NextResponse.json({
        error: 'Expense not found or access denied',
        code: 'NOT_FOUND',
        requestId,
      }, { status: 404 });
    }

    await AuditLogger.logSecurityEvent('api', 'error', {
      level: 'error' as any,
      data: {
        endpoint: '/api/expenses',
        method: 'DELETE',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        severity: 'high',
      }
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    // Error already logged via AuditLogger
    return NextResponse.json(
      { 
        error: 'Failed to delete expense',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}