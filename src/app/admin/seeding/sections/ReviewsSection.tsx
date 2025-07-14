import React from 'react';
import { MessageSquare } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';
import { Input } from '@/app/components/ui/input';

export function ReviewsSection({ config, setConfig, showAdvanced }: any) {
  return (
    <CollapsibleSection
      title="Reviews & Ratings"
      icon={<MessageSquare className="w-5 h-5 text-purple-500" />}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="reviewsEnabled"
            checked={config.reviews?.enabled}
            onChange={(e) => setConfig({
              ...config,
              reviews: { ...config.reviews!, enabled: e.target.checked }
            })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="reviewsEnabled" className="text-sm font-medium text-gray-700">
            Generate User Reviews
          </label>
          <Tooltip content="Create reviews from users with realistic rating distributions and content." />
        </div>

        {config.reviews?.enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Reviews per Brief Range
                </label>
                <Tooltip content="Range of how many reviews each brief receives. Some briefs may have many reviews, others none." />
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={config.reviews.reviewsPerBrief?.[0]}
                  onChange={(e) => setConfig({
                    ...config,
                    reviews: {
                      ...config.reviews!,
                      reviewsPerBrief: [parseInt(e.target.value) || 0, config.reviews!.reviewsPerBrief![1]]
                    }
                  })}
                  placeholder="Min"
                  className="w-24"
                  min="0"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  value={config.reviews.reviewsPerBrief?.[1]}
                  onChange={(e) => setConfig({
                    ...config,
                    reviews: {
                      ...config.reviews!,
                      reviewsPerBrief: [config.reviews!.reviewsPerBrief![0], parseInt(e.target.value) || 0]
                    }
                  })}
                  placeholder="Max"
                  className="w-24"
                  min="0"
                />
              </div>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Review Helpfulness</h4>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reviewHelpfulnessEnabled"
                    checked={config.reviewHelpfulness?.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      reviewHelpfulness: { ...config.reviewHelpfulness!, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="reviewHelpfulnessEnabled" className="text-sm font-medium text-gray-700">
                    Generate Review Helpfulness Data
                  </label>
                  <Tooltip content="Track which reviews users find helpful." />
                </div>

                {config.reviewHelpfulness?.enabled && (
                  <div className="ml-7">
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="text-xs text-gray-600">Helpful Mark Ratio</label>
                      <Tooltip content="Percentage of reviews that get marked as helpful by users." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        value={config.reviewHelpfulness.helpfulMarkRatio! * 100}
                        onChange={(e) => setConfig({
                          ...config,
                          reviewHelpfulness: { ...config.reviewHelpfulness!, helpfulMarkRatio: parseInt(e.target.value) / 100 }
                        })}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {Math.round((config.reviewHelpfulness.helpfulMarkRatio || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="aiReviewsEnabled"
              checked={config.aiReviews?.enabled}
              onChange={(e) => setConfig({
                ...config,
                aiReviews: { ...config.aiReviews!, enabled: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="aiReviewsEnabled" className="text-sm font-medium text-gray-700">
              Generate AI Reviews
            </label>
            <Tooltip content="Create AI-generated reviews with typically higher quality ratings than user reviews." />
          </div>

          {config.aiReviews?.enabled && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  AI Reviews per Brief Range
                </label>
                <Tooltip content="Range of AI reviews per brief. Usually fewer than user reviews." />
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={config.aiReviews.aiReviewsPerBrief?.[0]}
                  onChange={(e) => setConfig({
                    ...config,
                    aiReviews: {
                      ...config.aiReviews!,
                      aiReviewsPerBrief: [parseInt(e.target.value) || 0, config.aiReviews!.aiReviewsPerBrief![1]]
                    }
                  })}
                  placeholder="Min"
                  className="w-24"
                  min="0"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  value={config.aiReviews.aiReviewsPerBrief?.[1]}
                  onChange={(e) => setConfig({
                    ...config,
                    aiReviews: {
                      ...config.aiReviews!,
                      aiReviewsPerBrief: [config.aiReviews!.aiReviewsPerBrief![0], parseInt(e.target.value) || 0]
                    }
                  })}
                  placeholder="Max"
                  className="w-24"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}