import React from 'react';
import { Users } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';
import { Input } from '@/app/components/ui/input';

export function DemoUserSection({ config, setConfig }: any) {
  return (
    <CollapsibleSection
      title="Demo User"
      icon={<Users className="w-5 h-5 text-purple-500" />}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="demoUserEnabled"
            checked={config.demoUser?.enabled}
            onChange={(e) => setConfig({
              ...config,
              demoUser: { ...config.demoUser!, enabled: e.target.checked }
            })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="demoUserEnabled" className="text-sm font-medium text-gray-700">
            Create Demo User
          </label>
          <Tooltip content="Creates a special demo user account for demonstration purposes with enhanced activity levels." />
        </div>

        {config.demoUser?.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Demo User Email
                </label>
                <Tooltip content="Email address for the demo user account." />
              </div>
              <Input
                type="email"
                value={config.demoUser.email}
                onChange={(e) => setConfig({
                  ...config,
                  demoUser: { ...config.demoUser!, email: e.target.value }
                })}
                placeholder="demo@deepscholar.local"
              />
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Demo User Name
                </label>
                <Tooltip content="Display name for the demo user." />
              </div>
              <Input
                type="text"
                value={config.demoUser.name}
                onChange={(e) => setConfig({
                  ...config,
                  demoUser: { ...config.demoUser!, name: e.target.value }
                })}
                placeholder="Demo User"
              />
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Activity Multiplier
                </label>
                <Tooltip content="How much more active the demo user is compared to average users (1.0 = normal, 3.0 = 3x more active)." />
              </div>
              <Input
                type="number"
                value={config.demoUser.activityMultiplier}
                onChange={(e) => setConfig({
                  ...config,
                  demoUser: { ...config.demoUser!, activityMultiplier: parseFloat(e.target.value) || 1.0 }
                })}
                min="1"
                max="10"
                step="0.1"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="demoUserAdmin"
                checked={config.demoUser.adminPrivileges}
                onChange={(e) => setConfig({
                  ...config,
                  demoUser: { ...config.demoUser!, adminPrivileges: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="demoUserAdmin" className="text-sm font-medium text-gray-700">
                Admin Privileges
              </label>
              <Tooltip content="Whether the demo user should have admin access." />
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}