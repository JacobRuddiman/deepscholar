'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default: 30 second stale time (individual hooks can override)
            staleTime: 30 * 1000,

            // Cache for 5 minutes after component unmounts
            gcTime: 5 * 60 * 1000,

            // Show stale data while fetching new data
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: true,

            // Retry failed requests once
            retry: 1,
            retryDelay: 1000,

            // Keep previous data while fetching (prevents layout shift)
            placeholderData: (previousData: unknown) => previousData,
          },
        },
      })
  );

  // Create persister only on client side
  const [persister, setPersister] = useState<ReturnType<typeof createSyncStoragePersister> | null>(null);

  useEffect(() => {
    // Only create persister in browser environment
    if (typeof window !== 'undefined') {
      setPersister(
        createSyncStoragePersister({
          storage: window.localStorage,
          key: 'deepscholar-cache',
        })
      );
    }
  }, []);

  // Use regular provider until persister is ready (SSR-safe)
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        dehydrateOptions: {
          // Don't persist mutations, only queries
          shouldDehydrateMutation: () => false,
        },
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </PersistQueryClientProvider>
  );
}
