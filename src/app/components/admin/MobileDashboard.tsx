//MobileDashboard
'use client';

import React from 'react';
import { Users, FileText, MessageSquare, Bot, TrendingUp, Activity, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalBriefs: number;
  totalReviews: number;
  totalAIReviews: number;
  recentActivity: Array<{
    type: string;
    action: string;
    time: string;
  }>;
}

interface MobileDashboardProps {
  stats: AdminStats;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

export default function MobileDashboard({ stats }: MobileDashboardProps) {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Briefs',
      value: stats.totalBriefs,
      icon: FileText,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'User Reviews',
      value: stats.totalReviews,
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'AI Reviews',
      value: stats.totalAIReviews,
      icon: Bot,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-blue-100">Here&apos;s what&apos;s happening with DeepScholar today</p>
      </div>

      {/* Stats Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-2xl p-4 border border-white/50`}>
            <div className="flex items-center mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <a
            href="/admin/users"
            className="flex flex-col items-center p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Manage Users</span>
          </a>
          <a
            href="/admin/briefs"
            className="flex flex-col items-center p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Manage Briefs</span>
          </a>
          <a
            href="/admin/models"
            className="flex flex-col items-center p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-2">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Manage Models</span>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentActivity.slice(0, 5).map((activity, index) => (
            <div key={index} className="p-4 flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'user' ? 'bg-blue-100' :
                activity.type === 'brief' ? 'bg-green-100' :
                activity.type === 'review' ? 'bg-purple-100' :
                'bg-orange-100'
              }`}>
                {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                {activity.type === 'brief' && <FileText className="w-4 h-4 text-green-600" />}
                {activity.type === 'review' && <MessageSquare className="w-4 h-4 text-purple-600" />}
                {activity.type === 'ai-review' && <Bot className="w-4 h-4 text-orange-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{activity.action}</p>
                <p className="text-xs text-gray-500">{formatTimeAgo(activity.time)} ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
