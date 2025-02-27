'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getUserBriefs } from '@/server/actions/briefs';
import { 
  ThumbsUp, 
  MessageSquare, 
  Clock, 
  Loader2,
  AlertCircle,
  ExternalLink,
  Filter
} from 'lucide-react';

type Brief = {
  id: string;
  title: string;
  abstract: string | null;
  createdAt: Date;
  upvotes: any[];
  reviews: any[];
  categories: { name: string }[];
  model: {
    name: string;
    provider: string;
  };
};

export default function MyBriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadBriefs();
  }, []);

  const loadBriefs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getUserBriefs();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setBriefs(result.data);
    } catch (error) {
      setError('Failed to load briefs. Please try again later.');
      console.error('Error loading briefs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories from all briefs
  const categories = Array.from(new Set(
    briefs.flatMap(brief => brief.categories.map(cat => cat.name))
  )).sort();

  // Filter briefs by selected category
  const filteredBriefs = selectedCategory
    ? briefs.filter(brief => 
        brief.categories.some(cat => cat.name === selectedCategory)
      )
    : briefs;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Research Briefs</h1>
        
        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredBriefs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No research briefs found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBriefs.map((brief, index) => (
            <motion.div
              key={brief.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-xl font-semibold hover:text-blue-600 cursor-pointer">
                      {brief.title}
                    </h2>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {brief.abstract && (
                    <p className="text-gray-600 mb-4">{brief.abstract}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {brief.upvotes.length} upvotes
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {brief.reviews.length} reviews
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(brief.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="flex space-x-2">
                    {brief.categories.map((category) => (
                      <span
                        key={category.name}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    via {brief.model.provider} {brief.model.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 