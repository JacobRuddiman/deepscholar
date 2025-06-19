/**
 * Brief Selector Component
 * 
 * Allows users to search and select briefs for export
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, FileText, User, Calendar, Eye } from 'lucide-react';

interface Brief {
  id: string;
  title: string;
  abstract?: string;
  author: {
    name: string;
  };
  createdAt: string;
  viewCount: number;
  userId: string;
}

interface BriefSelectorProps {
  selectedBriefId: string;
  onSelectBrief: (briefId: string) => void;
  currentUserId?: string;
}

export default function BriefSelector({ selectedBriefId, onSelectBrief, currentUserId }: BriefSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allBriefs, setAllBriefs] = useState<Brief[]>([]);
  const [myBriefs, setMyBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    loadBriefs();
  }, []);

  const loadBriefs = async () => {
    setLoading(true);
    try {
      // Load all active briefs
      const allResponse = await fetch('/api/briefs?limit=100&isActive=true');
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllBriefs(allData.briefs || []);
      }

      // Load user's active briefs if we have a user ID
      if (currentUserId) {
        const myResponse = await fetch(`/api/briefs?userId=${currentUserId}&limit=50&isActive=true`);
        if (myResponse.ok) {
          const myData = await myResponse.json();
          setMyBriefs(myData.briefs || []);
        }
      }
    } catch (error) {
      console.error('Failed to load briefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBriefs = () => {
    const briefs = activeTab === 'all' ? allBriefs : myBriefs;
    if (!searchQuery) return briefs;
    
    return briefs.filter(brief => 
      brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brief.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (brief.abstract && brief.abstract.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filteredBriefs = getFilteredBriefs();

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading briefs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Briefs ({allBriefs.length})
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'mine'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Briefs ({myBriefs.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'all' ? 'all briefs' : 'your briefs'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {filteredBriefs.length} brief{filteredBriefs.length !== 1 ? 's' : ''} found
      </div>

      {/* Brief list */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
        {filteredBriefs.length > 0 ? (
          filteredBriefs.map((brief) => (
            <div
              key={brief.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedBriefId === brief.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => onSelectBrief(brief.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-medium text-gray-900 truncate">
                      {brief.title}
                    </h3>
                  </div>
                  
                  {brief.abstract && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {brief.abstract}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{brief.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(brief.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{brief.viewCount} views</span>
                    </div>
                  </div>
                </div>
                
                {selectedBriefId === brief.id && (
                  <div className="ml-3 flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">
              {searchQuery 
                ? `No briefs found matching "${searchQuery}"`
                : `No ${activeTab === 'mine' ? 'personal' : ''} briefs available`
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
