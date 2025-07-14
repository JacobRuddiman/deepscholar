import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';
import { Input } from '@/app/components/ui/input';

export function EngagementSection({ config, setConfig, showAdvanced }: any) {
  return (
    <CollapsibleSection
      title="User Engagement"
      icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="upvotesEnabled"
                checked={config.upvotes?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  upvotes: { ...config.upvotes!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="upvotesEnabled" className="text-sm font-medium text-gray-700">
                Generate Upvotes
              </label>
              <Tooltip content="Create upvote interactions between users and content." />
            </div>

            {config.upvotes?.enabled && (
              <div className="ml-7 space-y-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="text-xs text-gray-600">Brief Upvote Ratio</label>
                    <Tooltip content="Percentage of users who upvote briefs they view." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.upvotes.briefUpvoteRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        upvotes: { ...config.upvotes!, briefUpvoteRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.upvotes.briefUpvoteRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="savedBriefsEnabled"
                checked={config.savedBriefs?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  savedBriefs: { ...config.savedBriefs!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="savedBriefsEnabled" className="text-sm font-medium text-gray-700">
                Generate Saved Briefs
              </label>
              <Tooltip content="Create saved/bookmarked briefs for users' reading lists." />
            </div>

            {config.savedBriefs?.enabled && (
              <div className="ml-7 space-y-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="text-xs text-gray-600">Save Ratio</label>
                    <Tooltip content="Percentage of users who save briefs for later reading." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.savedBriefs.saveRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        savedBriefs: { ...config.savedBriefs!, saveRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.savedBriefs.saveRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="tokensEnabled"
                checked={config.tokens?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  tokens: { ...config.tokens!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="tokensEnabled" className="text-sm font-medium text-gray-700">
                Generate Token Economy
              </label>
              <Tooltip content="Create token balances, transactions, and purchase history." />
            </div>

            {config.tokens?.enabled && showAdvanced && (
              <div className="ml-7 space-y-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="text-xs text-gray-600">Purchase Ratio</label>
                    <Tooltip content="Percentage of users who have purchased tokens." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.tokens.purchaseRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        tokens: { ...config.tokens!, purchaseRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.tokens.purchaseRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="text-xs text-gray-600">Whale Ratio</label>
                    <Tooltip content="Percentage of users who are token whales (have significantly more tokens)." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.tokens.whaleRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        tokens: { ...config.tokens!, whaleRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.tokens.whaleRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="exportsEnabled"
                checked={config.exports?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  exports: { ...config.exports!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="exportsEnabled" className="text-sm font-medium text-gray-700">
                Generate Export History
              </label>
              <Tooltip content="Create export history and usage tracking data." />
            </div>

            {config.exports?.enabled && (
              <div className="ml-7 space-y-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="text-xs text-gray-600">Exports per User</label>
                    <Tooltip content="Range of exports each user has performed." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={config.exports.exportsPerUser?.[0]}
                      onChange={(e) => setConfig({
                        ...config,
                        exports: {
                          ...config.exports!,
                          exportsPerUser: [parseInt(e.target.value) || 0, config.exports!.exportsPerUser![1]]
                        }
                      })}
                      placeholder="Min"
                      className="w-16"
                      min="0"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      value={config.exports.exportsPerUser?.[1]}
                      onChange={(e) => setConfig({
                        ...config,
                        exports: {
                          ...config.exports!,
                          exportsPerUser: [config.exports!.exportsPerUser![0], parseInt(e.target.value) || 0]
                        }
                      })}
                      placeholder="Max"
                      className="w-16"
                      min="0"
                    />
                  </div>
                </div>

                {showAdvanced && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="exportUsageEnabled"
                      checked={config.exportUsage?.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        exportUsage: { ...config.exportUsage!, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="exportUsageEnabled" className="text-xs text-gray-600">
                      Export Usage Tracking
                    </label>
                    <Tooltip content="Track daily export limits and usage patterns." />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}