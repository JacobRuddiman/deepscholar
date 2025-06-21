// app/layout.tsx
import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import NavTriangles from "./components/nav_triangles";
import ClientSessionProvider from "./auth/SessionProvider";
import ErrorBoundary from "./components/error_boundary";
import { TooltipProvider } from "./components/TooltipProvider";
import MobileNavigation from "./components/MobileNavigation";

export const metadata: Metadata = {
  title: "Deep Scholar",
  description: "Share and search a library of AI research briefs",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="min-h-screen relative">
        <div className="relative min-h-screen">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavTriangles />
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNavigation />
          </div>
          
          <ClientSessionProvider>
            <TooltipProvider>
              <ErrorBoundary>
                {/* Content with appropriate padding for mobile/desktop */}
                <main className="relative z-10 pt-16 md:pt-18 pb-20 md:pb-0">
                  {children}
                </main>
              </ErrorBoundary>
            </TooltipProvider>
          </ClientSessionProvider>
        </div>
      </body>
    </html>
  );
}