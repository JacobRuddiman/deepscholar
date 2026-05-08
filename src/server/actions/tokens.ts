'use server';

import { auth } from '@/server/auth';
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { isLocalAuth, LOCAL_USER } from '@/lib/localMode';

// Helper function to get user ID with LOCAL_AUTH mode support
async function getUserId() {
  if (isLocalAuth()) {
    return LOCAL_USER.id;
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }
    return session.user.id;
  }
}

// Get user's token balance
export async function getUserTokenBalance() {
  try {
    const userId = await getUserId();

    const userToken = await db.userToken.findUnique({
      where: { userId },
    });

    return {
      success: true,
      balance: userToken?.balance ?? 0,
    };
  } catch (error) {
    console.error('[Tokens] Failed to fetch user token balance:', String(error));
    return {
      success: false,
      error: 'Failed to fetch token balance',
      balance: 0,
    };
  }
}

// Initialize user token balance if it doesn't exist
export async function initializeUserTokens(userId: string) {
  try {
    await db.$transaction(async (tx) => {
      // Check if already initialized to avoid duplicate welcome bonuses
      const existing = await tx.userToken.findUnique({
        where: { userId },
      });

      if (existing) return; // Already initialized

      await tx.userToken.create({
        data: {
          userId,
          balance: 50, // Starting balance
        },
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: 50,
          reason: 'Welcome bonus',
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('[Tokens] initializing user tokens:', String(error));
    return { success: false, error: 'Failed to initialize tokens' };
  }
}

// Deduct tokens for an action
export async function deductTokens(amount: number, reason: string, briefId?: string, reviewId?: string) {
  try {
    const userId = await getUserId();
    
    // Use atomic operation to prevent race conditions
    const { atomicTokenOperation } = await import('@/lib/database');
    const result = await atomicTokenOperation(userId, 'deduct', amount, reason, briefId, reviewId);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Failed to deduct tokens',
        balance: result.newBalance ?? 0,
      };
    }

    return {
      success: true,
      balance: result.newBalance ?? 0,
    };
  } catch (error) {
    console.error('[Tokens]deducting tokens:', error);
    return {
      success: false,
      error: 'Failed to deduct tokens',
    };
  }
}

// Award tokens for an action
export async function awardTokens(amount: number, reason: string, briefId?: string, reviewId?: string, targetUserId?: string) {
  try {
    const userId = targetUserId ?? await getUserId();

    // Use atomic operation to prevent race conditions
    const { atomicTokenOperation } = await import('@/lib/database');
    const result = await atomicTokenOperation(userId, 'award', amount, reason, briefId, reviewId);

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Failed to award tokens',
        balance: result.newBalance ?? 0,
      };
    }

    return {
      success: true,
      balance: result.newBalance ?? 0,
    };
  } catch (error) {
    console.error('[Tokens] Failed to award tokens:', error);
    return {
      success: false,
      error: 'Failed to award tokens',
    };
  }
}

