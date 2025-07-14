//admin/seeding/components/DatabaseSafetyModal.tsx
'use client';

import React from 'react';
import { AlertTriangle, X, Database, Users, FileText, MessageSquare, CreditCard, Tag, Link, Mail } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { DatabaseSafetyCheck } from '@/server/actions/seed';

interface DatabaseSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  safetyCheck: DatabaseSafetyCheck;
}

export interface DatabaseSafetyCheck {
  isSafe: boolean;
  nonSeedData: {
    type: string;
    count: number;
    examples: string[];
    confidence: 'high' | 'medium' | 'low'; // Confidence level
  }[];
  totalNonSeedRecords: number;
  warnings: string[];
  seedingMetadata?: {
    lastSeedDate?: Date;
    seedVersion?: string;
    totalSeedRecords?: number;
  };
}

const getIconForDataType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'users': return <Users className="w-4 h-4" />;
    case 'briefs': return <FileText className="w-4 h-4" />;
    case 'reviews': return <MessageSquare className="w-4 h-4" />;
    case 'categories': return <Tag className="w-4 h-4" />;
    case 'sources': return <Link className="w-4 h-4" />;
    case 'token purchases': return <CreditCard className="w-4 h-4" />;
    case 'email footers': return <Mail className="w-4 h-4" />;
    default: return <Database className="w-4 h-4" />;
  }
};

export function DatabaseSafetyModal({ isOpen, onClose, onContinue, safetyCheck }: DatabaseSafetyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-red-900">Database Safety Warning</h2>
              <p className="text-sm text-red-700">Non-seed data detected in database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">
                  {safetyCheck.totalNonSeedRecords} non-seed records found
                </h3>
                <p className="text-sm text-yellow-800">
                  The database contains data that doesn't appear to be from previous seeding operations. 
                  Proceeding will permanently delete this data.
                </p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {safetyCheck.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">⚠️ Additional Warnings:</h4>
              <ul className="space-y-1">
                {safetyCheck.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Categories */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">📊 Data Categories Found:</h4>
            <div className="space-y-3">
              {safetyCheck.nonSeedData.map((data, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getIconForDataType(data.type)}
                      <span className="font-medium text-gray-900">{data.type}</span>
                    </div>
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      {data.count} records
                    </span>
                  </div>
                  {data.examples.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Examples:</p>
                      <ul className="space-y-1">
                        {data.examples.map((example, idx) => (
                          <li key={idx} className="text-sm text-gray-800 bg-gray-50 px-2 py-1 rounded">
                            {example}
                          </li>
                        ))}
                      </ul>
                      {data.count > data.examples.length && (
                        <p className="text-xs text-gray-500 mt-1">
                          ...and {data.count - data.examples.length} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🛡️ Safety Recommendations:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Verify this is not a production database</li>
              <li>• Create a backup before proceeding if this data is important</li>
              <li>• Consider using a dedicated development/testing database</li>
              <li>• Review the examples above to confirm they are safe to delete</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          
          <Button
            onClick={onContinue}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Continue anyway (Delete all data)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}