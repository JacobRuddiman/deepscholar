// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = [
  '/',
  '/home',
  '/auth/signin',
  '/api/auth',
];

export default async function middleware(req: NextRequest) {
  try {
    console.log('\n=== MIDDLEWARE START ===');
    console.log('Request URL:', req.url);
    console.log('Request path:', req.nextUrl.pathname);

    const session = await auth();
    console.log('Session state:', {
      exists: !!session,
      hasUser: !!session?.user,
      user: session?.user,
    });

    const { pathname } = req.nextUrl;

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    console.log('Route check:', {
      path: pathname,
      isPublic: isPublicRoute,
      matchedPublicRoute: publicRoutes.find(route => pathname === route || pathname.startsWith(`${route}/`))
    });

    // If it's not a public route and user is not authenticated, redirect to sign in
    if (!isPublicRoute && !session?.user) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      console.log('Redirecting to sign in:', {
        from: pathname,
        to: signInUrl.toString(),
        reason: 'Non-public route without valid session'
      });
      console.log('=== MIDDLEWARE END (REDIRECTING) ===\n');
      return NextResponse.redirect(signInUrl);
    }

    console.log('Proceeding with request:', {
      path: pathname,
      allowed: true,
      reason: isPublicRoute ? 'Public route' : 'Authenticated user'
    });
    console.log('=== MIDDLEWARE END (PROCEEDING) ===\n');
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== MIDDLEWARE END (ERROR) ===\n');
    return NextResponse.next();
  }
}

// Update the matcher to be more specific
export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};