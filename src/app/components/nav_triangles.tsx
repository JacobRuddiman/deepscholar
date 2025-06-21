// app/components/nav_triangles.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  BiUpload, 
  BiFile, 
  BiUser,
  BiCog
} from "react-icons/bi";
import { FiUsers } from "react-icons/fi";
import { RiCoinLine } from "react-icons/ri";
import ConditionalNavbar from "./conditional_navbar";
import { getUserTokenBalance } from "@/server/actions/tokens";

// Define clip paths as inline styles to ensure they're applied immediately
const clipStyles = {
  leftTriangle: {
    clipPath: "polygon(0 0, 100% 0, 0 100%)"
  },
  rightTriangle: {
    clipPath: "polygon(100% 0, 100% 100%, 0 0)"
  }
};

export default function NavTriangles() {
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    const loadTokenBalance = async () => {
      try {
        const result = await getUserTokenBalance();
        if (result.success) {
          setTokens(result.balance);
        }
      } catch (error) {
        console.error('Failed to load token balance:', error);
      }
    };

    void loadTokenBalance();
  }, []);
  
  return (
    <>
      {/* Include the ConditionalNavbar component */}
      <ConditionalNavbar />
      
      {/* Left Triangle Nav - Using inline styles for immediate application */}
      <div className="fixed top-0 left-0 w-64 h-48 z-20" style={clipStyles.leftTriangle}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
          <nav className="absolute top-4 left-4 flex flex-col space-y-6">
            <div className="flex space-x-4">
                <Link 
                  href="/brief_upload"
                  className="nav-item"
                  aria-label="Upload"
                >
                  <div className="nav-icon left-icon">
                    <BiUpload className="icon-size" />
                  </div>
                  <span className="tooltip left-tooltip">Upload</span>
                </Link>
                
                <Link 
                  href="/my-briefs"
                  className="nav-item"
                  aria-label="My Briefs"
                >
                  <div className="nav-icon left-icon">
                    <BiFile className="icon-size" />
                  </div>
                  <span className="tooltip left-tooltip">My Briefs</span>
                </Link>
            </div>
            <Link 
              href="/users"
              className="nav-item"
              aria-label="Users"
            >
              <div className="nav-icon left-icon">
                <FiUsers className="icon-size" />
              </div>
              <span className="tooltip left-tooltip">Users</span>
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Right Triangle Nav - Using inline styles for immediate application */}
      <div className="fixed top-0 right-0 w-64 h-48 z-20" style={clipStyles.rightTriangle}>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-700 to-blue-600 shadow-lg">
          <nav className="absolute top-4 right-4 flex flex-col space-y-6">
            <div className="flex space-x-4">
                <Link 
                  href="/profile"
                  className="nav-item"
                  aria-label="Profile"
                >
                  <div className="nav-icon right-icon">
                    <BiUser className="icon-size" />
                  </div>
                  <span className="tooltip right-tooltip">Profile</span>
                </Link>
                
                {/* Tokens */}
                <Link 
                  href="/tokens"
                  className="nav-item"
                  aria-label="Tokens"
                >
                <div className="nav-item">
                  <div className="nav-icon right-icon">
                    <RiCoinLine className="icon-size"/>
                  </div>
                  <span className="tooltip right-tooltip">{tokens} ₮</span>
                </div>
                </Link>
            </div>
            
            {/* Settings */}
            <Link 
              href="/settings"
              className="nav-item"
              aria-label="Settings"
            >
              <div className="nav-icon right-icon">
                <BiCog className="icon-size" />
              </div>
              <span className="tooltip right-tooltip">Settings</span>
            </Link>
          </nav>
        </div>
      </div>
      
      {/* CSS Styles - Now consistent and centralized */}
      <style jsx global>{`
        /* Common navigation item styles */
        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        /* Icon styling */
        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          transition: transform 0.2s;
        }
        
        .nav-icon:hover {
          transform: scale(1.1);
        }
        
        /* Left side specific icon styling */
        .left-icon {
           background-color: rgba(255, 255, 255, 0.2);
          border-radius: 9999px; /* Full roundead */
          color: white;
        }
        
        /* Right side specific icon styling */
        .right-icon {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 9999px; /* Full rounded */
          color: white;
        }
        
        .right-icon:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        /* Icon sizing */
        .icon-size {
          width: 24px;
          height: 24px;
        }
        
        /* Tooltip styling */
        .tooltip {
          visibility: hidden;
          position: absolute;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          text-align: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 100;
        }
        
        .right-tooltip {
          top: calc(100% + 5px);
          right: 0;
        }
        
        .left-tooltip {
          top: calc(100% + 5px);
          left: 0;
        }
        
        .nav-item:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </>
  );
}