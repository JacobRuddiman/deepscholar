'use client';

import { useUserBadges } from '@/hooks/mutations/useReputationMutations';
import { Loader2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserBadge {
  id: string;
  earnedAt: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    category: string;
  };
}

interface BadgeDisplayProps {
  userId?: string;
  limit?: number;
  showAll?: boolean;
  className?: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-100 text-gray-700 border-gray-300',
  uncommon: 'bg-green-100 text-green-700 border-green-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

export function BadgeDisplay({
  userId,
  limit,
  showAll = false,
  className,
}: BadgeDisplayProps) {
  const { data: userBadges, isLoading } = useUserBadges(userId);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading badges...</span>
      </div>
    );
  }

  if (!userBadges || userBadges.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No badges earned yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Keep contributing to earn badges!
        </p>
      </div>
    );
  }

  const displayedBadges = limit && !showAll ? userBadges.slice(0, limit) : userBadges;
  const remainingCount = limit && userBadges.length > limit ? userBadges.length - limit : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {displayedBadges.map((userBadge: UserBadge) => {
          const badge = userBadge.badge;
          const rarityColor = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

          return (
            <TooltipProvider key={userBadge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg border-2 cursor-help transition-transform hover:scale-105',
                      rarityColor
                    )}
                  >
                    {/* Icon */}
                    <div className="text-3xl mb-2">{badge.icon}</div>

                    {/* Name */}
                    <p className="text-xs font-semibold text-center line-clamp-2">
                      {badge.name}
                    </p>

                    {/* Rarity */}
                    <p className="text-[10px] uppercase tracking-wide mt-1 opacity-70">
                      {badge.rarity}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Earned: {new Date(userBadge.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Remaining Count */}
      {remainingCount > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            +{remainingCount} more {remainingCount === 1 ? 'badge' : 'badges'}
          </p>
        </div>
      )}

      {/* Badge Count */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Award className="h-4 w-4" />
        <span>
          {userBadges.length} {userBadges.length === 1 ? 'badge' : 'badges'} earned
        </span>
      </div>
    </div>
  );
}

/**
 * Compact badge list for user profiles
 */
export function CompactBadgeList({ userId, limit = 3 }: { userId?: string; limit?: number }) {
  const { data: userBadges } = useUserBadges(userId);

  if (!userBadges || userBadges.length === 0) {
    return null;
  }

  const displayedBadges = userBadges.slice(0, limit);
  const remainingCount = userBadges.length > limit ? userBadges.length - limit : 0;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayedBadges.map((userBadge: UserBadge) => (
        <TooltipProvider key={userBadge.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xl cursor-help hover:scale-125 transition-transform">
                {userBadge.badge.icon}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p className="font-semibold">{userBadge.badge.name}</p>
                <p className="text-xs text-muted-foreground">
                  {userBadge.badge.description}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
