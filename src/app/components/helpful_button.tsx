"use client";

import React, { useState } from 'react';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { markReviewHelpful, unmarkReviewHelpful } from '@/server/actions/tokens';

interface HelpfulButtonProps {
  reviewId: string;
  helpfulCount: number;
  isMarkedHelpful: boolean;
  onUpdate?: () => void;
  onError?: (error: string) => void;
}

export default function HelpfulButton({ 
  reviewId, 
  helpfulCount, 
  isMarkedHelpful, 
  onUpdate,
  onError
}: HelpfulButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localIsMarked, setLocalIsMarked] = useState(isMarkedHelpful);
  const [localCount, setLocalCount] = useState(helpfulCount);

  const handleToggleHelpful = async () => {
    try {
      setIsLoading(true);

      const result = localIsMarked 
        ? await unmarkReviewHelpful(reviewId)
        : await markReviewHelpful(reviewId);

      if (result.success) {
        setLocalIsMarked(!localIsMarked);
        setLocalCount(prev => localIsMarked ? prev - 1 : prev + 1);
        onUpdate?.();
      } else {
        onError?.(result.error ?? 'Failed to toggle helpful');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Error toggling helpful');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleHelpful}
      disabled={isLoading}
      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        localIsMarked
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <ThumbsUp className={`w-3 h-3 ${localIsMarked ? 'fill-current' : ''}`} />
      )}
      <span>Helpful ({localCount})</span>
    </button>
  );
}
