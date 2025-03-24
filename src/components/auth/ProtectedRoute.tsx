'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login with current path as redirectTo
      if (!isAuthenticated) {
        const redirectPath = pathname ? encodeURIComponent(pathname) : '';
        router.push(`/auth/login?redirectTo=${redirectPath}`);
      } 
      // If adminOnly and user is not admin, redirect to home
      else if (adminOnly && user?.role !== 'admin') {
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, router, adminOnly, user, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render children if adminOnly and user is not admin
  if (adminOnly && user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
} 