// components/auth/SessionProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function ClientSessionProvider({ 
  children, 
  session = null // Make session optional with default value
}: { 
  children: React.ReactNode;
  session?: any;
}) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}