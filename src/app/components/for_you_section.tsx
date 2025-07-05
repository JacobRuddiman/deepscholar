'use client';

import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import BriefCard from './brief_card';
import type { BriefCardProps } from './brief_card';
import { useSession } from 'next-auth/react';
import { isLocalMode, getLocalUser } from '@/lib/localMode';

interface RecommendationScore {
  briefId: string;
  score: number;
  reasons: string[];
  brief: {
    id: string;
    title: string;
    abstract: string | null;
    createdAt: Date;
    response: string;
    slug: string | null;
    viewCount: number | null;
    model: {
      name: string;
    } | null;
    categories: Array<{
      name: string;
    }>;
    reviews: Array<{
      rating: number;
    }>;
  };
}

// Transform recommendation to BriefCardProps
const transformRecommendation = (rec: RecommendationScore): BriefCardProps => {
  const reviewCount = rec.brief.reviews?.length ?? 0;
  const averageRating = reviewCount > 0 
    ? rec.brief.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
    : undefined;

  return {
    id: rec.brief.id,
    title: rec.brief.title,
    abstract: rec.brief.abstract ?? '',
    model: rec.brief.model?.name ?? 'Unknown',
    date: new Date(rec.brief.createdAt).toISOString().split('T')[0] as string,
    readTime: `${Math.max(1, Math.ceil((rec.brief.response?.length ?? 0) / 1000))} min`,
    category: rec.brief.categories?.[0]?.name ?? 'General',
    views: rec.brief.viewCount ?? 0,
    rating: averageRating,
    reviewCount: reviewCount,
    featured: rec.score > 70, // High recommendation score = featured
    ...(rec.brief.slug && { slug: rec.brief.slug }),
    recommendationScore: Math.round(rec.score),
    recommendationReasons: rec.reasons,
  };
};

export default function ForYouSection() {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<BriefCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // In local mode, always show recommendations
      if (isLocalMode()) {
        try {
          const response = await fetch('/api/recommendations/personalized?limit=6');
          const result = await response.json();

          if (result.success && result.data) {
            const transformedRecs = result.data.map(transformRecommendation);
            setRecommendations(transformedRecs);
          } else {
            setError(result.error || 'Failed to fetch recommendations');
          }
        } catch (err) {
          console.error('Failed to fetch recommendations:', err);
          setError('Failed to fetch recommendations');
        } finally {
          setLoading(false);
        }
        return;
      }

      // For production mode, check session
      if (status === 'loading') return;
      
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/recommendations/personalized?limit=6');
        const result = await response.json();

        if (result.success && result.data) {
          const transformedRecs = result.data.map(transformRecommendation);
          setRecommendations(transformedRecs);
        } else {
          setError(result.error || 'Failed to fetch recommendations');
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError('Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    void fetchRecommendations();
  }, [session, status]);

  // Don't show section if user is not logged in (except in local mode)
  if (!isLocalMode()) {
    if (status === 'loading') {
      return (
        <section className="py-4 md:py-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </section>
      );
    }

    if (!session?.user) {
      return null; // Don't show for non-authenticated users
    }
  }

  if (error) {
    return (
      <section className="py-4 md:py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Failed to load personalized recommendations</p>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0 && !loading) {
    return (
      <section className="py-4 md:py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
            <Heart className="w-6 h-6 mr-2 text-pink-500" />
            For You
          </h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">Building Your Recommendations</h3>
          <p className="text-blue-700 text-sm mb-4">
            Interact with more content to get personalized recommendations based on your interests.
          </p>
          <Link 
            href="/briefs" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Explore All Briefs
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 md:py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
          <Heart className="w-6 h-6 mr-2 text-pink-500" />
          For You
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>Personalized recommendations</span>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <BriefCard key={rec.id} {...rec} compact showRecommendationScore />
          ))}
        </div>
      )}
    </section>
  );
}
