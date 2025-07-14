import React from 'react';
import { Users } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';
import { Input } from '@/app/components/ui/input';

export function UsersSection({ config, setConfig, showAdvanced }: any) {
  return (
    <CollapsibleSection
      title="Users"
      icon={<Users className="w-5 h-5 text-blue-500" />}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="usersEnabled"
            checked={config.users?.enabled}
            onChange={(e) => setConfig({
              ...config,
              users: { ...config.users!, enabled: e.target.checked }
            })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="usersEnabled" className="text-sm font-medium text-gray-700">
            Generate Users
          </label>
          <Tooltip content="Create synthetic user accounts with profiles, authentication data, and preferences." />
        </div>

        {config.users?.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Number of Users
                </label>
                <Tooltip content="Total number of user accounts to create. More users allow for more realistic interaction patterns." />
              </div>
              <Input
                type="number"
                value={config.users.count}
                onChange={(e) => setConfig({
                  ...config,
                  users: { ...config.users!, count: parseInt(e.target.value) || 0 }
                })}
                min="1"
                max="10000"
              />
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Admin Ratio
                </label>
                <Tooltip content="Percentage of users who will have admin privileges. Typically 5-10% in most systems." />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  value={config.users.adminRatio! * 100}
                  onChange={(e) => setConfig({
                    ...config,
                    users: { ...config.users!, adminRatio: parseInt(e.target.value) / 100 }
                  })}
                  min="0"
                  max="100"
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {Math.round((config.users.adminRatio || 0) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email Verified Ratio
                </label>
                <Tooltip content="Percentage of users who have verified their email addresses. Higher ratios indicate more engaged users." />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  value={config.users.emailVerifiedRatio! * 100}
                  onChange={(e) => setConfig({
                    ...config,
                    users: { ...config.users!, emailVerifiedRatio: parseInt(e.target.value) / 100 }
                  })}
                  min="0"
                  max="100"
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {Math.round((config.users.emailVerifiedRatio || 0) * 100)}%
                </span>
              </div>
            </div>

            {showAdvanced && (
              <>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Settings</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">Email Notifications</label>
                        <Tooltip content="Percentage of users who have email notifications enabled." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          value={config.users.notificationSettings?.emailNotificationsRatio! * 100}
                          onChange={(e) => setConfig({
                            ...config,
                            users: {
                              ...config.users!,
                              notificationSettings: {
                                ...config.users!.notificationSettings!,
                                emailNotificationsRatio: parseInt(e.target.value) / 100
                              }
                            }
                          })}
                          min="0"
                          max="100"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {Math.round((config.users.notificationSettings?.emailNotificationsRatio || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">Brief Interest Updates</label>
                        <Tooltip content="Percentage of users subscribed to brief interest update notifications." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          value={config.users.notificationSettings?.briefInterestUpdatesRatio! * 100}
                          onChange={(e) => setConfig({
                            ...config,
                            users: {
                              ...config.users!,
                              notificationSettings: {
                                ...config.users!.notificationSettings!,
                                briefInterestUpdatesRatio: parseInt(e.target.value) / 100
                              }
                            }
                          })}
                          min="0"
                          max="100"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {Math.round((config.users.notificationSettings?.briefInterestUpdatesRatio || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">Promotional Notifications</label>
                        <Tooltip content="Percentage of users who opted in to promotional emails." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          value={config.users.notificationSettings?.promotionalNotificationsRatio! * 100}
                          onChange={(e) => setConfig({
                            ...config,
                            users: {
                              ...config.users!,
                              notificationSettings: {
                                ...config.users!.notificationSettings!,
                                promotionalNotificationsRatio: parseInt(e.target.value) / 100
                              }
                            }
                          })}
                          min="0"
                          max="100"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {Math.round((config.users.notificationSettings?.promotionalNotificationsRatio || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}