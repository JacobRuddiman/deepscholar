'use client';

import { useReputation } from '@/hooks/mutations/useReputationMutations';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReputationProgressProps {
  userId?: string;
  className?: string;
  showDetails?: boolean;
}

const RANKS = [
  { minPoints: 0, name: 'Beginner', level: 1 },
  { minPoints: 50, name: 'Novice', level: 2 },
  { minPoints: 150, name: 'Contributor', level: 3 },
  { minPoints: 300, name: 'Regular', level: 4 },
  { minPoints: 500, name: 'Established', level: 5 },
  { minPoints: 800, name: 'Trusted', level: 6 },
  { minPoints: 1200, name: 'Expert', level: 7 },
  { minPoints: 1800, name: 'Master', level: 8 },
  { minPoints: 2500, name: 'Legend', level: 9 },
  { minPoints: 5000, name: 'Icon', level: 10 },
];

export function ReputationProgress({
  userId,
  className,
  showDetails = true,
}: ReputationProgressProps) {
  const { data: reputation } = useReputation(userId);

  if (!reputation) {
    return null;
  }

  // Find current and next rank
  const currentRankIndex = RANKS.findIndex((r) => r.level === reputation.level);
  const currentRank = RANKS[currentRankIndex]!;
  const nextRank = RANKS[currentRankIndex + 1];

  // Calculate progress
  const isMaxLevel = !nextRank;
  const pointsInCurrentLevel = reputation.points - currentRank.minPoints;
  const pointsNeededForNextLevel = nextRank
    ? nextRank.minPoints - currentRank.minPoints
    : 0;
  const progressPercentage = isMaxLevel
    ? 100
    : (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;
  const pointsToNextLevel = nextRank ? nextRank.minPoints - reputation.points : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current Level */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">
              {reputation.rank} - Level {reputation.level}
            </p>
            <p className="text-xs text-muted-foreground">
              {reputation.points.toLocaleString()} points
            </p>
          </div>
        </div>

        {!isMaxLevel && (
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">
              Next: {nextRank.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {pointsToNextLevel.toLocaleString()} pts to go
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!isMaxLevel && (
        <div className="space-y-1">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentRank.minPoints.toLocaleString()}</span>
            <span>{Math.round(progressPercentage)}%</span>
            <span>{nextRank.minPoints.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Max Level Message */}
      {isMaxLevel && (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <Target className="h-5 w-5 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-900">
            Maximum level reached! You're an Icon! 🎉
          </p>
        </div>
      )}

      {/* Activity Stats */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <StatItem
            label="Briefs Published"
            value={reputation.briefsPublished}
          />
          <StatItem
            label="Reviews Written"
            value={reputation.reviewsWritten}
          />
          <StatItem
            label="Upvotes Received"
            value={reputation.upvotesReceived}
          />
          <StatItem
            label="Helpful Reviews"
            value={reputation.helpfulReviews}
          />
          <StatItem
            label="Current Streak"
            value={`${reputation.currentStreak} days`}
          />
          <StatItem
            label="Longest Streak"
            value={`${reputation.longestStreak} days`}
          />
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

/**
 * Compact progress bar for cards
 */
export function CompactReputationProgress({ userId }: { userId?: string }) {
  const { data: reputation } = useReputation(userId);

  if (!reputation) return null;

  const currentRankIndex = RANKS.findIndex((r) => r.level === reputation.level);
  const currentRank = RANKS[currentRankIndex]!;
  const nextRank = RANKS[currentRankIndex + 1];

  if (!nextRank) {
    return (
      <div className="text-xs text-muted-foreground">
        Max level reached!
      </div>
    );
  }

  const pointsInCurrentLevel = reputation.points - currentRank.minPoints;
  const pointsNeededForNextLevel = nextRank.minPoints - currentRank.minPoints;
  const progressPercentage = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Level {reputation.level}
        </span>
        <span className="text-muted-foreground">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      <Progress value={progressPercentage} className="h-1.5" />
    </div>
  );
}
