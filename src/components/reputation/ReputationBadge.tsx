'use client';

import { useReputation } from '@/hooks/mutations/useReputationMutations';
import { Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReputationBadgeProps {
  userId?: string;
  showPoints?: boolean;
  showLevel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RANK_COLORS: Record<string, string> = {
  Beginner: 'text-gray-500 bg-gray-100',
  Novice: 'text-blue-600 bg-blue-100',
  Contributor: 'text-green-600 bg-green-100',
  Regular: 'text-cyan-600 bg-cyan-100',
  Established: 'text-purple-600 bg-purple-100',
  Trusted: 'text-indigo-600 bg-indigo-100',
  Expert: 'text-yellow-600 bg-yellow-100',
  Master: 'text-orange-600 bg-orange-100',
  Legend: 'text-red-600 bg-red-100',
  Icon: 'text-pink-600 bg-pink-100 font-bold',
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function ReputationBadge({
  userId,
  showPoints = true,
  showLevel = true,
  className,
  size = 'md',
}: ReputationBadgeProps) {
  const { data: reputation, isLoading } = useReputation(userId);

  if (isLoading) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!reputation) {
    return null;
  }

  const rankColor = RANK_COLORS[reputation.rank] || RANK_COLORS.Beginner;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Rank Badge */}
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          rankColor,
          SIZE_CLASSES[size]
        )}
      >
        <TrendingUp className={cn('h-3 w-3', size === 'lg' && 'h-4 w-4')} />
        {reputation.rank}
        {showLevel && (
          <span className="ml-0.5 opacity-75">
            Lv.{reputation.level}
          </span>
        )}
      </span>

      {/* Points */}
      {showPoints && (
        <span className="text-sm text-muted-foreground">
          {reputation.points.toLocaleString()} pts
        </span>
      )}
    </div>
  );
}

/**
 * Compact reputation display for user profiles
 */
export function CompactReputationBadge({ userId }: { userId?: string }) {
  const { data: reputation } = useReputation(userId);

  if (!reputation) return null;

  const rankColor = RANK_COLORS[reputation.rank] || RANK_COLORS.Beginner;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full', rankColor)}>
        <TrendingUp className="h-3 w-3" />
        <span className="font-medium">{reputation.rank}</span>
      </div>
      <span className="text-muted-foreground">
        {reputation.points.toLocaleString()} pts
      </span>
    </div>
  );
}
