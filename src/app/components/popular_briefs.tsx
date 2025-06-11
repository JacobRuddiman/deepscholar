'use client';

import React, { useEffect, useState } from 'react';
import type { BriefCardProps } from './brief_card';
import BriefCard from './brief_card';
import { getPopularBriefs } from '@/server/actions/home';

type PopularBriefsProps = {
  briefs?: BriefCardProps[];
};

// Transform database brief to BriefCardProps
const transformBrief = (brief: any): BriefCardProps => {
  const reviewCount = brief.reviews?.length ?? 0;
  const averageRating = reviewCount > 0 
    ? brief.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewCount 
    : undefined;

  return {
    id: brief.id,
    title: brief.title,
    abstract: brief.abstract ?? '',
    model: brief.model?.name ?? 'Unknown',
    date: brief.createdAt.toISOString().split('T')[0],
    readTime: `${Math.max(1, Math.ceil((brief.response?.length ?? 0) / 1000))} min`,
    category: brief.categories?.[0]?.name ?? 'General',
    views: brief.viewCount ?? 0,
    rating: averageRating,
    reviewCount: reviewCount,
    featured: (brief.viewCount ?? 0) > 100,
    slug: brief.slug,
  };
};

const PopularBriefs: React.FC<PopularBriefsProps> = ({ briefs: propBriefs }) => {
  const [briefs, setBriefs] = useState<BriefCardProps[]>(propBriefs ?? []);
  const [loading, setLoading] = useState(!propBriefs);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propBriefs) {
      const fetchBriefs = async () => {
        try {
          setLoading(true);
          const result = await getPopularBriefs(4);
          if (result.success && result.data) {
            setBriefs(result.data.map(transformBrief));
          } else {
            setError('Failed to load popular briefs');
          }
        } catch (err) {
          setError('Failed to load popular briefs');
        } finally {
          setLoading(false);
        }
      };
      fetchBriefs();
    }
  }, [propBriefs]);

  if (loading) {
    return (
      <section className="py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Popular Research Insights</h2>
          <a href="/briefs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View all
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Popular Research Insights</h2>
          <a href="/briefs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View all
          </a>
        </div>
        <div className="text-center py-8 text-gray-500">
          {error}
        </div>
      </section>
    );
  }

  if (briefs.length === 0) {
    return (
      <section className="py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Popular Research Insights</h2>
          <a href="/briefs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View all
          </a>
        </div>
        <div className="text-center py-8 text-gray-500">
          No popular briefs available yet. <a href="/brief_upload" className="text-blue-600 hover:text-blue-800">Create the first one!</a>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Popular Research Insights</h2>
        <a href="/briefs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View all
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {briefs.map((brief) => (
          <BriefCard key={brief.id} {...brief} />
        ))}
      </div>
    </section>
  );
};

export default PopularBriefs;
