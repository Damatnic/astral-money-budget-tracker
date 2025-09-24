/**
 * User Registration API Route
 * Handles new user account creation with secure password hashing
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { InputSanitizer } from '@/utils/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate and sanitize inputs
    const emailValidation = InputSanitizer.sanitizeString(body.email, {
      required: true,
      maxLength: 255,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });

    const nameValidation = InputSanitizer.sanitizeString(body.name, {
      required: true,
      maxLength: 100
    });

    const passwordValidation = InputSanitizer.sanitizeString(body.password, {
      required: true,
      maxLength: 128,
      stripXss: false // Don't strip from passwords
    });

    // Check for validation errors
    const errors = [
      ...emailValidation.errors,
      ...nameValidation.errors,
      ...passwordValidation.errors
    ];

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid input', details: errors },
        { status: 400 }
      );
    }

    const email = emailValidation.sanitizedValue!.toLowerCase();
    const name = nameValidation.sanitizedValue!;
    const password = passwordValidation.sanitizedValue!;

    // Validate password strength
    const passwordStrength = require('@/utils/security').SecurityUtils.validatePasswordStrength(password);
    if (passwordStrength.score < 60) {
      return NextResponse.json(
        { 
          error: 'Password too weak', 
          feedback: passwordStrength.feedback,
          score: passwordStrength.score 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: null, // Will be set when email is verified
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}