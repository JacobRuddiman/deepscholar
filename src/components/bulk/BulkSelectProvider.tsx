'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BulkSelectContextType {
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
}

const BulkSelectContext = createContext<BulkSelectContextType | undefined>(undefined);

export function useBulkSelect() {
  const context = useContext(BulkSelectContext);
  if (!context) {
    throw new Error('useBulkSelect must be used within BulkSelectProvider');
  }
  return context;
}

export function BulkSelectProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isSelected = (id: string) => {
    return selectedIds.includes(id);
  };

  const value: BulkSelectContextType = {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.length,
  };

  return (
    <BulkSelectContext.Provider value={value}>
      {children}
    </BulkSelectContext.Provider>
  );
}

/**
 * Checkbox for selecting individual items
 */
export function BulkSelectCheckbox({ id, className = '' }: { id: string; className?: string }) {
  const { isSelected, toggleSelection } = useBulkSelect();
  const selected = isSelected(id);

  return (
    <input
      type="checkbox"
      checked={selected}
      onChange={() => toggleSelection(id)}
      className={`w-5 h-5 rounded border-gray-300 dark:border-gray-600
                 text-blue-600 focus:ring-2 focus:ring-blue-500
                 cursor-pointer ${className}`}
      onClick={(e) => e.stopPropagation()}
      aria-label={selected ? 'Deselect item' : 'Select item'}
      aria-checked={selected}
    />
  );
}

/**
 * Select all checkbox (for header)
 */
export function BulkSelectAllCheckbox({
  allIds,
  className = '',
}: {
  allIds: string[];
  className?: string;
}) {
  const { selectedIds, selectAll, clearSelection } = useBulkSelect();

  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleToggle = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(allIds);
    }
  };

  return (
    <input
      type="checkbox"
      checked={allSelected}
      ref={(el) => {
        if (el) el.indeterminate = someSelected;
      }}
      onChange={handleToggle}
      className={`w-5 h-5 rounded border-gray-300 dark:border-gray-600
                 text-blue-600 focus:ring-2 focus:ring-blue-500
                 cursor-pointer ${className}`}
      aria-label={
        allSelected
          ? 'Deselect all items'
          : someSelected
          ? 'Select all items (some selected)'
          : 'Select all items'
      }
      aria-checked={someSelected ? 'mixed' : allSelected}
    />
  );
}

/**
 * Bulk actions toolbar
 */
export function BulkActionsToolbar({
  onDelete,
  onPublish,
  onMakePublic,
  onMakePrivate,
  onExport,
  onAddCategories,
}: {
  onDelete?: () => void;
  onPublish?: () => void;
  onMakePublic?: () => void;
  onMakePrivate?: () => void;
  onExport?: () => void;
  onAddCategories?: () => void;
}) {
  const { selectedCount, clearSelection } = useBulkSelect();

  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50
                  animate-slide-up"
      role="toolbar"
      aria-label="Bulk actions toolbar"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200
                    dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            aria-live="polite"
            aria-atomic="true"
          >
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{selectedCount} selected</span>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" role="separator" aria-hidden="true" />

          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
                         transition-colors flex items-center gap-2"
                aria-label={`Export ${selectedCount} selected items`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export
              </button>
            )}

            {onPublish && (
              <button
                onClick={onPublish}
                className="px-3 py-2 text-sm text-green-700 dark:text-green-400
                         hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg
                         transition-colors flex items-center gap-2"
                aria-label={`Publish ${selectedCount} selected drafts`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Publish
              </button>
            )}

            {onMakePublic && (
              <button
                onClick={onMakePublic}
                className="px-3 py-2 text-sm text-blue-700 dark:text-blue-400
                         hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg
                         transition-colors flex items-center gap-2"
                aria-label={`Make ${selectedCount} selected items public`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Public
              </button>
            )}

            {onMakePrivate && (
              <button
                onClick={onMakePrivate}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
                         transition-colors flex items-center gap-2"
                aria-label={`Make ${selectedCount} selected items private`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
                Private
              </button>
            )}

            {onAddCategories && (
              <button
                onClick={onAddCategories}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
                         transition-colors flex items-center gap-2"
                aria-label={`Add categories to ${selectedCount} selected items`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Categories
              </button>
            )}

            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-2 text-sm text-red-700 dark:text-red-400
                         hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg
                         transition-colors flex items-center gap-2"
                aria-label={`Delete ${selectedCount} selected items`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" role="separator" aria-hidden="true" />

          <button
            onClick={clearSelection}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label={`Clear selection of ${selectedCount} items`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
