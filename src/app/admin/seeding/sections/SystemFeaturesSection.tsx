import React from 'react';
import { Settings, Target, MessageSquare, Clock } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';
import { Input } from '@/app/components/ui/input';

export function SystemFeaturesSection({ config, setConfig, showAdvanced }: any) {
  return (
    <>
      {/* User Recommendations */}
      <CollapsibleSection
        title="User Recommendations"
        icon={<Target className="w-5 h-5 text-pink-500" />}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="userRecommendationsEnabled"
              checked={config.userRecommendations?.enabled}
              onChange={(e) => setConfig({
                ...config,
                userRecommendations: { ...config.userRecommendations!, enabled: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="userRecommendationsEnabled" className="text-sm font-medium text-gray-700">
              Generate User Recommendations
            </label>
            <Tooltip content="Creates AI-powered recommendation profiles for users based on their activity patterns." />
          </div>

          {config.userRecommendations?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Users with Recommendations
                  </label>
                  <Tooltip content="Percentage of users who have recommendation profiles calculated." />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    value={config.userRecommendations.recommendationRatio! * 100}
                    onChange={(e) => setConfig({
                      ...config,
                      userRecommendations: { ...config.userRecommendations!, recommendationRatio: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round((config.userRecommendations.recommendationRatio || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Keyword Diversity
                  </label>
                  <Tooltip content="Number of different keywords tracked per user for recommendations." />
                </div>
                <Input
                  type="number"
                  value={config.userRecommendations.keywordDiversity}
                  onChange={(e) => setConfig({
                    ...config,
                    userRecommendations: { ...config.userRecommendations!, keywordDiversity: parseInt(e.target.value) || 15 }
                  })}
                  min="5"
                  max="50"
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Email System */}
      <CollapsibleSection
        title="Email System"
        icon={<MessageSquare className="w-5 h-5 text-cyan-500" />}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailSystemEnabled"
              checked={config.emailSystem?.enabled}
              onChange={(e) => setConfig({
                ...config,
                emailSystem: { ...config.emailSystem!, enabled: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="emailSystemEnabled" className="text-sm font-medium text-gray-700">
              Generate Email Data
            </label>
            <Tooltip content="Creates email footers, sent emails, and scheduled email campaigns." />
          </div>

          {config.emailSystem?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Footers
                  </label>
                  <Tooltip content="Number of different email footer templates to create." />
                </div>
                <Input
                  type="number"
                  value={config.emailSystem.footerCount}
                  onChange={(e) => setConfig({
                    ...config,
                    emailSystem: { ...config.emailSystem!, footerCount: parseInt(e.target.value) || 3 }
                  })}
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Success Rate
                  </label>
                  <Tooltip content="Percentage of emails that are successfully delivered." />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    value={config.emailSystem.emailDeliverySuccess! * 100}
                    onChange={(e) => setConfig({
                      ...config,
                      emailSystem: { ...config.emailSystem!, emailDeliverySuccess: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round((config.emailSystem.emailDeliverySuccess || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Sessions */}
      <CollapsibleSection
        title="User Sessions"
        icon={<Clock className="w-5 h-5 text-teal-500" />}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="sessionsEnabled"
              checked={config.sessions?.enabled}
              onChange={(e) => setConfig({
                ...config,
                sessions: { ...config.sessions!, enabled: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sessionsEnabled" className="text-sm font-medium text-gray-700">
              Generate User Sessions
            </label>
            <Tooltip content="Creates user login sessions and tracks activity patterns." />
          </div>

          {config.sessions?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Active Session Ratio
                  </label>
                  <Tooltip content="Percentage of users with currently active sessions." />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    value={config.sessions.activeSessionRatio! * 100}
                    onChange={(e) => setConfig({
                      ...config,
                      sessions: { ...config.sessions!, activeSessionRatio: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round((config.sessions.activeSessionRatio || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Multiple Sessions Ratio
                  </label>
                  <Tooltip content="Percentage of users with multiple active sessions (different devices)." />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    value={config.sessions.multipleSessionsRatio! * 100}
                    onChange={(e) => setConfig({
                      ...config,
                      sessions: { ...config.sessions!, multipleSessionsRatio: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round((config.sessions.multipleSessionsRatio || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </>
  );
}