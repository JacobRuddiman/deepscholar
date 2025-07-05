import { prisma } from '@/lib/prisma';
import type { Brief, UserRecommendation } from '@prisma/client';

export interface RecommendationScore {
  briefId: string;
  score: number;
  reasons: string[];
  brief: Brief;
}

// Calculate recommendation score for a brief based on user preferences
export async function calculateRecommendationScore(userId: string, briefId: string): Promise<RecommendationScore | null> {
  try {
    const [userRecommendation, brief] = await Promise.all([
      prisma.userRecommendation.findUnique({ where: { userId } }),
      prisma.brief.findUnique({ 
        where: { id: briefId },
        include: {
          categories: true,
          reviews: true,
          upvotes: true,
          author: {
            select: { id: true, name: true }
          },
          model: {
            select: { name: true, provider: true }
          }
        }
      })
    ]);

    if (!brief) return null;

    let score = 0;
    const reasons: string[] = [];
    const maxScore = 100;

    // 1. Category matching (35% weight) - Enhanced algorithm
    if (userRecommendation?.topCombinedCategories) {
      try {
        let userCategories: { category: string; count: number }[];
        
        // Handle both JSON string and object formats
        if (typeof userRecommendation.topCombinedCategories === 'string') {
          userCategories = JSON.parse(userRecommendation.topCombinedCategories);
        } else {
          userCategories = userRecommendation.topCombinedCategories as { category: string; count: number }[];
        }
        
        const briefCategories = brief.categories.map(c => c.name);
        
        if (briefCategories.length > 0 && userCategories.length > 0) {
          // Find matching categories
          const matchingCategories = userCategories.filter(uc => 
            briefCategories.includes(uc.category)
          );
          
          if (matchingCategories.length > 0) {
            // Calculate match ratio (matches / total brief categories)
            const matchRatio = matchingCategories.length / briefCategories.length;
            
            // Calculate weighted score based on user's interest in those categories
            const totalUserInterest = userCategories.reduce((sum, cat) => sum + cat.count, 0);
            const matchedInterest = matchingCategories.reduce((sum, cat) => sum + cat.count, 0);
            const interestRatio = matchedInterest / totalUserInterest;
            
            // Combine match ratio and interest ratio for a strong category score
            const categoryScore = (matchRatio * 0.6 + interestRatio * 0.4) * 35; // 35% of total
            score += categoryScore;
            
            reasons.push(`Strong category match: ${matchingCategories.map(c => c.category).join(', ')} (${Math.round(matchRatio * 100)}% coverage)`);
          } else {
            // Small penalty for no category matches, but don't exclude completely
            score += 5; // Base score for any content
            reasons.push('General content recommendation');
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse user categories:', parseError);
        score += 10; // Base score if parsing fails
        reasons.push('General content recommendation');
      }
    } else {
      score += 10; // Base score for users without category data
      reasons.push('General content recommendation');
    }

    // 2. Author relationship (25% weight) - NEW
    if (userRecommendation?.topInteractedUsers) {
      try {
        let interactedUsers: { userId: string; name: string; interactionCount: number }[];
        
        if (typeof userRecommendation.topInteractedUsers === 'string') {
          interactedUsers = JSON.parse(userRecommendation.topInteractedUsers);
        } else {
          interactedUsers = userRecommendation.topInteractedUsers as { userId: string; name: string; interactionCount: number }[];
        }
        
        const authorInteraction = interactedUsers.find(user => user.userId === brief.userId);
        if (authorInteraction) {
          // High score for content from frequently interacted authors
          const authorScore = Math.min(25, (authorInteraction.interactionCount / 10) * 25);
          score += authorScore;
          reasons.push(`From frequently interacted author: ${brief.author.name || 'Unknown'} (${authorInteraction.interactionCount} interactions)`);
        }
      } catch (parseError) {
        console.warn('Failed to parse user interactions:', parseError);
      }
    }

    // 3. Quality rating (20% weight) - Enhanced
    if (brief.reviews && brief.reviews.length > 0) {
      const avgRating = brief.reviews.reduce((sum, review) => sum + review.rating, 0) / brief.reviews.length;
      const qualityScore = (avgRating / 5) * 20; // Scale to 20% max
      score += qualityScore;
      reasons.push(`High quality: ${avgRating.toFixed(1)}/5 rating (${brief.reviews.length} reviews)`);
    } else {
      // Small base score for unrated content
      score += 5;
    }

    // 4. Popularity (15% weight) - Enhanced
    const viewScore = Math.min(10, (brief.viewCount || 0) / 100); // Max 10 points for views
    const upvoteScore = Math.min(5, (brief.upvotes?.length || 0)); // Max 5 points for upvotes
    const popularityScore = viewScore + upvoteScore;
    score += popularityScore;
    
    if (popularityScore > 5) {
      reasons.push(`Popular content: ${brief.viewCount || 0} views, ${brief.upvotes?.length || 0} upvotes`);
    }

    // 5. Recency (5% weight) - Reduced weight
    const daysSinceCreation = (Date.now() - new Date(brief.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation <= 7) {
      const recencyScore = ((7 - daysSinceCreation) / 7) * 5; // Max 5 points for very recent
      score += recencyScore;
      reasons.push(`Recent publication: ${Math.round(daysSinceCreation)} days ago`);
    }

    // Ensure we have a good distribution of scores
    // Apply a curve to spread scores better
    let finalScore = score;
    
    // If score is very low, give it a small boost to avoid 0% scores
    if (finalScore < 20) {
      finalScore = 20 + (finalScore * 0.5);
    }
    
    // Apply a curve to make high scores more achievable
    finalScore = Math.pow(finalScore / 100, 0.7) * 100;
    
    // Ensure top scores can reach 90%+
    if (finalScore > 70) {
      finalScore = 70 + ((finalScore - 70) * 1.5);
    }

    return {
      briefId,
      score: Math.min(100, Math.max(15, finalScore)), // Minimum 15%, maximum 100%
      reasons,
      brief
    };
  } catch (error) {
    console.error('Error calculating recommendation score:', error);
    return null;
  }
}

// Get personalized recommendations for a user
export async function getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<RecommendationScore[]> {
  try {
    // Get all briefs
    const allBriefs = await prisma.brief.findMany({
      include: {
        categories: true,
        reviews: true,
        upvotes: true,
        model: {
          select: { name: true, provider: true }
        }
      }
    });

    // Calculate scores for all briefs
    const scores = await Promise.all(
      allBriefs.map(brief => calculateRecommendationScore(userId, brief.id))
    );

    // Filter out null scores and sort by score descending
    const validScores = scores.filter(score => score !== null) as RecommendationScore[];
    validScores.sort((a, b) => b.score - a.score);

    return validScores.slice(0, limit);
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
}

// Calculate recommendation scores for all briefs (for admin)
export async function calculateAllRecommendationScores(userId: string): Promise<RecommendationScore[]> {
  try {
    const allBriefs = await prisma.brief.findMany({
      include: {
        categories: true,
        reviews: true,
        upvotes: true,
        model: {
          select: { name: true, provider: true }
        }
      }
    });

    const scores = await Promise.all(
      allBriefs.map(brief => calculateRecommendationScore(userId, brief.id))
    );

    return scores.filter(score => score !== null) as RecommendationScore[];
  } catch (error) {
    console.error('Error calculating all recommendation scores:', error);
    return [];
  }
}
