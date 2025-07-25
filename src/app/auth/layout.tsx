// app/auth/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

const geistFont = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sign In | DeepScholar",
  description: "Sign in or create an account on DeepScholar",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // If already signed in, redirect to dashboard
  if (session?.user) {
    redirect("/home");
  }
  
  return (
    <div className={`${geistFont.className} min-h-screen bg-gradient-to-b from-gray-50 to-gray-100`}>
      {children}
    </div>
  );
}
