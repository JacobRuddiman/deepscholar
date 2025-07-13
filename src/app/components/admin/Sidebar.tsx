// app/components/admin/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Bot, 
  Settings, 
  Home,
  Database,
  BarChart3,
  TrendingUp,
  Sparkles,
  Mail,
  BookMarked
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Briefs', href: '/admin/briefs', icon: FileText },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { name: 'AI Reviews', href: '/admin/ai-reviews', icon: Bot },
  { name: 'Models', href: '/admin/models', icon: Database },
  { name: 'Data Synthesis', href: '/admin/seeding', icon: Sparkles },
  { name: 'Email Builder', href: '/admin/emailbuilder', icon: Mail },
  { name: 'Recommendation System', href: '/admin/recommendations', icon: BookMarked},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <Home className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Admin Panel</span>
        </Link>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors
                  ${isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <Link
          href="/"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Home className="mr-3 h-5 w-5 text-gray-400" />
          Back to Site
        </Link>
      </div>
    </div>
  );
}
