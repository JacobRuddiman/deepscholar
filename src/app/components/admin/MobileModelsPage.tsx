'use client';

import React, { useState } from 'react';
import { Search, Filter, Database, Settings, Play, Pause, MoreVertical, Cpu, Zap, Clock } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  version: string;
  performance: {
    speed: number;
    accuracy: number;
    cost: number;
  };
  usage: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface MobileModelsPageProps {
  models: Model[];
  onToggleStatus: (modelId: string) => void;
  onConfigureModel: (model: Model) => void;
  onViewMetrics: (modelId: string) => void;
}

export default function MobileModelsPage({ 
  models, 
  onToggleStatus, 
  onConfigureModel, 
  onViewMetrics 
}: MobileModelsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' ||
                         (filterBy === 'active' && model.status === 'active') ||
                         (filterBy === 'inactive' && model.status === 'inactive') ||
                         (filterBy === 'maintenance' && model.status === 'maintenance');
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate stats
  const totalModels = models.length;
  const activeModels = models.filter(m => m.status === 'active').length;
  const avgSuccessRate = models.length > 0 
    ? models.reduce((sum, m) => sum + m.usage.successRate, 0) / models.length
    : 0;
  const totalRequests = models.reduce((sum, m) => sum + m.usage.totalRequests, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Database className="w-6 h-6" />
          <h1 className="text-xl font-bold">AI Models Management</h1>
        </div>
        <p className="text-indigo-100 text-sm">Configure and monitor AI model performance</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>{filteredModels.length} models</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-300 rounded-full"></div>
            <span>{activeModels} active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalModels}</p>
          <p className="text-sm text-gray-600">Total Models</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeModels}</p>
          <p className="text-sm text-gray-600">Active</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgSuccessRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Success Rate</p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRequests.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Requests</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Models</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Models List */}
      <div className="space-y-3">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            {/* Model Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{model.name}</h3>
                    <p className="text-sm text-gray-500">{model.provider} • v{model.version}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(model.status)}`}>
                    {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  </span>
                </div>
              </div>

              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Zap className="w-3 h-3 text-gray-400" />
                  <span className={`text-sm font-semibold ${getPerformanceColor(model.performance.speed)}`}>
                    {model.performance.speed}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Speed</p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Cpu className="w-3 h-3 text-gray-400" />
                  <span className={`text-sm font-semibold ${getPerformanceColor(model.performance.accuracy)}`}>
                    {model.performance.accuracy}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Accuracy</p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {model.usage.avgResponseTime}ms
                  </span>
                </div>
                <p className="text-xs text-gray-500">Response</p>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <div className="flex items-center space-x-4">
                <span>{model.usage.totalRequests.toLocaleString()} requests</span>
                <span className={getPerformanceColor(model.usage.successRate)}>
                  {model.usage.successRate}% success
                </span>
              </div>
              <span>Updated {new Date(model.updatedAt).toLocaleDateString()}</span>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => onToggleStatus(model.id)}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  model.status === 'active'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {model.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="text-sm font-medium">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="text-sm font-medium">Activate</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => onConfigureModel(model)}
                className="flex-1 bg-indigo-100 text-indigo-700 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Configure</span>
              </button>
              
              <button
                onClick={() => onViewMetrics(model.id)}
                className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-200 transition-colors"
              >
                <Cpu className="w-4 h-4" />
                <span className="text-sm font-medium">Metrics</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredModels.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
