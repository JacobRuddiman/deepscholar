'use client';

/**
 * Brief Card component - displays a single brief in list views
 * TODO: Implement full brief card with title, abstract, author, stats
 */
export default function BriefCard({ briefId, ...props }: { briefId?: string; [key: string]: unknown }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">Brief: {briefId}</p>
    </div>
  );
}
