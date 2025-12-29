'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BriefCardProps } from './brief_card';
import BriefCard from './brief_card';
import { getPopularBriefs } from '@/server/actions/home';
import { transformBrief } from '@/lib/brief-utils';

type PopularBriefsProps = {
  briefs?: BriefCardProps[];
};

const SectionHeader: React.FC = () => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold text-gray-900">Popular Research Insights</h2>
    <Link href="/briefs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
      View all
    </Link>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2" />
        <div className="h-3 bg-gray-200 rounded mb-2" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    ))}
  </div>
);

const PopularBriefs: React.FC<PopularBriefsProps> = ({ briefs: propBriefs }) => {
  const [briefs, setBriefs] = useState<BriefCardProps[]>(propBriefs ?? []);
  const [loading, setLoading] = useState(!propBriefs);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propBriefs) return;

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
        console.error('[PopularBriefs] Failed to fetch:', err);
        setError('Failed to load popular briefs');
      } finally {
        setLoading(false);
      }
    };

    void fetchBriefs();
  }, [propBriefs]);

  return (
    <section className="py-6">
      <SectionHeader />

      {loading && <LoadingSkeleton />}

      {error && (
        <div className="text-center py-8 text-gray-500">{error}</div>
      )}

      {!loading && !error && briefs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No popular briefs available yet.{' '}
          <Link href="/brief_upload" className="text-blue-600 hover:text-blue-800">
            Create the first one!
          </Link>
        </div>
      )}

      {!loading && !error && briefs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {briefs.map((brief) => (
            <BriefCard key={brief.id} {...brief} />
          ))}
        </div>
      )}
    </section>
  );
};

export default PopularBriefs;
