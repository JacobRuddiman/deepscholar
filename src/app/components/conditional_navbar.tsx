"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Check if we're on the home page
  const isHomePage = pathname === "/" || pathname === "/home";
  
  // If we're on the home page, don't render the navbar
  if (isHomePage) {
    return null;
  }
  
  return (
    <>
      {/* NavBar with Deep Scholar button */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-30 flex items-start">
        {/* Left triangle */}
        <div 
          className="h-12 w-8 bg-blue-600 shadow-lg"
          style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)", marginRight: "-1px" }}
        />
        
        {/* Center rectangle */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg px-6 py-3 h-12 flex items-center">
          <Link 
            href="/"
            className="text-white font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Deep Scholar
          </Link>
        </div>
        
        {/* Right triangle */}
        <div 
          className="h-12 w-8 bg-indigo-700 shadow-lg"
          style={{ clipPath: "polygon(0 0, 0 100%, 100% 0)", marginLeft: "-1px" }}
        />
      </div>
    </>
  );
}