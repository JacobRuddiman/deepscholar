'use client';

import { useFollowUser, useUnfollowUser, useIsFollowing } from '@/hooks/mutations/useFollowMutations';
import { useSession } from 'next-auth/react';

interface FollowButtonProps {
  userId: string;
  userName?: string;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

export function FollowButton({ userId, userName, variant = 'default', className = '' }: FollowButtonProps) {
  const { data: session } = useSession();
  const { data: isFollowing, isLoading: isCheckingFollow } = useIsFollowing(userId);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  // Don't show follow button for own profile
  if (session?.user?.id === userId) {
    return null;
  }

  // Don't show if not signed in
  if (!session) {
    return null;
  }

  const handleFollow = async () => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  const isLoading = isCheckingFollow || followMutation.isPending || unfollowMutation.isPending;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isFollowing
            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${className}`}
        aria-label={isFollowing ? `Unfollow ${userName || 'user'}` : `Follow ${userName || 'user'}`}
        aria-pressed={isFollowing}
      >
        <svg className="w-5 h-5" fill={isFollowing ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
          {isFollowing && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4"
            />
          )}
        </svg>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } ${className}`}
        aria-label={isFollowing ? `Unfollow ${userName || 'user'}` : `Follow ${userName || 'user'}`}
        aria-pressed={isFollowing}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
          </span>
        ) : (
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${className}`}
      aria-label={isFollowing ? `Unfollow ${userName || 'user'}` : `Follow ${userName || 'user'}`}
      aria-pressed={isFollowing}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill={isFollowing ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isFollowing
                  ? 'M5 13l4 4L19 7'
                  : 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
              }
            />
          </svg>
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        </span>
      )}
    </button>
  );
}

/**
 * Display follow count badge
 */
export function FollowCountBadge({ userId, type }: { userId: string; type: 'followers' | 'following' }) {
  const { data: counts } = useFollowCounts(userId);

  if (!counts) return null;

  const count = type === 'followers' ? counts.followers : counts.following;
  const label = type === 'followers' ? 'Followers' : 'Following';

  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {count.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}

/**
 * Suggested users widget
 */
export function SuggestedUsersWidget({ limit = 5 }: { limit?: number }) {
  const { data: suggestedUsers, isLoading } = useSuggestedUsers(limit);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Suggested Users
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestedUsers || suggestedUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Suggested Users
      </h3>
      <div className="space-y-3">
        {suggestedUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {user.name || 'Anonymous'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {user._count.briefs} {user._count.briefs === 1 ? 'brief' : 'briefs'}
              </div>
            </div>
            <FollowButton userId={user.id} userName={user.name || undefined} variant="compact" />
          </div>
        ))}
      </div>
    </div>
  );
}
