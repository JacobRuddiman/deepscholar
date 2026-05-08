'use client';

import { useState } from 'react';
import { useReputationHistory } from '@/hooks/mutations/useReputationMutations';
import { Loader2, TrendingUp, TrendingDown, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { EmptyStates } from '@/components/empty-states/EmptyState';

interface HistoryEntry {
  id: string;
  action: string;
  points: number;
  reason?: string;
  createdAt: string;
}

interface ReputationHistoryProps {
  userId?: string;
  limit?: number;
  className?: string;
}

const ACTION_LABELS: Record<string, string> = {
  BRIEF_PUBLISHED: 'Published a brief',
  BRIEF_UPVOTE_RECEIVED: 'Received upvote',
  REVIEW_WRITTEN: 'Wrote a review',
  REVIEW_HELPFUL: 'Review marked helpful',
  FOLLOWER_GAINED: 'Gained a follower',
  BRIEF_FEATURED: 'Brief featured',
  DAILY_LOGIN: 'Daily login',
};

export function ReputationHistory({
  userId,
  limit = 20,
  className,
}: ReputationHistoryProps) {
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useReputationHistory(userId, { limit, offset });

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNext = () => {
    if (data?.hasMore) {
      setOffset(offset + limit);
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Reputation History
        </CardTitle>
        <CardDescription>Track your points earned over time</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.history.length === 0 ? (
          <EmptyStates.NoHistory />
        ) : (
          <div className="space-y-4">
            {/* History List */}
            <div className="space-y-2">
              {data.history.map((entry: HistoryEntry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 p-2 rounded-full',
                    entry.points > 0 ? 'bg-green-100' : 'bg-red-100'
                  )}>
                    {entry.points > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {ACTION_LABELS[entry.action] || entry.action}
                        </p>
                        {entry.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {entry.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(entry.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* Points */}
                      <div className={cn(
                        'text-sm font-semibold',
                        entry.points > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {entry.points > 0 ? '+' : ''}{entry.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {(offset > 0 || data.hasMore) && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={offset === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Showing {offset + 1} - {offset + data.history.length} of {data.total}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!data.hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact history for user profiles
 */
export function CompactReputationHistory({ userId, limit = 5 }: { userId?: string; limit?: number }) {
  const { data, isLoading } = useReputationHistory(userId, { limit });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.history.length === 0) {
    return <EmptyStates.NoHistory />;
  }

  return (
    <div className="space-y-2">
      {data.history.map((entry: HistoryEntry) => (
        <div key={entry.id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {entry.points > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
            )}
            <span className="truncate text-muted-foreground">
              {ACTION_LABELS[entry.action] || entry.action}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn(
              'font-medium',
              entry.points > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {entry.points > 0 ? '+' : ''}{entry.points}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
