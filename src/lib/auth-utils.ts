/**
 * Authentication utilities for API routes
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { prisma } from './prisma';

export async function getUserFromSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    return user;
  } catch (error) {
    console.error('Failed to get user from session:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getUserFromSession();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}