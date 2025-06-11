// Utility functions for profile image handling

const DEFAULT_AVATARS = [
  '/images/default_profiles/avatar1.svg',
  '/images/default_profiles/avatar2.svg', 
  '/images/default_profiles/avatar3.svg',
  '/images/default_profiles/avatar4.svg',
  '/images/default_profiles/avatar5.svg'
];

/**
 * Get a default profile image based on user ID or email
 * This ensures the same user always gets the same default avatar
 */
export function getDefaultProfileImage(userId?: string | null, email?: string | null): string {
  const identifier = userId ?? email ?? 'default';
  // Simple hash function to get consistent avatar for same user
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % DEFAULT_AVATARS.length;
  return DEFAULT_AVATARS[index] ?? DEFAULT_AVATARS[0] ?? '/placeholder-avatar.svg';
}

/**
 * Get profile image with fallback to default
 */
export function getProfileImageSrc(userImage?: string | null, userId?: string | null, email?: string | null): string {
  if (userImage) {
    return userImage;
  }
  return getDefaultProfileImage(userId, email);
}

/**
 * Profile image component props for consistent styling
 */
export const profileImageClasses = {
  small: "w-8 h-8 rounded-full object-cover object-center",
  medium: "w-12 h-12 rounded-full object-cover object-center", 
  large: "w-16 h-16 rounded-full object-cover object-center",
  xlarge: "w-24 h-24 rounded-full object-cover object-center"
};
