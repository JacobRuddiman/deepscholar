//admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ResponsiveAdminLayout from '@/app/components/admin/ResponsiveAdminLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Check if we're in local mode
    const localMode = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
    setIsLocalMode(localMode);

    // If not in local mode, check authentication
    if (!localMode && status === 'loading') {
      return; // Still loading
    }

    if (!localMode && status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // In production, you could add admin role check here
    // if (!localMode && session?.user && !session.user.isAdmin) {
    //   router.push('/');
    //   return;
    // }
  }, [status, session, router]);

  // In local mode, always render
  if (isLocalMode) {
    return (
      <ResponsiveAdminLayout>
        {children}
      </ResponsiveAdminLayout>
    );
  }

  // In production mode, check auth status
  if (status === 'loading') {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <ResponsiveAdminLayout>
      {children}
    </ResponsiveAdminLayout>
  );
}
