import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // If user is already authenticated and trying to access auth pages, redirect to home
    if (req.nextUrl.pathname.startsWith('/auth') && req.nextauth.token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
        const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth');
        const isHomePage = req.nextUrl.pathname === '/';
        
        // Allow API auth routes
        if (isApiAuth) {
          return true;
        }
        
        // Allow auth pages for unauthenticated users
        if (isAuthPage && !token) {
          return true;
        }
        
        // Redirect authenticated users away from auth pages (handled in middleware function)
        if (isAuthPage && token) {
          return true; // Let middleware handle the redirect
        }
        
        // Protect home page - require authentication
        if (isHomePage) {
          return !!token;
        }
        
        // Default to requiring authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/api/protected/:path*',
  ],
};