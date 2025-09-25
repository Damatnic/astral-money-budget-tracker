/**
 * Financial Goals Individual Goal API Route
 * Operations for specific goal by ID with comprehensive validation and security
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { ValidationEngine } from '@/lib/validation';
import { AuditLogger } from '@/utils/security';
import type { UpdateFinancialGoalRequest } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// Validation schema for goal updates
const updateGoalSchema = {
  title: {
    type: 'string' as const,
    required: false,
    minLength: 1,
    maxLength: 200,
    sanitize: true
  },
  targetAmount: {
    type: 'number' as const,
    required: false,
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
    required: false,
    enum: ['emergency', 'savings', 'debt', 'investment', 'purchase'],
    sanitize: true
  },
  isCompleted: {
    type: 'boolean' as const,
    required: false
  }
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const { id } = params;
  
  try {
    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Valid goal ID is required',
        code: 'INVALID_ID',
        requestId,
      }, { status: 400 });
    }

    // Check database availability
    if (!process.env.DATABASE_URL) {
      await AuditLogger.logSecurityEvent('system', 'database_unavailable', {
        level: 'error' as any,
        data: {
          endpoint: `/api/goals/${id}`,
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

    // Execute query with performance monitoring
    const queryStart = Date.now();
    const goal = await prisma.financialGoal.findUnique({
      where: { 
        id,
        userId: user.id,
      },
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
    });
    const queryTime = Date.now() - queryStart;

    if (!goal) {
      return NextResponse.json({
        success: false,
        error: 'Financial goal not found or access denied',
        code: 'NOT_FOUND',
        requestId,
      }, { status: 404 });
    }

    // Calculate progress and additional metrics
    const goalWithMetrics = {
      ...goal,
      progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
      daysUntilDeadline: goal.deadline ? Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      isOverdue: goal.deadline ? new Date() > goal.deadline && !goal.isCompleted : false,
    };

    // Log data access
    await AuditLogger.logDataAccessEvent('read', user.id, 'goals', {
      recordsAffected: 1,
      success: true,
      metadata: { 
        goalId: id,
        queryTime,
        requestId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        goal: goalWithMetrics,
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
        endpoint: `/api/goals/${id}`,
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
        error: 'Failed to fetch financial goal',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const { id } = params;
  
  try {
    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Valid goal ID is required',
        code: 'INVALID_ID',
        requestId,
      }, { status: 400 });
    }

    // Parse and validate request body
    let body: Partial<UpdateFinancialGoalRequest>;
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

    // Validate request body
    const validationResult = await ValidationEngine.validateRequest(
      body,
      updateGoalSchema,
      { strictMode: true, sanitize: true }
    );

    if (!validationResult.isValid) {
      await AuditLogger.logSecurityEvent('validation', 'failed', {
        level: 'warn' as any,
        data: {
          endpoint: `/api/goals/${id}`,
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

    const { title, targetAmount, currentAmount, deadline, category, isCompleted } = validationResult.sanitizedData;

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
      const changedFields: string[] = [];
      
      if (title !== undefined && title.trim() !== existingGoal.title) {
        updateData.title = title.trim();
        changedFields.push('title');
      }
      if (targetAmount !== undefined && targetAmount !== existingGoal.targetAmount) {
        updateData.targetAmount = targetAmount;
        changedFields.push('targetAmount');
      }
      if (currentAmount !== undefined && currentAmount !== existingGoal.currentAmount) {
        updateData.currentAmount = currentAmount;
        changedFields.push('currentAmount');
      }
      if (deadline !== undefined) {
        const newDeadline = deadline ? new Date(deadline) : null;
        if (newDeadline?.getTime() !== existingGoal.deadline?.getTime()) {
          updateData.deadline = newDeadline;
          changedFields.push('deadline');
        }
      }
      if (category !== undefined && category !== existingGoal.category) {
        updateData.category = category;
        changedFields.push('category');
      }
      if (isCompleted !== undefined && isCompleted !== existingGoal.isCompleted) {
        updateData.isCompleted = isCompleted;
        changedFields.push('isCompleted');
      }

      // If no changes, return existing goal
      if (changedFields.length === 0) {
        return existingGoal;
      }

      // Calculate final amounts for validation
      const newCurrentAmount = currentAmount !== undefined ? currentAmount : existingGoal.currentAmount;
      const newTargetAmount = targetAmount !== undefined ? targetAmount : existingGoal.targetAmount;

      // Auto-complete goal if current amount meets or exceeds target
      if (newCurrentAmount >= newTargetAmount && !existingGoal.isCompleted && isCompleted === undefined) {
        updateData.isCompleted = true;
        changedFields.push('isCompleted (auto)');
      }

      // Business logic validation
      if (newCurrentAmount > newTargetAmount && isCompleted !== true && newCurrentAmount >= newTargetAmount) {
        // Allow if marking as completed, otherwise validate
        if (!(currentAmount !== undefined && isCompleted === true)) {
          throw new Error('CURRENT_EXCEEDS_TARGET');
        }
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

      return { ...updatedGoal, changedFields };
    });

    // Log successful update
    await AuditLogger.logDataAccessEvent('write', user.id, 'goals', {
      recordsAffected: 1,
      success: true,
      metadata: {
        goalId: id,
        updatedFields: (result as any).changedFields || [],
        requestId,
      }
    });

    // Calculate metrics
    const goalWithMetrics = {
      id: result.id,
      title: result.title,
      targetAmount: result.targetAmount,
      currentAmount: result.currentAmount,
      deadline: result.deadline,
      category: result.category,
      isCompleted: result.isCompleted,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      progress: result.targetAmount > 0 ? (result.currentAmount / result.targetAmount) * 100 : 0,
      remainingAmount: Math.max(0, result.targetAmount - result.currentAmount),
      daysUntilDeadline: result.deadline ? Math.ceil((result.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      isOverdue: result.deadline ? new Date() > result.deadline && !result.isCompleted : false,
    };

    return NextResponse.json({
      success: true,
      data: {
        goal: goalWithMetrics,
        changes: (result as any).changedFields || [],
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
          error: 'Current amount cannot exceed target amount unless goal is marked complete',
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
        endpoint: `/api/goals/${id}`,
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const { id } = params;
  
  try {
    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Valid goal ID is required',
        code: 'INVALID_ID',
        requestId,
      }, { status: 400 });
    }

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
        currentAmount: deletedGoal.currentAmount,
        category: deletedGoal.category,
        wasCompleted: deletedGoal.isCompleted,
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
          targetAmount: deletedGoal.targetAmount,
          currentAmount: deletedGoal.currentAmount,
          category: deletedGoal.category,
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
        endpoint: `/api/goals/${id}`,
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