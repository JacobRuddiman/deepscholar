'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Clock, Save, Plus, Upload, Edit3, Trash2, Eye, GitCompare } from 'lucide-react';
import WarningPopup from './warning_popup';
import TooltipWrapper from './TooltipWrapper';
import VersionComparison from './VersionComparison';

interface BriefVersion {
  id: string;
  versionNumber: number;
  changeLog?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDraft: boolean;
  isActive?: boolean;
  draftNumber?: number;
}

interface BriefVersionSelectorProps {
  briefId: string;
  currentVersion: BriefVersion;
  versions: BriefVersion[];
  onVersionChange: (versionId: string) => void;
  onSaveAsNewVersion: (changeLog: string) => void;
  onSaveDraft: () => void;
  onUpdateCurrent: () => void;
  onPushToVersion: () => void;
  onRenameVersion?: (versionId: string, newName: string) => void;
  onDeleteVersion?: (versionId: string) => void;
  onSetActiveVersion?: (versionId: string) => void;
  isOwner: boolean;
  hasUnsavedChanges: boolean;
}

const BriefVersionSelector: React.FC<BriefVersionSelectorProps> = ({
  briefId,
  currentVersion,
  versions,
  onVersionChange,
  onSaveAsNewVersion,
  onSaveDraft,
  onUpdateCurrent,
  onPushToVersion,
  onRenameVersion,
  onDeleteVersion,
  onSetActiveVersion,
  isOwner,
  hasUnsavedChanges,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [changeLog, setChangeLog] = useState('');
  
  // Warning popup state
  const [warningState, setWarningState] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    actions: {
      label: string;
      onClick: () => void;
      isPrimary?: boolean;
      isDangerous?: boolean;
    }[];
  }>({
    isVisible: false,
    title: '',
    message: '',
    actions: [],
  });

  // Group versions by version number and separate drafts
  const groupedVersions = React.useMemo(() => {
    const groups: Record<number, { version: BriefVersion | null; drafts: BriefVersion[] }> = {};
    
    versions.forEach(version => {
      if (!groups[version.versionNumber]) {
        groups[version.versionNumber] = { version: null, drafts: [] };
      }
      
      if (version.isDraft) {
        groups[version.versionNumber]?.drafts.push(version);
      } else {
        groups[version.versionNumber]!.version = version;
      }
    });

    // Sort drafts by most recent edit (updatedAt for drafts, newest first)
    Object.values(groups).forEach(group => {
      group.drafts.sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
        const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });
      // Add draft numbers
      group.drafts.forEach((draft, index) => {
        draft.draftNumber = group.drafts.length - index;
      });
    });

    return groups;
  }, [versions]);

  const handleVersionSelect = async (versionId: string) => {
    if (hasUnsavedChanges) {
      setWarningState({
        isVisible: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. What would you like to do?',
        actions: [
          {
            label: 'Cancel',
            onClick: () => setWarningState(prev => ({ ...prev, isVisible: false })),
          },
          {
            label: 'Do not save changes',
            onClick: () => {
              onVersionChange(versionId);
              setIsDropdownOpen(false);
              setWarningState(prev => ({ ...prev, isVisible: false }));
            },
          },
          {
            label: 'Save Draft',
            onClick: () => {
              onSaveDraft();
              onVersionChange(versionId);
              setIsDropdownOpen(false);
              setWarningState(prev => ({ ...prev, isVisible: false }));
            },
            isPrimary: true,
          },
        ],
      });
    } else {
      onVersionChange(versionId);
      setIsDropdownOpen(false);
    }
  };

  const handleSaveAsNewVersion = () => {
    if (!changeLog.trim()) {
      setWarningState({
        isVisible: true,
        title: 'Missing Description',
        message: 'Please provide a description of the changes made in this version.',
        actions: [
          {
            label: 'OK',
            onClick: () => setWarningState(prev => ({ ...prev, isVisible: false })),
            isPrimary: true,
          },
        ],
      });
      return;
    }
    
    onSaveAsNewVersion(changeLog);
    setChangeLog('');
    setIsNewVersionModalOpen(false);
  };

  const handleDeleteVersion = (versionId: string, isDraft: boolean) => {
    if (!onDeleteVersion) return;
    
    // Count published versions (not drafts)
    const publishedVersions = versions.filter(v => !v.isDraft);
    
    // If deleting the last published version, warn about entire brief deletion
    if (!isDraft && publishedVersions.length === 1) {
      setWarningState({
        isVisible: true,
        title: '⚠️ DELETE ENTIRE BRIEF',
        message: '🚨 CRITICAL WARNING: This is the last published version. Deleting it will PERMANENTLY DELETE the entire brief and ALL its drafts. This action CANNOT be undone and will remove the brief from the platform entirely.',
        actions: [
          {
            label: 'Cancel',
            onClick: () => setWarningState(prev => ({ ...prev, isVisible: false })),
          },
          {
            label: 'DELETE ENTIRE BRIEF',
            onClick: () => {
              onDeleteVersion(versionId);
              setIsDropdownOpen(false);
              setWarningState(prev => ({ ...prev, isVisible: false }));
            },
            isDangerous: true,
          },
        ],
      });
    } else {
      // Count drafts for this version if deleting a published version
      let message = `Are you sure you want to delete this ${isDraft ? 'draft' : 'version'}? This action cannot be undone.`;
      
      if (!isDraft) {
        // Find the version being deleted to get its version number
        const versionToDelete = versions.find(v => v.id === versionId);
        if (versionToDelete) {
          const draftsForThisVersion = versions.filter(v => 
            v.versionNumber === versionToDelete.versionNumber && v.isDraft
          );
          
          if (draftsForThisVersion.length > 0) {
            message = `Are you sure you want to delete this version? This will also delete ${draftsForThisVersion.length} associated draft${draftsForThisVersion.length > 1 ? 's' : ''}. This action cannot be undone.`;
          }
        }
      }
      
      setWarningState({
        isVisible: true,
        title: `Delete ${isDraft ? 'Draft' : 'Version'}`,
        message: message,
        actions: [
          {
            label: 'Cancel',
            onClick: () => setWarningState(prev => ({ ...prev, isVisible: false })),
          },
          {
            label: `Delete ${isDraft ? 'Draft' : 'Version'}`,
            onClick: () => {
              onDeleteVersion(versionId);
              setIsDropdownOpen(false);
              setWarningState(prev => ({ ...prev, isVisible: false }));
            },
            isDangerous: true,
          },
        ],
      });
    }
  };

  const handleSetActiveVersion = (versionId: string) => {
    if (!onSetActiveVersion) return;
    
    setWarningState({
      isVisible: true,
      title: 'Set Active Version',
      message: 'This will make this version the publicly visible version of the brief. Are you sure?',
      actions: [
        {
          label: 'Cancel',
          onClick: () => setWarningState(prev => ({ ...prev, isVisible: false })),
        },
        {
          label: 'Set as Active',
          onClick: () => {
            onSetActiveVersion(versionId);
            setIsDropdownOpen(false);
            setWarningState(prev => ({ ...prev, isVisible: false }));
          },
          isPrimary: true,
        },
      ],
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getVersionDisplayName = (version: BriefVersion) => {
    if (version.changeLog) {
      return version.changeLog;
    }
    return `Version ${version.versionNumber}`;
  };

  const getCurrentVersionDisplayName = () => {
    if (currentVersion.isDraft) {
      const parentVersion = versions.find(v => 
        v.versionNumber === currentVersion.versionNumber && !v.isDraft
      );
      const draftNumber = currentVersion.draftNumber ?? 1;
      return `${getVersionDisplayName(parentVersion ?? currentVersion)} - Draft ${draftNumber}`;
    }
    return getVersionDisplayName(currentVersion);
  };

  const activeVersion = versions.find(v => v.isActive && !v.isDraft);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border">
        {/* Version Dropdown */}
        <div className="relative">
          <TooltipWrapper 
            content="Select a different version or draft to edit"
            position="bottom"
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{getCurrentVersionDisplayName()}</span>
                {currentVersion.isDraft && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Draft
                  </span>
                )}
                {currentVersion.isActive && !currentVersion.isDraft && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </TooltipWrapper>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                {Object.entries(groupedVersions)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([versionNumber, group]) => (
                    <div key={versionNumber} className="mb-2">
                      {/* Published Version */}
                      {group.version && (
                        <div
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                            currentVersion.id === group.version.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div 
                            className="flex-1 flex items-center gap-2"
                            onClick={() => handleVersionSelect(group.version!.id)}
                          >
                            <span className="font-medium">
                              {getVersionDisplayName(group.version)}
                            </span>
                            {group.version.isActive && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Active
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(group.version.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Set Active Button */}
                            {!group.version.isActive && onSetActiveVersion && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetActiveVersion(group.version!.id);
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Set as active version"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {/* Delete Button */}
                            {onDeleteVersion && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVersion(group.version!.id, false);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete version"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Drafts */}
                      {group.drafts.map((draft) => (
                        <div
                          key={draft.id}
                          className={`flex items-center justify-between p-2 ml-4 rounded-md cursor-pointer transition-colors ${
                            currentVersion.id === draft.id
                              ? 'bg-yellow-50 border border-yellow-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div 
                            className="flex-1 flex items-center gap-2"
                            onClick={() => handleVersionSelect(draft.id)}
                          >
                            <span className="text-sm text-gray-600">
                              ↳ Draft {draft.draftNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(draft.updatedAt ?? draft.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Delete Button */}
                            {onDeleteVersion && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVersion(draft.id, true);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete draft"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Save to Current Button */}
          <TooltipWrapper 
            content={hasUnsavedChanges ? "Save changes to the current version or draft" : "No changes to save"}
            position="bottom"
          >
            <button
              onClick={onUpdateCurrent}
              disabled={!hasUnsavedChanges}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save to Current
            </button>
          </TooltipWrapper>

          {/* Push to Version Button - only for drafts */}
          {currentVersion.isDraft && (
            <TooltipWrapper 
              content="Apply draft changes to the published version and delete this draft"
              position="bottom"
            >
              <button
                onClick={onPushToVersion}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Push to Version
              </button>
            </TooltipWrapper>
          )}

          {/* Save Draft Button - always show but greyed out when disabled */}
          {!currentVersion.isDraft && (
            <TooltipWrapper 
              content={hasUnsavedChanges ? "Save changes as a new draft without affecting the published version" : "No changes to save as draft"}
              position="bottom"
            >
              <button
                onClick={onSaveDraft}
                disabled={!hasUnsavedChanges}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  hasUnsavedChanges 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                Save to new draft
              </button>
            </TooltipWrapper>
          )}

          {/* Save as New Version Button */}
          <TooltipWrapper 
            content={hasUnsavedChanges ? "Create a new published version with your changes" : "No changes to save as new version"}
            position="bottom"
          >
            <button
              onClick={() => setIsNewVersionModalOpen(true)}
              disabled={!hasUnsavedChanges}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Save as New Version
            </button>
          </TooltipWrapper>

          {/* Compare Versions Button */}
          <TooltipWrapper 
            content="Compare this version with other versions or drafts to see changes"
            position="bottom"
          >
            <button
              onClick={() => setIsComparisonOpen(true)}
              disabled={versions.length < 2}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                versions.length >= 2
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          </TooltipWrapper>
        </div>
      </div>

      {/* Active Version Indicator */}
      {activeVersion && (
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Currently Active:</span> {getVersionDisplayName(activeVersion)}
          {activeVersion.id !== currentVersion.id && (
            <span className="text-gray-500"> (not currently editing)</span>
          )}
        </div>
      )}

      {/* Version Comparison Modal */}
      <VersionComparison
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        versions={versions}
        currentVersionId={currentVersion.id}
      />

      {/* New Version Modal */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Version</h3>
            <div className="mb-4">
              <label htmlFor="changeLog" className="block text-sm font-medium text-gray-700 mb-2">
                Describe the changes made in this version:
              </label>
              <textarea
                id="changeLog"
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="e.g., Updated methodology section, added new references..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsNewVersionModalOpen(false);
                  setChangeLog('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsNewVersion}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Warning Popup */}
      <WarningPopup
        isVisible={warningState.isVisible}
        title={warningState.title}
        message={warningState.message}
        actions={warningState.actions}
        onClose={() => setWarningState(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default BriefVersionSelector;
