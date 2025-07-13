'use client';

import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, FileText, User, Calendar, Star, TrendingUp, MoreVertical } from 'lucide-react';

interface Brief {
  id: string;
  title: string;
  abstract: string | null;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  model: {
    name: string;
    provider: string;
  };
  categories: Array<{
    name: string;
  }>;
  published: boolean;
  viewCount: number;
  reviewCount: number;
  upvoteCount: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

interface MobileBriefsPageProps {
  briefs: Brief[];
  onViewBrief: (briefId: string) => void;
  onEditBrief: (brief: Brief) => void;
  onDeleteBrief: (briefId: string) => void;
  onTogglePublished: (briefId: string) => void;
}

export default function MobileBriefsPage({ 
  briefs, 
  onViewBrief, 
  onEditBrief, 
  onDeleteBrief, 
  onTogglePublished 
}: MobileBriefsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedBriefs, setSelectedBriefs] = useState<Set<string>>(new Set());

  const filteredBriefs = briefs.filter(brief => {
    const matchesSearch = brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (brief.abstract ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (brief.author.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' ||
                         (filterBy === 'published' && brief.published) ||
                         (filterBy === 'draft' && !brief.published) ||
                         (filterBy === 'popular' && brief.viewCount > 50);
    
    return matchesSearch && matchesFilter;
  });

  const handleSelectBrief = (briefId: string) => {
    const newSelected = new Set(selectedBriefs);
    if (newSelected.has(briefId)) {
      newSelected.delete(briefId);
    } else {
      newSelected.add(briefId);
    }
    setSelectedBriefs(newSelected);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedBriefs.size} selected briefs?`)) {
      selectedBriefs.forEach(briefId => onDeleteBrief(briefId));
      setSelectedBriefs(new Set());
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400 text-xs">No rating</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Calculate stats
  const totalBriefs = briefs.length;
  const publishedBriefs = briefs.filter(b => b.published).length;
  const totalViews = briefs.reduce((sum, b) => sum + b.viewCount, 0);
  const avgRating = briefs.filter(b => b.averageRating).length > 0 
    ? briefs.reduce((sum, b) => sum + (b.averageRating ?? 0), 0) / briefs.filter(b => b.averageRating).length
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-xl font-bold">Briefs Management</h1>
        </div>
        <p className="text-green-100 text-sm">Manage and moderate research briefs</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>{filteredBriefs.length} briefs</span>
          </div>
          {selectedBriefs.size > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span>{selectedBriefs.size} selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalBriefs}</p>
          <p className="text-sm text-gray-600">Total Briefs</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{publishedBriefs}</p>
          <p className="text-sm text-gray-600">Published</p>
        </div>

        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Views</p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}</p>
          <p className="text-sm text-gray-600">Avg Rating</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search briefs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Briefs</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
              <option value="popular">Popular (50+ views)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Actions */}
      {selectedBriefs.size > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedBriefs.size} brief{selectedBriefs.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All</span>
            </button>
          </div>
        </div>
      )}

      {/* Briefs List */}
      <div className="space-y-3">
        {filteredBriefs.map((brief) => {
          const isSelected = selectedBriefs.has(brief.id);
          return (
            <div
              key={brief.id}
              className={`bg-white rounded-2xl p-4 border transition-all ${
                isSelected 
                  ? 'border-green-300 bg-green-50 shadow-md' 
                  : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Brief Header */}
              <div className="flex items-start space-x-3 mb-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectBrief(brief.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                    {brief.title}
                  </h3>
                  {brief.abstract && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {brief.abstract}
                    </p>
                  )}
                  
                  {/* Categories */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {brief.categories.slice(0, 3).map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                      >
                        {category.name}
                      </span>
                    ))}
                    {brief.categories.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{brief.categories.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Author and Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {brief.author.name ?? 'Anonymous'}
                  </span>
                </div>
                
                <button
                  onClick={() => onTogglePublished(brief.id)}
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                    brief.published
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  {brief.published ? 'Published' : 'Draft'}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Eye className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{brief.viewCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">Views</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{brief.reviewCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">Reviews</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{brief.upvoteCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">Upvotes</p>
                </div>
              </div>

              {/* Rating and Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-2">
                  {getRatingStars(brief.averageRating)}
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(brief.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Model Info */}
              <div className="text-xs text-gray-500 mb-3">
                <span className="font-medium">{brief.model.name}</span> ({brief.model.provider})
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewBrief(brief.id)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View</span>
                </button>
                <button
                  onClick={() => onEditBrief(brief)}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={() => onDeleteBrief(brief.id)}
                  className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBriefs.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No briefs found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
