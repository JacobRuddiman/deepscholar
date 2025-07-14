import React from 'react';
import { Trash2 } from 'lucide-react';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Tooltip } from '../components/Tooltip';

export function DeleteOptionsSection({ config, setConfig }: any) {
  return (
    <CollapsibleSection
      title="Delete Options"
      icon={<Trash2 className="w-5 h-5 text-red-500" />}
      defaultOpen={true}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="deleteAll"
            checked={config.deleteAll}
            onChange={(e) => setConfig({ ...config, deleteAll: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="deleteAll" className="text-sm font-medium text-gray-700">
            Delete all existing data before seeding
          </label>
          <Tooltip content="When enabled, all existing data will be removed before creating new synthetic data. This ensures a clean database state." />
        </div>
      </div>
    </CollapsibleSection>
  );
}