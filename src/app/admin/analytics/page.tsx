// File: app/admin/analytics/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, Treemap
} from 'recharts';
import {
  TrendingUp, Users, Coins, Star, Tag, AlertCircle, Loader2,
  Filter, Download, RefreshCw, Calendar, ChevronDown, ChevronUp,
  Activity, DollarSign, BookOpen, MessageSquare, Hash
} from 'lucide-react';
import { getAdminAnalytics } from '@/server/actions/analytics';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';

// Color palette for charts
const COLORS = {
  primary: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'],
  secondary: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
  success: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
  warning: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'],
  danger: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'],
  mixed: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
};

// Types for analytics data
interface AnalyticsData {
  userEngagement: any;
  contentPerformance: any;
  tokenEconomics: any;
  reviewAnalytics: any;
  categoryTrends: any;
  metadata: {
    period: { value: number; unit: string };
    generatedAt: string;
    dataPoints: string[];
  };
}

interface ChartFilter {
  type: string;
  value: string | number;
}

export default function AnalyticsPage() {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Time period controls
  const [periodValue, setPeriodValue] = useState(7);
  const [periodUnit, setPeriodUnit] = useState<'hours' | 'days' | 'weeks' | 'months' | 'years'>('days');
  const [periodError, setPeriodError] = useState<string | null>(null);
  
  // Chart filters
  const [chartFilters, setChartFilters] = useState<Record<string, ChartFilter>>({});
  const [expandedCharts, setExpandedCharts] = useState<Set<string>>(new Set());
  
  // Additional filters
  const [globalFilters, setGlobalFilters] = useState({
    categories: [] as string[],
    minRating: 0,
    excludeUsers: [] as string[],
    onlyPublished: true,
  });

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      setPeriodError(null);
      
      // Validate period
      if (periodValue <= 0) {
        setPeriodError('Period must be greater than 0');
        return;
      }
      
      if (periodValue > 365 && periodUnit === 'days') {
        setPeriodError('Maximum 365 days allowed');
        return;
      }
      
      if (periodValue > 12 && periodUnit === 'months') {
        setPeriodError('Maximum 12 months allowed');
        return;
      }
      
      if (periodValue > 5 && periodUnit === 'years') {
        setPeriodError('Maximum 5 years allowed');
        return;
      }
      
      const result = await getAdminAnalytics({
        period: {
          value: periodValue,
          unit: periodUnit,
        },
        filters: globalFilters,
      });
      
      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch analytics data');
        console.error('Analytics error:', result);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('An unexpected error occurred while fetching analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periodValue, periodUnit, globalFilters]);

  // Initial load
  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    void fetchAnalytics();
  };

  // Toggle chart expansion
  const toggleChartExpansion = (chartId: string) => {
    const newExpanded = new Set(expandedCharts);
    if (newExpanded.has(chartId)) {
      newExpanded.delete(chartId);
    } else {
      newExpanded.add(chartId);
    }
    setExpandedCharts(newExpanded);
  };

  // Apply chart-specific filter
  const applyChartFilter = (chartId: string, filter: ChartFilter) => {
    setChartFilters(prev => ({
      ...prev,
      [chartId]: filter,
    }));
  };

  // Export data handler
  const handleExportData = (chartId: string, chartData: any) => {
    try {
      const dataStr = JSON.stringify(chartData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${chartId}_analytics_${new Date().toISOString()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights and data visualization</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights and data visualization</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Error Loading Analytics</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights and data visualization</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="secondary"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Time Period Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Time Period
          </h3>
          {data && (
            <span className="text-sm text-gray-500">
              Last updated: {new Date(data.metadata.generatedAt).toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Period Value
    </label>
    <Input
      type="number"
      min="1"
      value={periodValue}
      onChange={(e) => {
        const value = parseInt(e.target.value) || 1;
        setPeriodValue(value);
        if (value > 0 && 
            !(value > 365 && periodUnit === 'days') && 
            !(value > 12 && periodUnit === 'months') && 
            !(value > 5 && periodUnit === 'years')) {
          setRefreshing(true);
          fetchAnalytics();
        }
      }}
      className={periodError ? 'border-red-500' : ''}
    />
    {periodError && (
      <p className="text-red-500 text-sm mt-1">{periodError}</p>
    )}
  </div>
  
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Period Unit
    </label>
    <Select
      value={periodUnit}
      onChange={(e) => {
        const unit = e.target.value as any;
        setPeriodUnit(unit);
        if (!(periodValue > 365 && unit === 'days') && 
            !(periodValue > 12 && unit === 'months') && 
            !(periodValue > 5 && unit === 'years')) {
          setRefreshing(true);
          fetchAnalytics();
        }
      }}
      options={[
        { value: 'hours', label: 'Hours' },
        { value: 'days', label: 'Days' },
        { value: 'weeks', label: 'Weeks' },
        { value: 'months', label: 'Months' },
        { value: 'years', label: 'Years' },
      ]}
    />
  </div>
</div>
      </div>

      {/* Error message for partial failures */}
      {error && data && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="ml-2 text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {data && (
        <div className="space-y-6">
          {/* 1. User Engagement Analytics */}
          <UserEngagementChart
            data={data.userEngagement}
            expanded={expandedCharts.has('user-engagement')}
            onToggleExpand={() => toggleChartExpansion('user-engagement')}
            filter={chartFilters['user-engagement']}
            onFilterChange={(filter) => applyChartFilter('user-engagement', filter)}
            onExport={(chartData) => handleExportData('user-engagement', chartData)}
          />

          {/* 2. Content Performance Analytics */}
          <ContentPerformanceChart
            data={data.contentPerformance}
            expanded={expandedCharts.has('content-performance')}
            onToggleExpand={() => toggleChartExpansion('content-performance')}
            filter={chartFilters['content-performance']}
            onFilterChange={(filter) => applyChartFilter('content-performance', filter)}
            onExport={(chartData) => handleExportData('content-performance', chartData)}
          />

          {/* 3. Token Economics Analytics */}
          <TokenEconomicsChart
            data={data.tokenEconomics}
            expanded={expandedCharts.has('token-economics')}
            onToggleExpand={() => toggleChartExpansion('token-economics')}
            filter={chartFilters['token-economics']}
            onFilterChange={(filter) => applyChartFilter('token-economics', filter)}
            onExport={(chartData) => handleExportData('token-economics', chartData)}
          />

          {/* 4. Review Analytics */}
          <ReviewAnalyticsChart
            data={data.reviewAnalytics}
            expanded={expandedCharts.has('review-analytics')}
            onToggleExpand={() => toggleChartExpansion('review-analytics')}
            filter={chartFilters['review-analytics']}
            onFilterChange={(filter) => applyChartFilter('review-analytics', filter)}
            onExport={(chartData) => handleExportData('review-analytics', chartData)}
          />

          {/* 5. Category Trends Analytics */}
          <CategoryTrendsChart
            data={data.categoryTrends}
            expanded={expandedCharts.has('category-trends')}
            onToggleExpand={() => toggleChartExpansion('category-trends')}
            filter={chartFilters['category-trends']}
            onFilterChange={(filter) => applyChartFilter('category-trends', filter)}
            onExport={(chartData) => handleExportData('category-trends', chartData)}
          />
        </div>
      )}
    </div>
  );
}

// Component 1: User Engagement Chart
function UserEngagementChart({ 
  data, 
  expanded, 
  onToggleExpand, 
  filter, 
  onFilterChange,
  onExport 
}: {
  data: any;
  expanded: boolean;
  onToggleExpand: () => void;
  filter?: ChartFilter;
  onFilterChange: (filter: ChartFilter) => void;
  onExport: (data: any) => void;
}) {
  const [viewType, setViewType] = useState<'registrations' | 'interactions' | 'retention' | 'active'>('registrations');
  
  // Handle missing data
  if (!data || data.error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            User Engagement Analytics
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            {data?.error || 'Failed to load user engagement data'}
          </p>
        </div>
      </div>
    );
  }
  
  // Process data based on view type
  const getChartData = () => {
    switch (viewType) {
      case 'registrations':
        return data.newUserRegistrations || [];
      case 'interactions':
        return data.userInteractions || [];
      case 'retention':
        return data.retentionCohorts || [];
      case 'active':
        return data.dailyActiveUsers || [];
      default:
        return [];
    }
  };
  
  const chartData = getChartData();
  const chartHeight = expanded ? 500 : 300;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          User Engagement Analytics
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExport(data)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={viewType === 'registrations' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('registrations')}
        >
          New Users
        </Button>
        <Button
          variant={viewType === 'interactions' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('interactions')}
        >
          Interactions
        </Button>
        <Button
          variant={viewType === 'retention' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('retention')}
        >
          Retention
        </Button>
        <Button
          variant={viewType === 'active' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('active')}
        >
          Active Users
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Total New Users</p>
          <p className="text-2xl font-bold text-blue-900">
            {data.newUserRegistrations?.length || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Active Users</p>
          <p className="text-2xl font-bold text-green-900">
            {data.dailyActiveUsers?.length || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Total Views</p>
          <p className="text-2xl font-bold text-purple-900">
            {data.briefViews?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-600">Avg Retention</p>
          <p className="text-2xl font-bold text-yellow-900">
            {data.retentionCohorts?.length > 0
              ? `${(data.retentionCohorts.reduce((sum: number, c: any) => sum + c.retentionRate, 0) / data.retentionCohorts.length).toFixed(1)}%`
              : 'N/A'}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      {viewType === 'retention' ? (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="cohort" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
            />
            <Legend />
            <Bar dataKey="retentionRate" fill={COLORS.primary[0]} name="Retention Rate (%)" />
            <Bar dataKey="totalUsers" fill={COLORS.secondary[0]} name="Total Users" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.primary[0]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey={viewType === 'active' ? 'date' : 'date'} 
              stroke="#6B7280" 
              fontSize={12}
              tickFormatter={(value) => {
                if (!value || value === 'unknown') return '';
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              labelFormatter={(value) => {
                if (!value || value === 'unknown') return '';
                return new Date(value).toLocaleDateString();
              }}
            />
            <Area
              type="monotone"
              dataKey={viewType === 'active' ? 'activeUsers' : 'count'}
              stroke={COLORS.primary[0]}
              fillOpacity={1}
              fill="url(#colorUser)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Component 2: Content Performance Chart
function ContentPerformanceChart({ 
  data, 
  expanded, 
  onToggleExpand, 
  filter, 
  onFilterChange,
  onExport 
}: {
  data: any;
  expanded: boolean;
  onToggleExpand: () => void;
  filter?: ChartFilter;
  onFilterChange: (filter: ChartFilter) => void;
  onExport: (data: any) => void;
}) {
  const [viewType, setViewType] = useState<'velocity' | 'engagement' | 'ratings' | 'top'>('velocity');
  
  // Handle missing data
  if (!data || data.error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-green-600" />
            Content Performance Analytics
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            {data?.error || 'Failed to load content performance data'}
          </p>
        </div>
      </div>
    );
  }
  
  const chartHeight = expanded ? 500 : 300;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-green-600" />
          Content Performance Analytics
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExport(data)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={viewType === 'velocity' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('velocity')}
        >
          Creation Velocity
        </Button>
        <Button
          variant={viewType === 'engagement' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('engagement')}
        >
          Engagement Rate
        </Button>
        <Button
          variant={viewType === 'ratings' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('ratings')}
        >
          Ratings
        </Button>
        <Button
          variant={viewType === 'top' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('top')}
        >
          Top Content
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Total Briefs</p>
          <p className="text-2xl font-bold text-green-900">{data.totalBriefs || 0}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Total Views</p>
          <p className="text-2xl font-bold text-blue-900">
            {(data.totalViews || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Total Upvotes</p>
          <p className="text-2xl font-bold text-purple-900">
            {(data.totalUpvotes || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-600">Avg Engagement</p>
          <p className="text-2xl font-bold text-yellow-900">
            {data.totalViews > 0 
              ? `${((data.totalUpvotes / data.totalViews) * 100).toFixed(2)}%`
              : 'N/A'}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      {viewType === 'velocity' && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data.briefCreationVelocity || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="day" 
              stroke="#6B7280" 
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke={COLORS.success[0]} 
              strokeWidth={2}
              dot={{ fill: COLORS.success[0], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {viewType === 'engagement' && (
  data.engagementRateByDay && data.engagementRateByDay.length > 0 ? (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data.engagementRateByDay || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="day" 
          stroke="#6B7280" 
          fontSize={12}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis stroke="#6B7280" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
          labelStyle={{ color: '#111827', fontWeight: 600 }}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="views" 
          stroke={COLORS.primary[0]} 
          strokeWidth={2}
          name="Views"
        />
        <Line 
          type="monotone" 
          dataKey="upvotes" 
          stroke={COLORS.secondary[0]} 
          strokeWidth={2}
          name="Upvotes"
        />
        <Line 
          type="monotone" 
          dataKey="engagementRate" 
          stroke={COLORS.warning[0]} 
          strokeWidth={2}
          name="Engagement Rate (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
      <Activity className="h-12 w-12 text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg">Not enough engagement data available</p>
      <p className="text-gray-400 text-sm mt-2">Try expanding the time period or wait for more user activity</p>
    </div>
  )
)}
      
      {viewType === 'ratings' && (
  data.averageRatingsByDay && data.averageRatingsByDay.length > 0 ? (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data.averageRatingsByDay || []}>
        <defs>
          <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.warning[0]} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={COLORS.warning[0]} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="day" 
          stroke="#6B7280" 
          fontSize={12}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis stroke="#6B7280" fontSize={12} domain={[0, 5]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
          labelStyle={{ color: '#111827', fontWeight: 600 }}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <Area
          type="monotone"
          dataKey="averageRating"
          stroke={COLORS.warning[0]}
          fillOpacity={1}
          fill="url(#colorRating)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
      <Star className="h-12 w-12 text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg">Not enough rating data available</p>
      <p className="text-gray-400 text-sm mt-2">Try expanding the time period or wait for more reviews</p>
    </div>
  )
)}
      
      {viewType === 'top' && (
        <div className="space-y-3">
          {(data.topPerformingBriefs || []).map((brief: any, index: number) => (
            <div key={brief.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-xs">{brief.title}</p>
                  <p className="text-sm text-gray-500">
                    {brief.viewCount.toLocaleString()} views • {brief.upvoteCount} upvotes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  {brief.engagementRate.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">engagement</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component 3: Token Economics Chart
function TokenEconomicsChart({ 
  data, 
  expanded, 
  onToggleExpand, 
  filter, 
  onFilterChange,
  onExport 
}: {
  data: any;
  expanded: boolean;
  onToggleExpand: () => void;
  filter?: ChartFilter;
  onFilterChange: (filter: ChartFilter) => void;
  onExport: (data: any) => void;
}) {
  const [viewType, setViewType] = useState<'purchases' | 'usage' | 'distribution' | 'projection'>('purchases');
  
  // Handle missing data
  if (!data || data.error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Coins className="h-5 w-5 mr-2 text-yellow-600" />
            Token Economics Analytics
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            {data?.error || 'Failed to load token economics data'}
          </p>
        </div>
      </div>
    );
  }
  
  const chartHeight = expanded ? 500 : 300;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Coins className="h-5 w-5 mr-2 text-yellow-600" />
          Token Economics Analytics
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExport(data)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={viewType === 'purchases' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('purchases')}
        >
          Purchases
        </Button>
        <Button
          variant={viewType === 'usage' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('usage')}
        >
          Usage
        </Button>
        <Button
          variant={viewType === 'distribution' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('distribution')}
        >
          Distribution
        </Button>
        <Button
          variant={viewType === 'projection' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('projection')}
        >
          Projections
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-600">Total Revenue</p>
          <p className="text-2xl font-bold text-yellow-900">
            ${(data.totalRevenue || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Tokens Purchased</p>
          <p className="text-2xl font-bold text-green-900">
            {(data.totalTokensPurchased || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Tokens Used</p>
          <p className="text-2xl font-bold text-blue-900">
            {(data.totalTokensUsed || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">30-Day Projection</p>
          <p className="text-2xl font-bold text-purple-900">
            ${(data.revenueProjection?.next30Days || 0).toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      {viewType === 'purchases' && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data.tokenPurchasesByDay || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="day" 
              stroke="#6B7280" 
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Bar dataKey="revenue" fill={COLORS.warning[0]} name="Revenue ($)" />
            <Bar dataKey="tokensAmount" fill={COLORS.primary[0]} name="Tokens" />
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {viewType === 'usage' && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data.tokenUsageByDay || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="day" 
              stroke="#6B7280" 
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Line 
              type="monotone" 
              dataKey="totalUsage" 
              stroke={COLORS.danger[0]} 
              strokeWidth={2}
              dot={{ fill: COLORS.danger[0], r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {viewType === 'distribution' && (
  <ResponsiveContainer width="100%" height={chartHeight}>
    <PieChart>
      <Pie
        data={Object.entries(data.tokenBalanceDistribution || {}).map(([key, value]) => ({
          name: key,
          value: value as number,
        }))}
        cx="50%"
        cy="50%"
        labelLine={true}
        outerRadius={expanded ? 150 : 100}
        fill="#8884d8"
        dataKey="value"
        label={({ name, percent }) => {
          // Only show label if percent is at least 5%
          return percent >= 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : '';
        }}
      >
        {Object.keys(data.tokenBalanceDistribution || {}).map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS.mixed[index % COLORS.mixed.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value, name) => [`${value} users`, name]} />
      <Legend layout="vertical" align="right" verticalAlign="middle" />
    </PieChart>
  </ResponsiveContainer>
)}
      
      {viewType === 'projection' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-green-900 mb-4">Revenue Projections</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-green-600">Next 30 Days</p>
                <p className="text-2xl font-bold text-green-900">
                  ${(data.revenueProjection?.next30Days || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600">Next 90 Days</p>
                <p className="text-2xl font-bold text-green-900">
                  ${(data.revenueProjection?.next90Days || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-600">Next 365 Days</p>
                <p className="text-2xl font-bold text-green-900">
                  ${(data.revenueProjection?.next365Days || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Transaction Categories</h5>
            {(data.transactionCategories || []).map((category: any) => (
              <div key={category.reason} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                <span className="text-sm text-gray-600">{category.reason}</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900">
                    {Math.abs(category.totalAmount).toLocaleString()} tokens
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({category.transactionCount} transactions)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Component 4: Review Analytics Chart
function ReviewAnalyticsChart({ 
  data, 
  expanded, 
  onToggleExpand, 
  filter, 
  onFilterChange,
  onExport 
}: {
  data: any;
  expanded: boolean;
  onToggleExpand: () => void;
  filter?: ChartFilter;
  onFilterChange: (filter: ChartFilter) => void;
  onExport: (data: any) => void;
}) {
  const [viewType, setViewType] = useState<'distribution' | 'trends' | 'comparison' | 'helpfulness'>('distribution');
  
  // Handle missing data
  if (!data || data.error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
            Review Analytics
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            {data?.error || 'Failed to load review analytics data'}
          </p>
        </div>
      </div>
    );
  }
  
  const chartHeight = expanded ? 500 : 300;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
          Review Analytics
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExport(data)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={viewType === 'distribution' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('distribution')}
        >
          Rating Distribution
        </Button>
        <Button
          variant={viewType === 'trends' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('trends')}
        >
          Review Trends
        </Button>
        <Button
          variant={viewType === 'comparison' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('comparison')}
        >
          User vs AI
        </Button>
        <Button
          variant={viewType === 'helpfulness' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('helpfulness')}
        >
          Helpfulness
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">User Reviews</p>
          <p className="text-2xl font-bold text-purple-900">
            {data.comparison?.userReviewCount || 0}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">AI Reviews</p>
          <p className="text-2xl font-bold text-blue-900">
            {data.comparison?.aiReviewCount || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">User Avg Rating</p>
          <p className="text-2xl font-bold text-green-900">
            {(data.comparison?.userAverageRating || 0).toFixed(1)}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-600">AI Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-900">
            {(data.comparison?.aiAverageRating || 0).toFixed(1)}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      {viewType === 'distribution' && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={[1, 2, 3, 4, 5].map(rating => ({
              rating: `${rating} Star`,
              userReviews: data.userRatingDistribution?.[rating - 1] || 0,
              aiReviews: data.aiRatingDistribution?.[rating - 1] || 0,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="rating" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
            />
            <Legend />
            <Bar dataKey="userReviews" fill={COLORS.primary[0]} name="User Reviews" />
            <Bar dataKey="aiReviews" fill={COLORS.secondary[0]} name="AI Reviews" />
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {viewType === 'trends' && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data.reviewTrends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="day" 
              stroke="#6B7280" 
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="userReviewCount" 
              stroke={COLORS.primary[0]} 
              strokeWidth={2}
              name="User Reviews"
            />
            <Line 
              type="monotone" 
              dataKey="aiReviewCount" 
              stroke={COLORS.secondary[0]} 
              strokeWidth={2}
              name="AI Reviews"
            />
            <Line 
              type="monotone" 
              dataKey="userAverageRating" 
              stroke={COLORS.success[0]} 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="User Avg Rating"
            />
            <Line 
              type="monotone" 
              dataKey="aiAverageRating" 
              stroke={COLORS.warning[0]} 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="AI Avg Rating"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {viewType === 'comparison' && (
  <div className="space-y-6">
    <div className="flex justify-center items-center space-x-12">
      <div className="text-center">
        <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center mb-3 mx-auto">
          <Users className="h-12 w-12 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-700">{data.comparison?.userReviewCount || 0}</p>
        <p className="text-lg text-gray-600">User Reviews</p>
        <p className="text-2xl font-semibold text-blue-600 mt-2">
          {(data.comparison?.userAverageRating || 0).toFixed(1)}
          <span className="text-sm text-gray-500 ml-1">/ 5</span>
        </p>
        <p className="text-sm text-gray-500">Average Rating</p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="text-2xl font-light text-gray-400 mb-4">vs</div>
        <div className={`px-4 py-2 rounded-lg ${
          data.comparison?.ratingDifference > 0 ? 'bg-green-100 text-green-700' :
          data.comparison?.ratingDifference < 0 ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          <p className="text-lg font-medium">
            {data.comparison?.ratingDifference > 0 ? '+' : ''}
            {(data.comparison?.ratingDifference || 0).toFixed(1)} difference
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <div className="w-28 h-28 rounded-full bg-purple-100 flex items-center justify-center mb-3 mx-auto">
          <Activity className="h-12 w-12 text-purple-600" />
        </div>
        <p className="text-3xl font-bold text-purple-700">{data.comparison?.aiReviewCount || 0}</p>
        <p className="text-lg text-gray-600">AI Reviews</p>
        <p className="text-2xl font-semibold text-purple-600 mt-2">
          {(data.comparison?.aiAverageRating || 0).toFixed(1)}
          <span className="text-sm text-gray-500 ml-1">/ 5</span>
        </p>
        <p className="text-sm text-gray-500">Average Rating</p>
      </div>
    </div>
    
    {/* Rating comparison bars */}
    <div className="bg-gray-50 p-6 rounded-lg">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution Comparison</h4>
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map(rating => {
          const userCount = data.userRatingDistribution?.[5 - rating] || 0;
          const aiCount = data.aiRatingDistribution?.[5 - rating] || 0;
          const maxCount = Math.max(userCount, aiCount, 1);
          
          return (
            <div key={rating} className="flex items-center space-x-2">
              <div className="w-6 text-right font-medium text-gray-700">{rating}★</div>
              <div className="flex-1 flex items-center h-8">
                <div 
                  className="bg-blue-500 h-6 rounded-l-md"
                  style={{ width: `${(userCount / maxCount) * 100}%`, minWidth: userCount > 0 ? '10px' : '0' }}
                ></div>
                <div className="mx-1 h-6 flex items-center justify-center">
                  {userCount > 0 && (
                    <span className="text-xs font-medium text-gray-700">{userCount}</span>
                  )}
                </div>
                <div 
                  className="bg-purple-500 h-6 rounded-r-md"
                  style={{ width: `${(aiCount / maxCount) * 100}%`, minWidth: aiCount > 0 ? '10px' : '0' }}
                ></div>
                <div className="ml-1 h-6 flex items-center justify-center">
                  {aiCount > 0 && (
                    <span className="text-xs font-medium text-gray-700">{aiCount}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center mt-4 space-x-8">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">User Reviews</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">AI Reviews</span>
        </div>
      </div>
    </div>
  </div>
)}
      
      {viewType === 'helpfulness' && (
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Most Helpful User Reviews</h5>
            <div className="space-y-2">
              {(data.userHelpfulnessMetrics || []).slice(0, 5).map((review: any, index: number) => (
                <div key={review.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Review ID: {review.id.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500">
                        {review.helpfulCount} helpful • {review.upvoteCount} upvotes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {(review.helpfulnessRatio * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">helpful ratio</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component 5: Category Trends Chart
function CategoryTrendsChart({ 
  data, 
  expanded, 
  onToggleExpand, 
  filter, 
  onFilterChange,
  onExport 
}: {
  data: any;
  expanded: boolean;
  onToggleExpand: () => void;
  filter?: ChartFilter;
  onFilterChange: (filter: ChartFilter) => void;
  onExport: (data: any) => void;
}) {
  const [viewType, setViewType] = useState<'distribution' | 'growth' | 'correlations' | 'trends'>('distribution');
  
  // Handle missing data
  if (!data || data.error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Hash className="h-5 w-5 mr-2 text-indigo-600" />
            Category Trends Analytics
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            {data?.error || 'Failed to load category trends data'}
          </p>
        </div>
      </div>
    );
  }
  
  const chartHeight = expanded ? 500 : 300;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Hash className="h-5 w-5 mr-2 text-indigo-600" />
          Category Trends Analytics
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExport(data)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={viewType === 'distribution' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('distribution')}
        >
          Distribution
        </Button>
        <Button
          variant={viewType === 'growth' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('growth')}
        >
          Growth Rates
        </Button>
        <Button
          variant={viewType === 'correlations' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('correlations')}
        >
          Correlations
        </Button>
        <Button
          variant={viewType === 'trends' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewType('trends')}
        >
          Time Trends
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-indigo-600">Total Categories</p>
          <p className="text-2xl font-bold text-indigo-900">{data.totalCategories || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Most Popular</p>
          <p className="text-lg font-bold text-green-900 truncate">
            {data.mostPopularCategory?.name || 'N/A'}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Fastest Growing</p>
          <p className="text-lg font-bold text-purple-900 truncate">
            {data.fastestGrowingCategory?.name || 'N/A'}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-600">Growth Rate</p>
          <p className="text-2xl font-bold text-yellow-900">
            {data.fastestGrowingCategory?.growthRate 
              ? `${data.fastestGrowingCategory.growthRate.toFixed(1)}%`
              : 'N/A'}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      {viewType === 'distribution' && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <Treemap
            data={(data.categoryStats || []).slice(0, 10).map((cat: any) => ({
              name: cat.name,
              size: cat.briefCount,
              views: cat.viewCount,
              engagement: cat.engagementRate,
            }))}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill={COLORS.primary[0]}
            content={({ x, y, width, height, name, size, views }: any) => {
              if (width < 50 || height < 30) return null;
              
              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                      fill: COLORS.mixed[Math.floor(Math.random() * COLORS.mixed.length)],
                      stroke: '#fff',
                      strokeWidth: 2,
                    }}
                  />
                  <text
                    x={x + width / 2}
                    y={y + height / 2 - 10}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                  >
                    {name}
                  </text>
                  <text
                    x={x + width / 2}
                    y={y + height / 2 + 10}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                  >
                    {size} briefs
                  </text>
                </g>
              );
            }}
          />
        </ResponsiveContainer>
      )}
      
      {viewType === 'growth' && (
        <div className="space-y-3">
          {(data.emergingCategories || []).map((category: any, index: number) => (
            <div key={category.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
                  index === 1 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
                  'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-500">Emerging Category</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">
                  {category.growthRate > 0 ? '+' : ''}{category.growthRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">growth rate</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {viewType === 'correlations' && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-900 mb-3">Categories That Often Appear Together</h5>
          {(data.categoryCorrelations || []).map((correlation: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-bold text-indigo-600">
                      {correlation.category1.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-bold text-purple-600">
                      {correlation.category2.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {correlation.category1} + {correlation.category2}
                  </p>
                  <p className="text-xs text-gray-500">
                    Appeared together {correlation.count} times
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-indigo-600">{correlation.count}</p>
                <p className="text-xs text-gray-500">co-occurrences</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {viewType === 'trends' && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="day" 
              stroke="#6B7280" 
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            {(data.categoryStats || []).slice(0, 5).map((category: any, index: number) => (
              <Line
                key={category.id}
                type="monotone"
                data={category.trendByDay}
                dataKey="count"
                stroke={COLORS.mixed[index % COLORS.mixed.length]}
                strokeWidth={2}
                name={category.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}