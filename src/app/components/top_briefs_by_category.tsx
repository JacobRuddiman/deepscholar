'use client';

import React, { useEffect, useState } from 'react';
import type { BriefCardProps } from './brief_card';
import BriefCard from './brief_card';
import { getBriefsByCategory, getFeaturedCategories } from '@/server/actions/home';
import { ChevronRight } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  _count: {
    briefs: number;
  };
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

const TopBriefsByCategory: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryBriefs, setCategoryBriefs] = useState<Record<string, BriefCardProps[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch featured categories
        const categoriesResult = await getFeaturedCategories();
        if (!categoriesResult.success || !categoriesResult.data) {
          throw new Error('Failed to fetch categories');
        }
        
        const fetchedCategories = categoriesResult.data.slice(0, 3); // Show top 3 categories
        setCategories(fetchedCategories);
        
        // Fetch briefs for each category
        const briefsPromises = fetchedCategories.map(async (category) => {
          const briefsResult = await getBriefsByCategory(category.name, 3);
          return {
            categoryName: category.name,
            briefs: briefsResult.success && briefsResult.data 
              ? briefsResult.data.map(transformBrief)
              : []
          };
        });
        
        const briefsResults = await Promise.all(briefsPromises);
        const briefsMap: Record<string, BriefCardProps[]> = {};
        briefsResults.forEach(({ categoryName, briefs }) => {
          briefsMap[categoryName] = briefs;
        });
        
        setCategoryBriefs(briefsMap);
      } catch (err) {
        setError('Failed to load category data');
        console.error('Error fetching category data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Research by Category</h2>
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Research by Category</h2>
        <div className="text-center py-8 text-gray-500">
          {error}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Research by Category</h2>
        <div className="text-center py-8 text-gray-500">
          No categories available yet. <a href="/brief_upload" className="text-blue-600 hover:text-blue-800">Create the first brief!</a>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Research by Category</h2>
        <a href="/briefs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Browse all categories
        </a>
      </div>
      
      <div className="space-y-8">
        {categories.map((category) => {
          const briefs = categoryBriefs[category.name] || [];
          
          return (
            <div key={category.id}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {category._count.briefs} {category._count.briefs === 1 ? 'brief' : 'briefs'}
                  </span>
                </div>
                <a 
                  href={`/briefs?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium group"
                >
                  View all
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              
              {briefs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {briefs.map((brief) => (
                    <BriefCard key={brief.id} {...brief} compact />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p>No briefs in this category yet.</p>
                  <a href="/brief_upload" className="text-blue-600 hover:text-blue-800 text-sm">
                    Be the first to contribute!
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Don't see your field of interest?</h3>
        <p className="text-gray-600 mb-4">
          Help expand our research repository by contributing insights from your area of expertise.
        </p>
        <a 
          href="/brief_upload"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Contribute Research
          <ChevronRight className="h-4 w-4 ml-2" />
        </a>
      </div>
    </section>
  );
};

export default TopBriefsByCategory;
