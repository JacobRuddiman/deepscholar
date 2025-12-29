'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/mutations/useReputationMutations';
import { Loader2, Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardProps {
  limit?: number;
  className?: string;
}

const RANK_ICONS: Record<number, JSX.Element> = {
  1: <Trophy className="h-5 w-5 text-yellow-500" />,
  2: <Medal className="h-5 w-5 text-gray-400" />,
  3: <Medal className="h-5 w-5 text-orange-600" />,
};

export function Leaderboard({ limit = 10, className }: LeaderboardProps) {
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const { data: leaders, isLoading } = useLeaderboard({ limit, timeframe });

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top contributors in the community</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="space-y-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !leaders || leaders.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaders.map((leader, index) => {
                  const position = index + 1;
                  const user =
                    timeframe === 'all'
                      ? (leader as any).user
                      : (leader as any).user;
                  const reputation =
                    timeframe === 'all'
                      ? leader
                      : (leader as any).reputation;
                  const points =
                    timeframe === 'all'
                      ? (leader as any).points
                      : (leader as any).points;

                  return (
                    <Link
                      key={timeframe === 'all' ? (leader as any).userId : (leader as any).userId}
                      href={`/profile/${user?.id}`}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent',
                        position <= 3 && 'bg-gradient-to-r',
                        position === 1 && 'from-yellow-50 to-orange-50 border-yellow-200',
                        position === 2 && 'from-gray-50 to-slate-50 border-gray-200',
                        position === 3 && 'from-orange-50 to-red-50 border-orange-200'
                      )}
                    >
                      {/* Position */}
                      <div className="flex-shrink-0 w-8 text-center">
                        {RANK_ICONS[position] || (
                          <span className="text-sm font-semibold text-muted-foreground">
                            #{position}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                        <AvatarFallback>
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {user?.name || 'Anonymous'}
                        </p>
                        {reputation && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{reputation.rank}</span>
                            <span>•</span>
                            <span>Level {reputation.level}</span>
                          </div>
                        )}
                      </div>

                      {/* Points */}
                      <div className="flex items-center gap-1 text-right">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">
                          {points?.toLocaleString() || 0}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Mini leaderboard for dashboard/sidebar
 */
export function MiniLeaderboard({ limit = 5 }: { limit?: number }) {
  const { data: leaders, isLoading } = useLeaderboard({ limit, timeframe: 'all' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!leaders || leaders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {leaders.slice(0, limit).map((leader, index) => {
        const position = index + 1;
        const user = (leader as any).user;

        return (
          <Link
            key={(leader as any).userId}
            href={`/profile/${user?.id}`}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
          >
            <span className="text-xs font-semibold text-muted-foreground w-4">
              {position}
            </span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs flex-1 truncate">{user?.name || 'Anonymous'}</p>
            <span className="text-xs font-medium text-muted-foreground">
              {(leader as any).points?.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
