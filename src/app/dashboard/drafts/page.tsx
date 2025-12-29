'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserDrafts } from '@/server/actions/briefs/drafts';
import { useCreateDraft, useDeleteDraft } from '@/hooks/mutations/useDraftMutations';
import { BriefCardSkeleton } from '@/components/skeletons/BriefCardSkeleton';
import { EmptyStates } from '@/components/empty-states/EmptyState';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import {
  BulkSelectProvider,
  useBulkSelect,
  BulkSelectCheckbox,
  BulkSelectAllCheckbox,
  BulkActionsToolbar,
} from '@/components/bulk/BulkSelectProvider';
import {
  useBulkDeleteBriefs,
  useBulkPublishDrafts,
} from '@/hooks/mutations/useBulkMutations';

export default function DraftsPage() {
  return (
    <BulkSelectProvider>
      <DraftsContent />
    </BulkSelectProvider>
  );
}

function DraftsContent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const result = await getUserDrafts();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch drafts');
      }
      return result.data;
    },
  });

  const createDraft = useCreateDraft();
  const deleteDraft = useDeleteDraft();
  const { isOpen: isDeleteDialogOpen, confirm: confirmDelete, handleConfirm, handleCancel } = useConfirmDialog();
  const { selectedIds, clearSelection } = useBulkSelect();
  const bulkDelete = useBulkDeleteBriefs();
  const bulkPublish = useBulkPublishDrafts();

  const handleNewDraft = () => {
    createDraft.mutate({
      title: 'Untitled Draft',
      prompt: '',
      response: '',
    });
  };

  const handleDelete = async (draftId: string) => {
    const confirmed = await confirmDelete();
    if (confirmed) {
      deleteDraft.mutate(draftId);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} drafts? This action cannot be undone.`)) {
      return;
    }

    try {
      await bulkDelete.mutateAsync(selectedIds);
      clearSelection();
      await refetch();
    } catch (error) {
      console.error('[Drafts] Bulk delete failed:', error);
    }
  };

  const handleBulkPublish = async () => {
    if (!confirm(`Are you sure you want to publish ${selectedIds.length} drafts?`)) {
      return;
    }

    try {
      await bulkPublish.mutateAsync(selectedIds);
      clearSelection();
      await refetch();
    } catch (error) {
      console.error('[Drafts] Bulk publish failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Drafts</h1>
        </div>
        <div className="space-y-6">
          <BriefCardSkeleton />
          <BriefCardSkeleton />
          <BriefCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <EmptyStates.Error message={error instanceof Error ? error.message : 'Failed to load drafts'} />
      </div>
    );
  }

  const drafts = data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {drafts.length > 0 && (
            <BulkSelectAllCheckbox allIds={drafts.map((d) => d.id)} />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Drafts</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
            </p>
          </div>
        </div>

        <button
          onClick={handleNewDraft}
          disabled={createDraft.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createDraft.isPending ? 'Creating...' : '+ New Draft'}
        </button>
      </div>

      {/* Drafts List */}
      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No drafts yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new draft.
          </p>
          <button
            onClick={handleNewDraft}
            disabled={createDraft.isPending}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Your First Draft
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {drafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        onDelete={handleBulkDelete}
        onPublish={handleBulkPublish}
      />
    </div>
  );
}

function DraftCard({ draft, onDelete }: { draft: any; onDelete: (id: string) => void }) {
  const lastUpdated = formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div onClick={(e) => e.stopPropagation()}>
          <BulkSelectCheckbox id={draft.id} />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/dashboard/drafts/${draft.id}`} className="group">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white
                         group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {draft.title}
            </h2>
          </Link>

          {draft.abstract && (
            <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">
              {draft.abstract}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Updated {lastUpdated}</span>
            </div>

            {draft.categories && draft.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {draft.categories.map((category: any) => (
                  <span
                    key={category.id}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900
                             text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            {draft.model && (
              <div className="flex items-center gap-1 text-xs">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6h6V7z" />
                  <path
                    fillRule="evenodd"
                    d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{draft.model.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Link
            href={`/dashboard/drafts/${draft.id}`}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600
                     dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700
                     rounded-lg transition-colors"
            title="Edit draft"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>

          <button
            onClick={() => onDelete(draft.id)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600
                     dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700
                     rounded-lg transition-colors"
            title="Delete draft"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
