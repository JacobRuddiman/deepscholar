import React from 'react';
import { FileText } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';
import { Input } from '@/app/components/ui/input';

export function BriefsSection({ config, setConfig, showAdvanced }: any) {
  return (
    <CollapsibleSection
      title="Briefs"
      icon={<FileText className="w-5 h-5 text-green-500" />}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="briefsEnabled"
            checked={config.briefs?.enabled}
            onChange={(e) => setConfig({
              ...config,
              briefs: { ...config.briefs!, enabled: e.target.checked }
            })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="briefsEnabled" className="text-sm font-medium text-gray-700">
            Generate Briefs
          </label>
          <Tooltip content="Create synthetic briefs with realistic content, metadata, and relationships to other data." />
        </div>

        {config.briefs?.enabled && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Briefs
                  </label>
                  <Tooltip content="Total number of briefs to generate. More briefs provide better testing scenarios." />
                </div>
                <Input
                  type="number"
                  value={config.briefs.count}
                  onChange={(e) => setConfig({
                    ...config,
                    briefs: { ...config.briefs!, count: parseInt(e.target.value) || 0 }
                  })}
                  min="1"
                  max="50000"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Published Ratio
                  </label>
                  <Tooltip content="Percentage of briefs that are published (vs draft or unpublished). Higher ratios mean more visible content." />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    value={config.briefs.publishedRatio! * 100}
                    onChange={(e) => setConfig({
                      ...config,
                      briefs: { ...config.briefs!, publishedRatio: parseInt(e.target.value) / 100 }
                    })}
                    min="0"
                    max="100"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round((config.briefs.publishedRatio || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Categories per Brief
                  </label>
                  <Tooltip content="Number of categories each brief can be tagged with. More categories mean richer classification." />
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={config.briefs.categoriesPerBrief?.[0]}
                    onChange={(e) => setConfig({
                      ...config,
                      briefs: {
                        ...config.briefs!,
                        categoriesPerBrief: [parseInt(e.target.value) || 1, config.briefs!.categoriesPerBrief![1]]
                      }
                    })}
                    placeholder="Min"
                    className="w-24"
                    min="1"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    value={config.briefs.categoriesPerBrief?.[1]}
                    onChange={(e) => setConfig({
                      ...config,
                      briefs: {
                        ...config.briefs!,
                        categoriesPerBrief: [config.briefs!.categoriesPerBrief![0], parseInt(e.target.value) || 1]
                      }
                    })}
                    placeholder="Max"
                    className="w-24"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Sources per Brief
                  </label>
                  <Tooltip content="Number of source links each brief references. More sources indicate better research." />
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={config.briefs.sourcesPerBrief?.[0]}
                    onChange={(e) => setConfig({
                      ...config,
                      briefs: {
                        ...config.briefs!,
                        sourcesPerBrief: [parseInt(e.target.value) || 0, config.briefs!.sourcesPerBrief![1]]
                      }
                    })}
                    placeholder="Min"
                    className="w-24"
                    min="0"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    value={config.briefs.sourcesPerBrief?.[1]}
                    onChange={(e) => setConfig({
                      ...config,
                      briefs: {
                        ...config.briefs!,
                        sourcesPerBrief: [config.briefs!.sourcesPerBrief![0], parseInt(e.target.value) || 0]
                      }
                    })}
                    placeholder="Max"
                    className="w-24"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Advanced Brief Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        With Abstract Ratio
                      </label>
                      <Tooltip content="Percentage of briefs that include an abstract/summary section." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        value={config.briefs.withAbstractRatio! * 100}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: { ...config.briefs!, withAbstractRatio: parseInt(e.target.value) / 100 }
                        })}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {Math.round((config.briefs.withAbstractRatio || 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        With Thinking Process Ratio
                      </label>
                      <Tooltip content="Percentage of briefs that expose the AI's thinking process/reasoning." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        value={config.briefs.withThinkingRatio! * 100}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: { ...config.briefs!, withThinkingRatio: parseInt(e.target.value) / 100 }
                        })}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {Math.round((config.briefs.withThinkingRatio || 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="versionsEnabled"
                        checked={config.briefs.versionsEnabled}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: { ...config.briefs!, versionsEnabled: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="versionsEnabled" className="text-sm font-medium text-gray-700">
                        Enable Brief Versions
                      </label>
                      <Tooltip content="Create multiple versions of some briefs to simulate content updates and revisions." />
                    </div>
                    
                    {config.briefs.versionsEnabled && (
                      <div className="mt-2 ml-7">
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Max Versions per Brief
                          </label>
                          <Tooltip content="Maximum number of versions any single brief can have." />
                        </div>
                        <Input
                          type="number"
                          value={config.briefs.maxVersionsPerBrief}
                          onChange={(e) => setConfig({
                            ...config,
                            briefs: { ...config.briefs!, maxVersionsPerBrief: parseInt(e.target.value) || 1 }
                          })}
                          min="1"
                          max="10"
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}