'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  MessageSquare, 
  Bot, 
  Database, 
  Sparkles, 
  Mail, 
  BookMarked,
  Home,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3, color: 'from-blue-500 to-blue-600', description: 'Overview & Stats' },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, color: 'from-green-500 to-green-600', description: 'Data Insights' },
  { name: 'Users', href: '/admin/users', icon: Users, color: 'from-purple-500 to-purple-600', description: 'User Management' },
  { name: 'Briefs', href: '/admin/briefs', icon: FileText, color: 'from-orange-500 to-orange-600', description: 'Content Library' },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, color: 'from-pink-500 to-pink-600', description: 'User Feedback' },
  { name: 'AI Reviews', href: '/admin/ai-reviews', icon: Bot, color: 'from-red-500 to-red-600', description: 'AI Analysis' },
  { name: 'Models', href: '/admin/models', icon: Database, color: 'from-indigo-500 to-indigo-600', description: 'AI Configuration' },
  { name: 'Data Synthesis', href: '/admin/seeding', icon: Sparkles, color: 'from-yellow-500 to-yellow-600', description: 'Data Generation' },
  { name: 'Email Builder', href: '/admin/emailbuilder', icon: Mail, color: 'from-cyan-500 to-cyan-600', description: 'Communication' },
  { name: 'Recommendations', href: '/admin/recommendations', icon: BookMarked, color: 'from-teal-500 to-teal-600', description: 'Smart Suggestions' },
];

export default function TabletAdminNavigation() {
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();

  const filteredNavigation = navigation.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">DeepScholar Admin</h1>
                <p className="text-xs text-gray-500">Management Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search admin sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Navigation Panel */}
      <div className="fixed top-20 left-0 bottom-0 w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="grid gap-3">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group relative overflow-hidden rounded-xl p-4 transition-all duration-200 border
                    ${isActive
                      ? 'bg-white shadow-lg border-gray-200 scale-105'
                      : 'bg-white/50 border-gray-100 hover:bg-white hover:shadow-md hover:scale-102'
                    }
                  `}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity ${
                    isActive ? 'opacity-10' : ''
                  }`} />
                  
                  <div className="relative flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.color} shadow-lg`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/"
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Back to Site</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
