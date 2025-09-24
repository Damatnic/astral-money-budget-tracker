import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // If user is accessing auth pages and already logged in, redirect to home
        if ((req.nextUrl.pathname.startsWith('/auth/signin') || 
             req.nextUrl.pathname.startsWith('/auth/signup')) && token) {
          return false;
        }
        
        // Protect main dashboard - require authentication
        if (req.nextUrl.pathname === '/' && !token) {
          return false;
        }
        
        // Allow access to auth pages and API routes
        if (req.nextUrl.pathname.startsWith('/auth') || 
            req.nextUrl.pathname.startsWith('/api/auth')) {
          return true;
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