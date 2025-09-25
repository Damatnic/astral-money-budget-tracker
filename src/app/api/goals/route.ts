/**
 * Financial Goals API Route
 * Complete CRUD operations with comprehensive validation, security, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { ValidationEngine } from '@/lib/validation';
import { AuditLogger } from '@/utils/security';
import type { CreateFinancialGoalRequest, UpdateFinancialGoalRequest } from '@/types';

// Validation schema for financial goals
const goalValidationSchema = {
  title: {
    type: 'string' as const,
    required: true,
    minLength: 1,
    maxLength: 200,
    sanitize: true
  },
  targetAmount: {
    type: 'number' as const,
    required: true,
    min: 0.01,
    max: 1000000,
    sanitize: true
  },
  currentAmount: {
    type: 'number' as const,
    required: false,
    min: 0,
    max: 1000000,
    sanitize: true
  },
  deadline: {
    type: 'string' as const,
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/
  },
  category: {
    type: 'string' as const,
    required: true,
    enum: ['emergency', 'savings', 'debt', 'investment', 'purchase'],
    sanitize: true
  }
};

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  
  try {
    // Check database availability
    if (!process.env.DATABASE_URL) {
      await AuditLogger.logSecurityEvent('system', 'database_unavailable', {
        level: 'error' as any,
        data: {
          endpoint: '/api/goals',
          method: 'GET',
          requestId,
        },
      });
      
      return NextResponse.json({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const category = url.searchParams.get('category');
    const completed = url.searchParams.get('completed');

    // Build where clause
    const whereClause: any = {
      userId: user.id,
    };

    // Add category filter if provided
    if (category && ['emergency', 'savings', 'debt', 'investment', 'purchase'].includes(category)) {
      whereClause.category = category;
    }

    // Add completion filter if provided
    if (completed !== null) {
      whereClause.isCompleted = completed === 'true';
    }

    // Execute query with performance monitoring
    const queryStart = Date.now();
    const [goals, totalCount] = await Promise.all([
      prisma.financialGoal.findMany({
        where: whereClause,
        orderBy: [
          { isCompleted: 'asc' }, // Show incomplete goals first
          { deadline: 'asc' }, // Then by deadline
          { createdAt: 'desc' } // Finally by creation date
        ],
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          targetAmount: true,
          currentAmount: true,
          deadline: true,
          category: true,
          isCompleted: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.financialGoal.count({ where: whereClause }),
    ]);
    const queryTime = Date.now() - queryStart;

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
    }));

    // Log data access
    await AuditLogger.logDataAccessEvent('read', user.id, 'goals', {
      recordsAffected: goals.length,
      success: true,
      metadata: { 
        totalCount,
        queryTime,
        filters: { category, completed, limit, offset },
        requestId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        goals: goalsWithProgress,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + goals.length < totalCount,
        },
        summary: {
          totalGoals: totalCount,
          completedGoals: goals.filter(g => g.isCompleted).length,
          totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
          totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
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
        endpoint: '/api/goals',
        method: 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch financial goals',
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
    let body: CreateFinancialGoalRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON payload',
        code: 'INVALID_JSON',
        requestId,
      }, { status: 400 });
    }

    // Comprehensive validation
    const validationResult = await ValidationEngine.validateRequest(
      body, 
      goalValidationSchema,
      { strictMode: true, sanitize: true }
    );

    if (!validationResult.isValid) {
      // Log validation failures
      await AuditLogger.logSecurityEvent('validation', 'failed', {
        level: 'warn' as any,
        data: {
          endpoint: '/api/goals',
          method: 'POST',
          errors: validationResult.errors,
          securityScore: validationResult.securityScore,
          requestId,
        }
      });

      return NextResponse.json({
        success: false,
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

    const { title, targetAmount, currentAmount, deadline, category } = validationResult.sanitizedData;

    // Check database availability
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Business logic validation
    if (currentAmount && currentAmount > targetAmount) {
      return NextResponse.json({
        success: false,
        error: 'Current amount cannot exceed target amount',
        code: 'BUSINESS_RULE_VIOLATION',
        requestId,
      }, { status: 422 });
    }

    // Check for duplicate goal titles for the user
    const existingGoal = await prisma.financialGoal.findFirst({
      where: {
        userId: user.id,
        title: title.trim(),
        isCompleted: false,
      },
    });

    if (existingGoal) {
      return NextResponse.json({
        success: false,
        error: 'A goal with this title already exists',
        code: 'DUPLICATE_GOAL',
        requestId,
      }, { status: 409 });
    }

    // Create goal
    const goal = await prisma.financialGoal.create({
      data: {
        userId: user.id,
        title: title.trim(),
        targetAmount,
        currentAmount: currentAmount || 0,
        deadline: deadline ? new Date(deadline) : null,
        category,
        isCompleted: currentAmount ? currentAmount >= targetAmount : false,
      },
    });

    // Log successful creation
    await AuditLogger.logDataAccessEvent('write', user.id, 'goals', {
      recordsAffected: 1,
      success: true,
      metadata: {
        goalId: goal.id,
        targetAmount,
        currentAmount: currentAmount || 0,
        category,
        requestId,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        goal: {
          ...goal,
          progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
          remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
        },
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
        endpoint: '/api/goals',
        method: 'POST',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      }
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create financial goal',
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
    let body: UpdateFinancialGoalRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON payload',
        code: 'INVALID_JSON',
        requestId,
      }, { status: 400 });
    }

    // Validate ID is provided
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Goal ID is required',
        code: 'MISSING_ID',
        requestId,
      }, { status: 400 });
    }

    // Create partial validation schema (all fields optional except ID)
    const updateSchema = { ...goalValidationSchema };
    Object.keys(updateSchema).forEach(key => {
      if (key !== 'id') {
        updateSchema[key] = { ...updateSchema[key], required: false };
      }
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
          endpoint: '/api/goals',
          method: 'PUT',
          errors: validationResult.errors,
          requestId,
        }
      });

      return NextResponse.json({
        success: false,
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

    const { id, title, targetAmount, currentAmount, deadline, category, isCompleted } = validationResult.sanitizedData;

    // Check database availability
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Update goal within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the existing goal with ownership check
      const existingGoal = await tx.financialGoal.findUnique({
        where: { id, userId: user.id },
      });

      if (!existingGoal) {
        throw new Error('GOAL_NOT_FOUND');
      }

      // Prepare update data
      const updateData: any = {};
      
      if (title !== undefined) updateData.title = title.trim();
      if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
      if (currentAmount !== undefined) updateData.currentAmount = currentAmount;
      if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
      if (category !== undefined) updateData.category = category;
      if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

      // Auto-complete goal if current amount meets or exceeds target
      const newCurrentAmount = currentAmount !== undefined ? currentAmount : existingGoal.currentAmount;
      const newTargetAmount = targetAmount !== undefined ? targetAmount : existingGoal.targetAmount;
      
      if (newCurrentAmount >= newTargetAmount && !existingGoal.isCompleted) {
        updateData.isCompleted = true;
      }

      // Business logic validation
      if (newCurrentAmount > newTargetAmount && isCompleted !== true) {
        throw new Error('CURRENT_EXCEEDS_TARGET');
      }

      // Check for duplicate titles (if title is being changed)
      if (title && title.trim() !== existingGoal.title) {
        const duplicateGoal = await tx.financialGoal.findFirst({
          where: {
            userId: user.id,
            title: title.trim(),
            isCompleted: false,
            id: { not: id },
          },
        });

        if (duplicateGoal) {
          throw new Error('DUPLICATE_GOAL');
        }
      }

      // Update the goal
      const updatedGoal = await tx.financialGoal.update({
        where: { id, userId: user.id },
        data: updateData,
      });

      return updatedGoal;
    });

    // Log successful update
    await AuditLogger.logDataAccessEvent('write', user.id, 'goals', {
      recordsAffected: 1,
      success: true,
      metadata: {
        goalId: id,
        updatedFields: Object.keys(validationResult.sanitizedData).filter(k => k !== 'id'),
        requestId,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        goal: {
          ...result,
          progress: result.targetAmount > 0 ? (result.currentAmount / result.targetAmount) * 100 : 0,
          remainingAmount: Math.max(0, result.targetAmount - result.currentAmount),
        },
      },
      metadata: {
        source: 'database',
        requestId,
      },
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'GOAL_NOT_FOUND') {
        return NextResponse.json({
          success: false,
          error: 'Financial goal not found or access denied',
          code: 'NOT_FOUND',
          requestId,
        }, { status: 404 });
      }
      
      if (error.message === 'CURRENT_EXCEEDS_TARGET') {
        return NextResponse.json({
          success: false,
          error: 'Current amount cannot exceed target amount',
          code: 'BUSINESS_RULE_VIOLATION',
          requestId,
        }, { status: 422 });
      }
      
      if (error.message === 'DUPLICATE_GOAL') {
        return NextResponse.json({
          success: false,
          error: 'A goal with this title already exists',
          code: 'DUPLICATE_GOAL',
          requestId,
        }, { status: 409 });
      }
    }

    await AuditLogger.logSecurityEvent('api', 'error', {
      level: 'error' as any,
      data: {
        endpoint: '/api/goals',
        method: 'PUT',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      }
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update financial goal',
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
    let body: { id: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON payload',
        code: 'INVALID_JSON',
        requestId,
      }, { status: 400 });
    }

    // Validate ID
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Goal ID is required',
        code: 'MISSING_ID',
        requestId,
      }, { status: 400 });
    }

    const { id } = body;

    // Check database availability
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        requestId,
      }, { status: 503 });
    }

    // Require authentication
    const user = await requireAuth();

    // Delete goal with ownership check
    const deletedGoal = await prisma.financialGoal.delete({
      where: { 
        id,
        userId: user.id,
      },
    });

    // Log successful deletion
    await AuditLogger.logDataAccessEvent('delete', user.id, 'goals', {
      recordsAffected: 1,
      success: true,
      metadata: {
        goalId: id,
        deletedTitle: deletedGoal.title,
        targetAmount: deletedGoal.targetAmount,
        requestId,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Financial goal deleted successfully',
        deletedGoal: {
          id: deletedGoal.id,
          title: deletedGoal.title,
        },
      },
      metadata: {
        source: 'database',
        requestId,
      },
    });

  } catch (error) {
    // Handle Prisma not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Financial goal not found or access denied',
        code: 'NOT_FOUND',
        requestId,
      }, { status: 404 });
    }

    await AuditLogger.logSecurityEvent('api', 'error', {
      level: 'error' as any,
      data: {
        endpoint: '/api/goals',
        method: 'DELETE',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      }
    });

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requestId,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete financial goal',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}