// Get user's token transaction history
export async function getUserTokenTransactions(limit = 20) {
  try {
    const userId = await getUserId();

    const transactions = await db.tokenTransaction.findMany({
      where: { userId },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: transactions,
    };
  } catch (error) {
    console.error('[Tokens]fetching token transactions:', error);
    return {
      success: false,
      error: 'Failed to fetch transactions',
      data: [],
    };
  }
}

// Get token packages
export async function getTokenPackages() {
  return [
    {
      id: 'starter',
      name: 'Starter Pack',
      tokens: 100,
      price: 4.99,
      description: 'Perfect for getting started',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      tokens: 250,
      price: 9.99,
      description: 'Great value for regular users',
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      tokens: 500,
      price: 17.99,
      description: 'Best value for power users',
      popular: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      tokens: 1000,
      price: 29.99,
      description: 'For heavy usage',
      popular: false,
    },
  ] as const;
}

// Get token costs
export async function getTokenCosts() {
  return {
    PUBLISH_BRIEF: 5,
    AI_REVIEW_REQUEST: 10,
  } as const;
}

// Get token rewards
export async function getTokenRewards() {
  return {
    WRITE_REVIEW: 3,
    GIVE_UPVOTE: 1,
    RECEIVE_UPVOTE: 1,
  } as const;
}

// Create a token purchase (for demo purposes, no actual payment processing)
export async function createTokenPurchase(packageId: string) {
  try {
    const userId = await getUserId();
    const tokenPackages = await getTokenPackages();
    
    const tokenPackage = tokenPackages.find(pkg => pkg.id === packageId);
    if (!tokenPackage) {
      return {
        success: false,
        error: 'Invalid package selected',
      };
    }

    // Create purchase record
    const purchase = await db.tokenPurchase.create({
      data: {
        userId,
        packageName: tokenPackage.name,
        tokensAmount: tokenPackage.tokens,
        priceUSD: tokenPackage.price,
        paymentMethod: 'demo',
        status: 'completed', // For demo purposes
      },
    });

    // Award tokens using atomic operation (includes transaction record creation)
    await awardTokens(
      tokenPackage.tokens,
      `Token purchase: ${tokenPackage.name}`,
      undefined,
      undefined,
      userId
    );

    revalidatePath('/tokens');
    revalidatePath('/profile');

    return {
      success: true,
      purchase,
      tokensAwarded: tokenPackage.tokens,
    };
  } catch (error) {
    console.error('[Tokens]creating token purchase:', error);
    return {
      success: false,
      error: 'Failed to process purchase',
    };
  }
}

// Get user's purchase history
export async function getUserPurchases() {
  try {
    const userId = await getUserId();

    const purchases = await db.tokenPurchase.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: purchases,
    };
  } catch (error) {
    console.error('[Tokens]fetching user purchases:', error);
    return {
      success: false,
      error: 'Failed to fetch purchases',
      data: [],
    };
  }
}

// Mark a review as helpful (with token reward)
export async function markReviewHelpful(reviewId: string) {
  try {
    const userId = await getUserId();
    const tokenRewards = await getTokenRewards();

    // Run check + create inside a transaction to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      const existingMark = await tx.reviewHelpful.findUnique({
        where: { reviewId_userId: { reviewId, userId } },
      });

      if (existingMark) {
        return { error: 'Already marked as helpful' } as const;
      }

      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: { userId: true, briefId: true },
      });

      if (!review) {
        return { error: 'Review not found' } as const;
      }

      if (review.userId === userId) {
        return { error: 'Cannot mark your own review as helpful' } as const;
      }

      await tx.reviewHelpful.create({
        data: { reviewId, userId },
      });

      return { briefId: review.briefId } as const;
    });

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    // Award token outside the transaction (uses its own atomic operation)
    await awardTokens(
      tokenRewards.GIVE_UPVOTE,
      'Marked review as helpful',
      result.briefId,
      reviewId
    );

    revalidatePath('/briefs/[id]', 'page');

    return { success: true };
  } catch (error) {
    console.error('[Tokens] marking review as helpful:', String(error));
    return { success: false, error: 'Failed to mark review as helpful' };
  }
}

// Unmark a review as helpful
export async function unmarkReviewHelpful(reviewId: string) {
  try {
    const userId = await getUserId();
    const tokenRewards = await getTokenRewards();

    // Run check + delete inside a transaction to prevent race conditions
    const deleted = await db.$transaction(async (tx) => {
      const existingMark = await tx.reviewHelpful.findUnique({
        where: { reviewId_userId: { reviewId, userId } },
      });

      if (!existingMark) {
        return false;
      }

      await tx.reviewHelpful.delete({
        where: { reviewId_userId: { reviewId, userId } },
      });

      return true;
    });

    if (!deleted) {
      return { success: false, error: 'Not marked as helpful' };
    }

    // Deduct token outside the transaction (uses its own atomic operation)
    await deductTokens(
      tokenRewards.GIVE_UPVOTE,
      'Unmarked review as helpful',
      undefined,
      reviewId
    );

    revalidatePath('/briefs/[id]', 'page');

    return { success: true };
  } catch (error) {
    console.error('[Tokens] unmarking review as helpful:', String(error));
    return { success: false, error: 'Failed to unmark review as helpful' };
  }
}
