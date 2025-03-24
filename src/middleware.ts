import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/auth/login' || path === '/auth/signup' || path === '/';
  
  // Paths that require authentication
  const isProtectedPath = path.startsWith('/book/') || path === '/dashboard';
  
  // Get the authentication token from cookies
  const token = request.cookies.get('auth_token')?.value || '';
  
  // Get the intended destination after login (if any)
  const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '';
  
  // Redirect logic
  if (isPublicPath && path === '/auth/login' && token) {
    // If the user is logged in and tries to access login page
    // Check if there's a redirectTo parameter and redirect there, or to dashboard
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (!isPublicPath && isProtectedPath && !token) {
    // If the user is not logged in and tries to access a protected route like booking,
    // redirect them to the login page with the current path as redirectTo parameter
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  // Protect all routes except for public ones and static assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)'
  ],
}; 