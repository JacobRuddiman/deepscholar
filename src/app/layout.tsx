import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import NavTriangles from "./components/nav_triangles";
import ClientSessionProvider from "./auth/SessionProvider";

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
          {/* NavTriangles is a client component */}
          <NavTriangles />
          
          {/* Use SessionProvider without server-side session */}
          <ClientSessionProvider>
            {/* Content with appropriate padding and z-index */}
            <main className="relative z-10">
              {children}
            </main>
          </ClientSessionProvider>
        </div>
      </body>
    </html>
  );
}