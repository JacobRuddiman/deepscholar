'use client';

import { use, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDraftById } from '@/server/actions/briefs/drafts';
import {
  useUpdateDraft,
  useAutoSaveDraft,
  usePublishDraft,
  useDeleteDraft,
} from '@/hooks/mutations/useDraftMutations';
import { BriefCardSkeleton } from '@/components/skeletons/BriefCardSkeleton';
import { EmptyStates } from '@/components/empty-states/EmptyState';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DraftEditorPageProps {
  params: Promise<{ id: string }>;
}

export default function DraftEditorPage({ params }: DraftEditorPageProps) {
  const { id: draftId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const { data: draft, isLoading, error } = useQuery({
    queryKey: ['draft', draftId],
    queryFn: async () => {
      const result = await getDraftById(draftId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch draft');
      }
      return result.data;
    },
  });

  const updateDraft = useUpdateDraft(draftId);
  const { autoSave, isAutoSaving } = useAutoSaveDraft(draftId);
  const publishDraft = usePublishDraft();
  const deleteDraft = useDeleteDraft();

  // Initialize form when draft is loaded
  useEffect(() => {
    if (draft) {
      setTitle(draft.title || '');
      setAbstract(draft.abstract || '');
      setPrompt(draft.prompt || '');
      setResponse(draft.response || '');
    }
  }, [draft]);

  // Auto-save on changes
  useEffect(() => {
    if (!draft) return;

    const hasChanges =
      title !== draft.title ||
      abstract !== draft.abstract ||
      prompt !== draft.prompt ||
      response !== draft.response;

    if (hasChanges) {
      autoSave({ title, abstract, prompt, response });
    }
  }, [title, abstract, prompt, response, draft, autoSave]);

  const handlePublish = async () => {
    if (!title || !prompt || !response) {
      alert('Please fill in title, prompt, and response before publishing.');
      return;
    }

    // Save current changes first
    await updateDraft.mutateAsync({ title, abstract, prompt, response });

    // Then publish
    publishDraft.mutate(draftId);
  };

  const handleDelete = async () => {
    const confirmed = confirm('Are you sure you want to delete this draft? This action cannot be undone.');
    if (confirmed) {
      deleteDraft.mutate(draftId);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BriefCardSkeleton />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EmptyStates.Error
          message={error instanceof Error ? error.message : 'Failed to load draft'}
        />
      </div>
    );
  }

  const lastUpdated = formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard/drafts"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400
                   hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to Drafts</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isAutoSaving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              <span>Saved {lastUpdated}</span>
            )}
          </div>

          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50
                     dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Delete
          </button>

          <button
            onClick={handlePublish}
            disabled={publishDraft.isPending || !title || !prompt || !response}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {publishDraft.isPending ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter brief title..."
            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600
                     rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                     transition-all"
          />
        </div>

        {/* Abstract */}
        <div>
          <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Abstract (Optional)
          </label>
          <textarea
            id="abstract"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="Brief summary or abstract..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                     rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                     resize-y transition-all"
          />
        </div>

        {/* Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the prompt you used..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                     rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     font-mono text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                     resize-y transition-all"
          />
        </div>

        {/* Response */}
        <div>
          <label htmlFor="response" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Response <span className="text-red-500">*</span>
          </label>
          <textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="AI-generated response..."
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                     rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                     resize-y transition-all"
          />
        </div>

        {/* Categories */}
        {draft.categories && draft.categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {draft.categories.map((category: any) => (
                <span
                  key={category.id}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900
                           text-blue-700 dark:text-blue-300 rounded-full"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Model Info */}
        {draft.model && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>AI Model: {draft.model.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Publishing Instructions */}
      {(!title || !prompt || !response) && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200
                      dark:border-yellow-800 rounded-lg">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Complete required fields to publish
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Title, Prompt, and Response are required before you can publish this draft.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
