import React from 'react';
import { Shuffle } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';

export function DataSkewingSection({ config, setConfig }: any) {
  return (
    <CollapsibleSection
      title="Data Patterns & Skewing"
      icon={<Shuffle className="w-5 h-5 text-indigo-500" />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="powerUsers"
                checked={config.dataSkew?.powerUsers}
                onChange={(e) => setConfig({
                  ...config,
                  dataSkew: { ...config.dataSkew!, powerUsers: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="powerUsers" className="text-sm font-medium text-gray-700">
                Create Power Users
              </label>
              <Tooltip content="10% of users will generate 50% of all activity (realistic user distribution)." />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="viralBriefs"
                checked={config.dataSkew?.viralBriefs}
                onChange={(e) => setConfig({
                  ...config,
                  dataSkew: { ...config.dataSkew!, viralBriefs: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="viralBriefs" className="text-sm font-medium text-gray-700">
                Create Viral Briefs
              </label>
              <Tooltip content="5% of briefs will receive 10x normal engagement (viral content simulation)." />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="controversialContent"
                checked={config.dataSkew?.controversialContent}
                onChange={(e) => setConfig({
                  ...config,
                  dataSkew: { ...config.dataSkew!, controversialContent: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="controversialContent" className="text-sm font-medium text-gray-700">
                Create Controversial Content
              </label>
              <Tooltip content="Some content will have highly polarized ratings (either 1 or 5 stars)." />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Time Distribution
              </label>
              <Tooltip content="How content creation dates are distributed over time." />
            </div>
            <Select
              value={config.dataSkew?.timeDistribution}
              onChange={(e) => setConfig({
                ...config,
                dataSkew: { ...config.dataSkew!, timeDistribution: e.target.value as any }
              })}
              options={[
                { value: 'uniform', label: 'Uniform (even distribution)' },
                { value: 'recent', label: 'Recent (more recent data)' },
                { value: 'exponential', label: 'Exponential (growth over time)' },
              ]}
            />

            <div className="mt-3">
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <Tooltip content="The time period over which to distribute created content." />
              </div>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={config.dataSkew?.startDate ? 
                    new Date(config.dataSkew.startDate).toISOString().split('T')[0] : 
                    ''
                  }
                  onChange={(e) => setConfig({
                    ...config,
                    dataSkew: { ...config.dataSkew!, startDate: new Date(e.target.value) }
                  })}
                />
                <Input
                  type="date"
                  value={config.dataSkew?.endDate ? 
                    new Date(config.dataSkew.endDate).toISOString().split('T')[0] : 
                    ''
                  }
                  onChange={(e) => setConfig({
                    ...config,
                    dataSkew: { ...config.dataSkew!, endDate: new Date(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}