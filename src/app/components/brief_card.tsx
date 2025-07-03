//components/brief_card.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, BookOpen, ExternalLink, Award, Star } from 'lucide-react';

export type BriefCardProps = {
  id: string;
  title: string;
  abstract: string;
  model: string;
  date: string;
  readTime: string;
  category: string;
  views: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  compact?: boolean;
  slug?: string;
};

const BriefCard: React.FC<BriefCardProps> = ({
  id,
  title,
  abstract,
  model,
  date,
  readTime,
  category,
  views,
  rating,
  reviewCount,
  featured = false,
  compact = false,
  slug,
}) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Use slug if available, otherwise fall back to id
  const href = `/briefs/${id}`;

  return (
    <div 
      className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden ${
        featured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      <Link href={href} className="block h-full">
        <div className="p-5">
          {featured && (
            <div className="flex items-center mb-2">
              <Award className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs font-medium text-blue-500">Featured Research</span>
            </div>
          )}
          
          <div className="flex justify-between items-start">
            <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors ${
              compact ? 'text-base line-clamp-1' : 'text-lg mb-1'
            }`}>
              {title}
            </h3>
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium flex-shrink-0">
              {model}
            </span>
          </div>
          
          <p className={`text-gray-600 ${compact ? 'text-sm line-clamp-2' : 'line-clamp-3 mt-2'}`}>
            {abstract}
          </p>
          
          <div className={`flex flex-wrap items-center text-xs text-gray-500 ${compact ? 'mt-2' : 'mt-3'}`}>
            <span className="flex items-center mr-3">
              <Clock className="h-3 w-3 mr-1" />
              {formattedDate}
            </span>
            <span className="flex items-center mr-3">
              <BookOpen className="h-3 w-3 mr-1" />
              {readTime} read
            </span>
            {rating && reviewCount && reviewCount > 0 && (
              <span className="flex items-center mr-3">
                <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                {rating.toFixed(1)} ({reviewCount})
              </span>
            )}
            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
              {category}
            </span>
            <span className="ml-auto">{views.toLocaleString()} views</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BriefCard;
