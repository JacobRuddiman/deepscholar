// File: /server/actions/adminAnalytics.ts
'use server';

import { db } from "@/server/db";
import { z } from "zod";

// Define the time period schema for validation
const TimePeriodSchema = z.object({
  value: z.number().int().positive(),
  unit: z.enum(['hours', 'days', 'weeks', 'months', 'years']),
});

// Define the analytics request schema
const AnalyticsRequestSchema = z.object({
  period: TimePeriodSchema,
  filters: z.object({
    categories: z.array(z.string()).optional(),
    minRating: z.number().min(0).max(5).optional(),
    excludeUsers: z.array(z.string()).optional(),
    onlyPublished: z.boolean().optional(),
  }).optional(),
});

type TimePeriod = z.infer<typeof TimePeriodSchema>;
type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;

/**
 * Convert a time period to milliseconds
 */
function periodToMilliseconds(period: TimePeriod): number {
  const { value, unit } = period;
  
  switch (unit) {
    case 'hours': return value * 60 * 60 * 1000;
    case 'days': return value * 24 * 60 * 60 * 1000;
    case 'weeks': return value * 7 * 24 * 60 * 60 * 1000;
    case 'months': return value * 30 * 24 * 60 * 60 * 1000; // Approximation
    case 'years': return value * 365 * 24 * 60 * 60 * 1000; // Approximation
    default: return value * 24 * 60 * 60 * 1000; // Default to days
  }
}

/**
 * Generate time intervals for the specified period
 */
function generateTimeIntervals(period: TimePeriod, count = 10): Date[] {
  const now = new Date();
  const totalMs = periodToMilliseconds(period);
  const startDate = new Date(now.getTime() - totalMs);
  const intervals: Date[] = [];
  
  const intervalMs = totalMs / (count - 1);
  
  for (let i = 0; i < count; i++) {
    intervals.push(new Date(startDate.getTime() + i * intervalMs));
  }
  
  return intervals;
}

/**
 * Main function to get all analytics data
 */
export async function getAdminAnalytics(request: AnalyticsRequest) {
  try {
    // Validate request
    const validatedRequest = AnalyticsRequestSchema.parse(request);
    const { period, filters } = validatedRequest;
    
    // Calculate the start date based on the period
    const now = new Date();
    const startDate = new Date(now.getTime() - periodToMilliseconds(period));
    
    // Common where clause for time filtering
    const timeWhereClause = {
      createdAt: {
        gte: startDate,
      }
    };
    
    // Build additional filters
    const additionalFilters: any = {};
    
    if (filters?.onlyPublished) {
      additionalFilters.published = true;
    }
    
    if (filters?.minRating) {
      additionalFilters.averageRating = {
        gte: filters.minRating,
      };
    }
    
    if (filters?.excludeUsers && filters.excludeUsers.length > 0) {
      additionalFilters.userId = {
        notIn: filters.excludeUsers,
      };
    }
    
    if (filters?.categories && filters.categories.length > 0) {
      additionalFilters.categories = {
        some: {
          name: {
            in: filters.categories,
          }
        }
      };
    }
    
    // Execute all analytics queries in parallel
    const [
      userEngagementData,
      contentPerformanceData,
      tokenEconomicsData,
      reviewAnalyticsData,
      categoryTrendsData,
    ] = await Promise.all([
      getUserEngagementAnalytics(startDate, additionalFilters),
      getContentPerformanceAnalytics(startDate, additionalFilters),
      getTokenEconomicsAnalytics(startDate, additionalFilters),
      getReviewAnalyticsData(startDate, additionalFilters),
      getCategoryTrendsAnalytics(startDate, additionalFilters),
    ]);
    
    return {
      success: true,
      data: {
        userEngagement: userEngagementData,
        contentPerformance: contentPerformanceData,
        tokenEconomics: tokenEconomicsData,
        reviewAnalytics: reviewAnalyticsData,
        categoryTrends: categoryTrendsData,
        metadata: {
          period,
          generatedAt: new Date().toISOString(),
          dataPoints: generateTimeIntervals(period).map(d => d.toISOString()),
        }
      }
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid request parameters',
        validationErrors: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
    };
  }
}

/**
 * ANALYTIC 1: User Engagement Analytics
 * 
 * This analytic measures user engagement over time by tracking:
 * - New user registrations
 * - Active users (users who interacted with the platform)
 * - Brief views
 * - User retention cohorts
 */
async function getUserEngagementAnalytics(startDate: Date, additionalFilters: any) {
  try {
    // Get new user registrations over time
    const userRegistrations = await db.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });
    
    // Get user interactions over time
    const userInteractions = await db.user.groupBy({
      by: ['lastInteractionDate'],
      where: {
        lastInteractionDate: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });
    
    // Get brief views over time
    const briefViews = await db.briefView.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });
    
    // Calculate user retention cohorts
    // Group users by registration week and check if they were active in subsequent weeks
    const allUsers = await db.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        createdAt: true,
        lastInteractionDate: true,
      }
    });
    
    // Group users by cohort (week of registration)
    const cohorts = new Map<string, { total: number, retained: number }>();
    
    allUsers.forEach(user => {
      const cohortWeek = getWeekNumber(user.createdAt);
      const lastInteractionWeek = user.lastInteractionDate ? getWeekNumber(user.lastInteractionDate) : null;
      
      if (!cohorts.has(cohortWeek)) {
        cohorts.set(cohortWeek, { total: 0, retained: 0 });
      }
      
      const cohort = cohorts.get(cohortWeek)!;
      cohort.total++;
      
      // User is considered retained if they interacted in a later week
      if (lastInteractionWeek && lastInteractionWeek !== cohortWeek) {
        cohort.retained++;
      }
    });
    
    // Calculate retention rates
    const retentionData = Array.from(cohorts.entries()).map(([cohortWeek, data]) => ({
      cohort: cohortWeek,
      totalUsers: data.total,
      retainedUsers: data.retained,
      retentionRate: data.total > 0 ? (data.retained / data.total) * 100 : 0,
    }));
    
    // Calculate daily active users
    const dailyActiveUsers = await db.user.groupBy({
      by: ['lastInteractionDate'],
      where: {
        lastInteractionDate: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });
    
    const processedDailyActiveUsers = dailyActiveUsers.map(item => ({
      date: item.lastInteractionDate?.toISOString() || 'unknown',
      activeUsers: item._count.id,
    })).filter(item => item.date !== 'unknown');
    
    return {
      newUserRegistrations: processTimeSeriesData(userRegistrations, 'createdAt'),
      userInteractions: processTimeSeriesData(userInteractions, 'lastInteractionDate'),
      briefViews: processTimeSeriesData(briefViews, 'createdAt'),
      retentionCohorts: retentionData,
      dailyActiveUsers: processedDailyActiveUsers,
    };
  } catch (error) {
    console.error('Error in user engagement analytics:', error);
    return {
      error: 'Failed to process user engagement analytics',
      newUserRegistrations: [],
      userInteractions: [],
      briefViews: [],
      retentionCohorts: [],
      dailyActiveUsers: [],
    };
  }
}

/**
 * ANALYTIC 2: Content Performance Analytics
 * 
 * This analytic measures content performance metrics:
 * - Views per brief over time
 * - Upvotes per brief over time
 * - Engagement rate (views to upvotes ratio)
 * - Brief creation velocity
 * - Brief quality metrics (ratings)
 */
async function getContentPerformanceAnalytics(startDate: Date, additionalFilters: any) {
  try {
    // Get briefs created in the period
    const briefs = await db.brief.findMany({
      where: {
        createdAt: { gte: startDate },
        ...additionalFilters,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        viewCount: true,
        upvotes: {
          select: {
            createdAt: true,
          }
        },
        reviews: {
          select: {
            rating: true,
            createdAt: true,
          }
        },
      }
    });
    
    // Calculate brief creation velocity (briefs per day)
    const briefsByDay = new Map<string, number>();
    briefs.forEach(brief => {
      const day = brief.createdAt.toISOString().split('T')[0];
      briefsByDay.set(day, (briefsByDay.get(day) || 0) + 1);
    });
    
    const briefCreationVelocity = Array.from(briefsByDay.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));
    
    // Calculate average ratings over time
    const ratingsByDay = new Map<string, { sum: number, count: number }>();
    briefs.forEach(brief => {
      brief.reviews.forEach(review => {
        const day = review.createdAt.toISOString().split('T')[0];
        if (!ratingsByDay.has(day)) {
          ratingsByDay.set(day, { sum: 0, count: 0 });
        }
        const dayData = ratingsByDay.get(day)!;
        dayData.sum += review.rating;
        dayData.count++;
      });
    });
    
    const averageRatingsByDay = Array.from(ratingsByDay.entries())
      .map(([day, { sum, count }]) => ({ 
        day, 
        averageRating: count > 0 ? sum / count : null 
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
    
    // Calculate top performing briefs
    const topBriefs = [...briefs]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10)
      .map(brief => ({
        id: brief.id,
        title: brief.title,
        viewCount: brief.viewCount,
        upvoteCount: brief.upvotes.length,
        averageRating: brief.reviews.length > 0 
          ? brief.reviews.reduce((sum, r) => sum + r.rating, 0) / brief.reviews.length 
          : null,
        engagementRate: brief.viewCount > 0 
          ? (brief.upvotes.length / brief.viewCount) * 100 
          : 0,
      }));
    
    // Calculate engagement rates over time (upvotes/views)
    const upvotesByDay = new Map<string, number>();
    briefs.forEach(brief => {
      brief.upvotes.forEach(upvote => {
        const day = upvote.createdAt.toISOString().split('T')[0];
        upvotesByDay.set(day, (upvotesByDay.get(day) || 0) + 1);
      });
    });
    
    const viewsByDay = await db.briefView.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });
    
    const processedViewsByDay = viewsByDay.map(item => ({
      day: item.createdAt.toISOString().split('T')[0],
      count: item._count.id,
    }));
    
    // Combine views and upvotes to calculate engagement rate
    const engagementRateByDay = processedViewsByDay.map(viewItem => {
      const day = viewItem.day;
      const upvotes = upvotesByDay.get(day) || 0;
      const views = viewItem.count;
      
      return {
        day,
        views,
        upvotes,
        engagementRate: views > 0 ? (upvotes / views) * 100 : 0,
      };
    });
    
    return {
      briefCreationVelocity,
      averageRatingsByDay,
      topPerformingBriefs: topBriefs,
      engagementRateByDay,
      totalBriefs: briefs.length,
      totalViews: briefs.reduce((sum, brief) => sum + brief.viewCount, 0),
      totalUpvotes: briefs.reduce((sum, brief) => sum + brief.upvotes.length, 0),
    };
  } catch (error) {
    console.error('Error in content performance analytics:', error);
    return {
      error: 'Failed to process content performance analytics',
      briefCreationVelocity: [],
      averageRatingsByDay: [],
      topPerformingBriefs: [],
      engagementRateByDay: [],
      totalBriefs: 0,
      totalViews: 0,
      totalUpvotes: 0,
    };
  }
}

/**
 * ANALYTIC 3: Token Economics Analytics
 * 
 * This analytic tracks the token economy:
 * - Token purchases over time
 * - Token usage over time
 * - Token balance distribution
 * - Token transaction categories
 * - Revenue projections
 */
async function getTokenEconomicsAnalytics(startDate: Date, additionalFil: any) {
  try {
    // Get token purchases over time
    const tokenPurchases = await db.tokenPurchase.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'completed',
      },
      select: {
        tokensAmount: true,
        priceUSD: true,
        createdAt: true,
        paymentMethod: true,
      }
    });
    
    // Group purchases by day
    const purchasesByDay = new Map<string, { tokens: number, revenue: number, count: number }>();
    tokenPurchases.forEach(purchase => {
      const day = purchase.createdAt.toISOString().split('T')[0];
      if (!purchasesByDay.has(day)) {
        purchasesByDay.set(day, { tokens: 0, revenue: 0, count: 0 });
      }
      const dayData = purchasesByDay.get(day)!;
      dayData.tokens += purchase.tokensAmount;
      dayData.revenue += purchase.priceUSD;
      dayData.count++;
    });
    
    const processedPurchasesByDay = Array.from(purchasesByDay.entries())
      .map(([day, data]) => ({
        day,
        tokensAmount: data.tokens,
        revenue: data.revenue,
        purchaseCount: data.count,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
    
    // Get token usage over time
    const tokenUsage = await db.tokenTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
        amount: { lt: 0 }, // Negative amount = usage
      },
      select: {
        amount: true,
        reason: true,
        createdAt: true,
      }
    });
    
    // Group usage by day and reason
    const usageByDay = new Map<string, Map<string, number>>();
    tokenUsage.forEach(transaction => {
      const day = transaction.createdAt.toISOString().split('T')[0];
      if (!usageByDay.has(day)) {
        usageByDay.set(day, new Map<string, number>());
      }
      const dayData = usageByDay.get(day)!;
      const reason = transaction.reason;
      dayData.set(reason, (dayData.get(reason) || 0) + Math.abs(transaction.amount));
    });
    
    const processedUsageByDay = Array.from(usageByDay.entries())
      .map(([day, reasonMap]) => {
        const reasonData: Record<string, number> = {};
        reasonMap.forEach((amount, reason) => {
          reasonData[reason] = amount;
        });
        
        return {
          day,
          totalUsage: Array.from(reasonMap.values()).reduce((sum, val) => sum + val, 0),
          usageByReason: reasonData,
        };
      })
      .sort((a, b) => a.day.localeCompare(b.day));
    
    // Get token balance distribution
    const userTokenBalances = await db.userToken.findMany({
      select: {
        balance: true,
      }
    });
    
    // Create balance distribution buckets
    const balanceBuckets = {
      '0': 0,
      '1-10': 0,
      '11-50': 0,
      '51-100': 0,
      '101-500': 0,
      '501-1000': 0,
      '1000+': 0,
    };
    
    userTokenBalances.forEach(({ balance }) => {
      if (balance === 0) balanceBuckets['0']++;
      else if (balance <= 10) balanceBuckets['1-10']++;
      else if (balance <= 50) balanceBuckets['11-50']++;
      else if (balance <= 100) balanceBuckets['51-100']++;
      else if (balance <= 500) balanceBuckets['101-500']++;
      else if (balance <= 1000) balanceBuckets['501-1000']++;
      else balanceBuckets['1000+']++;
    });
    
    // Calculate token transaction categories
    const transactionCategories = await db.tokenTransaction.groupBy({
      by: ['reason'],
      where: {
        createdAt: { gte: startDate },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      }
    });
    
    const processedTransactionCategories = transactionCategories.map(category => ({
      reason: category.reason,
      totalAmount: category._sum.amount || 0,
      transactionCount: category._count.id,
    }));
    
    const totalRevenue = tokenPurchases.reduce((sum, purchase) => sum + purchase.priceUSD, 0);
const daysInPeriod = Math.max(1, (new Date().getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
const averageDailyRevenue = totalRevenue / daysInPeriod;

// Apply some dampening for long-term projections to avoid overestimating
const revenueProjection = {
  next30Days: averageDailyRevenue * 30,
  next90Days: averageDailyRevenue * 90 * 0.9, // 10% dampening for 90-day projection
  next365Days: averageDailyRevenue * 365 * 0.8, // 20% dampening for yearly projection
};
    
    return {
      tokenPurchasesByDay: processedPurchasesByDay,
      tokenUsageByDay: processedUsageByDay,
      tokenBalanceDistribution: balanceBuckets,
      transactionCategories: processedTransactionCategories,
      revenueProjection,
      totalRevenue,
      totalTokensPurchased: tokenPurchases.reduce((sum, purchase) => sum + purchase.tokensAmount, 0),
      totalTokensUsed: tokenUsage.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    };
  } catch (error) {
    console.error('Error in token economics analytics:', error);
    return {
      error: 'Failed to process token economics analytics',
      tokenPurchasesByDay: [],
      tokenUsageByDay: [],
      tokenBalanceDistribution: {},
      transactionCategories: [],
      revenueProjection: { next30Days: 0, next90Days: 0, next365Days: 0 },
      totalRevenue: 0,
      totalTokensPurchased: 0,
      totalTokensUsed: 0,
    };
  }
}

/**
 * ANALYTIC 4: Review Analytics
 * 
 * This analytic analyzes review patterns:
 * - Review sentiment over time
 * - Rating distribution
 * - User vs AI review comparison
 * - Review helpfulness metrics
 * - Review upvote patterns
 */
async function getReviewAnalyticsData(startDate: Date, additionalFilters: any) {
  try {
    // Get user reviews in the period
    const userReviews = await db.review.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        upvotes: { select: { id: true } },
        helpfulMarks: { select: { id: true } },
        briefId: true,
      }
    });
    
    // Get AI reviews in the period
    const aiReviews = await db.aIReview.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        helpfulCount: true,
        briefId: true,
      }
    });
    
    // Rating distribution
    const userRatingDistribution = [0, 0, 0, 0, 0]; // 1-5 stars
    userReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        userRatingDistribution[review.rating - 1]++;
      }
    });
    
    const aiRatingDistribution = [0, 0, 0, 0, 0]; // 1-5 stars
    aiReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        aiRatingDistribution[review.rating - 1]++;
      }
    });
    
    // Reviews over time
    const userReviewsByDay = new Map<string, { count: number, sumRating: number }>();
    userReviews.forEach(review => {
      const day = review.createdAt.toISOString().split('T')[0];
      if (!userReviewsByDay.has(day)) {
        userReviewsByDay.set(day, { count: 0, sumRating: 0 });
      }
      const dayData = userReviewsByDay.get(day)!;
      dayData.count++;
      dayData.sumRating += review.rating;
    });
    
    const aiReviewsByDay = new Map<string, { count: number, sumRating: number }>();
    aiReviews.forEach(review => {
      const day = review.createdAt.toISOString().split('T')[0];
      if (!aiReviewsByDay.has(day)) {
        aiReviewsByDay.set(day, { count: 0, sumRating: 0 });
      }
      const dayData = aiReviewsByDay.get(day)!;
      dayData.count++;
      dayData.sumRating += review.rating;
    });
    
    // Process review trends over time
    const reviewTrends = new Set([...userReviewsByDay.keys(), ...aiReviewsByDay.keys()]);
    const processedReviewTrends = Array.from(reviewTrends)
      .map(day => {
        const userDayData = userReviewsByDay.get(day) || { count: 0, sumRating: 0 };
        const aiDayData = aiReviewsByDay.get(day) || { count: 0, sumRating: 0 };
        
        return {
          day,
          userReviewCount: userDayData.count,
          userAverageRating: userDayData.count > 0 ? userDayData.sumRating / userDayData.count : null,
          aiReviewCount: aiDayData.count,
          aiAverageRating: aiDayData.count > 0 ? aiDayData.sumRating / aiDayData.count : null,
        };
      })
      .sort((a, b) => a.day.localeCompare(b.day));
    
    // Review helpfulness metrics
    const userHelpfulnessMetrics = userReviews.map(review => ({
      id: review.id,
      helpfulCount: review.helpfulMarks.length,
      upvoteCount: review.upvotes.length,
      helpfulnessRatio: review.helpfulMarks.length / (review.helpfulMarks.length + 1), // Avoid division by zero
    }));
    
    const aiHelpfulnessMetrics = aiReviews.map(review => ({
      id: review.id,
      helpfulCount: review.helpfulCount,
      helpfulnessRatio: review.helpfulCount / (review.helpfulCount + 1), // Avoid division by zero
    }));
    
    // Comparison between user and AI reviews
    const userAverageRating = userReviews.length > 0 
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length 
      : 0;
      
    const aiAverageRating = aiReviews.length > 0 
      ? aiReviews.reduce((sum, r) => sum + r.rating, 0) / aiReviews.length 
      : 0;
    
    // Review correlation - do briefs with more user reviews also get more AI reviews?
    const briefReviewCounts = new Map<string, { userReviews: number, aiReviews: number }>();
    
    userReviews.forEach(review => {
      if (!briefReviewCounts.has(review.briefId)) {
        briefReviewCounts.set(review.briefId, { userReviews: 0, aiReviews: 0 });
      }
      briefReviewCounts.get(review.briefId)!.userReviews++;
    });
    
    aiReviews.forEach(review => {
      if (!briefReviewCounts.has(review.briefId)) {
        briefReviewCounts.set(review.briefId, { userReviews: 0, aiReviews: 0 });
      }
      briefReviewCounts.get(review.briefId)!.aiReviews++;
    });
    
    const reviewCorrelationData = Array.from(briefReviewCounts.values());
    
    return {
      userRatingDistribution,
      aiRatingDistribution,
      reviewTrends: processedReviewTrends,
      userHelpfulnessMetrics: userHelpfulnessMetrics.sort((a, b) => b.helpfulnessRatio - a.helpfulnessRatio).slice(0, 10),
      aiHelpfulnessMetrics: aiHelpfulnessMetrics.sort((a, b) => b.helpfulnessRatio - a.helpfulnessRatio).slice(0, 10),
      comparison: {
        userReviewCount: userReviews.length,
        aiReviewCount: aiReviews.length,
        userAverageRating,
        aiAverageRating,
        ratingDifference: userAverageRating - aiAverageRating,
      },
      reviewCorrelationData,
    };
  } catch (error) {
    console.error('Error in review analytics:', error);
    return {
      error: 'Failed to process review analytics',
      userRatingDistribution: [0, 0, 0, 0, 0],
      aiRatingDistribution: [0, 0, 0, 0, 0],
      reviewTrends: [],
      userHelpfulnessMetrics: [],
      aiHelpfulnessMetrics: [],
      comparison: {
        userReviewCount: 0,
        aiReviewCount: 0,
        userAverageRating: 0,
        aiAverageRating: 0,
        ratingDifference: 0,
      },
      reviewCorrelationData: [],
    };
  }
}

/**
 * ANALYTIC 5: Category Trends Analytics
 * 
 * This analytic tracks category popularity and trends:
 * - Category distribution over time
 * - Category performance metrics
 * - Category correlations
 * - Emerging categories
 * - Category user preferences
 */
async function getCategoryTrendsAnalytics(startDate: Date, additionalFilters: any) {
  try {
    // Get briefs with their categories
    const briefs = await db.brief.findMany({
      where: {
        createdAt: { gte: startDate },
        ...additionalFilters,
      },
      select: {
        id: true,
        createdAt: true,
        viewCount: true,
        categories: {
          select: {
            id: true,
            name: true,
          }
        },
        upvotes: {
          select: {
            id: true,
          }
        },
        reviews: {
          select: {
            rating: true,
          }
        },
      }
    });
    
    // Count categories
    const categoryStats = new Map<string, {
      id: string;
      name: string;
      briefCount: number;
      viewCount: number;
      upvoteCount: number;
      ratings: number[];
      briefsByDay: Map<string,  number>;
    }>();
    
    briefs.forEach(brief => {
      brief.categories.forEach(category => {
        if (!categoryStats.has(category.id)) {
          categoryStats.set(category.id, {
            id: category.id,
            name: category.name,
            briefCount: 0,
            viewCount: 0,
            upvoteCount: 0,
            ratings: [],
            briefsByDay: new Map<string, number>(),
          });
        }
        
        const stats = categoryStats.get(category.id)!;
        stats.briefCount++;
        stats.viewCount += brief.viewCount;
        stats.upvoteCount += brief.upvotes.length;
        brief.reviews.forEach(review => stats.ratings.push(review.rating));
        
        const day = brief.createdAt.toISOString().split('T')[0];
        stats.briefsByDay.set(day, (stats.briefsByDay.get(day) || 0) + 1);
      });
    });
    
    // Process category stats
    const processedCategoryStats = Array.from(categoryStats.values()).map(stats => {
      const averageRating = stats.ratings.length > 0 
        ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length 
        : null;
      
      const engagementRate = stats.viewCount > 0 
        ? (stats.upvoteCount / stats.viewCount) * 100 
        : 0;
      
      const trendByDay = Array.from(stats.briefsByDay.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day));
      
      return {
        id: stats.id,
        name: stats.name,
        briefCount: stats.briefCount,
        viewCount: stats.viewCount,
        upvoteCount: stats.upvoteCount,
        averageRating,
        engagementRate,
        trendByDay,
      };
    });
    
    // Sort categories by brief count
    const sortedCategories = [...processedCategoryStats].sort((a, b) => b.briefCount - a.briefCount);
    
    // Find emerging categories (highest growth rate)
    const categoryGrowth = processedCategoryStats.map(category => {
      const trendData = category.trendByDay;
      
      if (trendData.length < 2) {
        return {
          id: category.id,
          name: category.name,
          growthRate: 0,
        };
      }
      
      // Split trend data into two halves to compare growth
      const midpoint = Math.floor(trendData.length / 2);
      const firstHalf = trendData.slice(0, midpoint);
      const secondHalf = trendData.slice(midpoint);
      
      const firstHalfCount = firstHalf.reduce((sum, day) => sum + day.count, 0);
      const secondHalfCount = secondHalf.reduce((sum, day) => sum + day.count, 0);
      
      const growthRate = firstHalfCount > 0 
        ? ((secondHalfCount - firstHalfCount) / firstHalfCount) * 100 
        : secondHalfCount > 0 ? 100 : 0;
      
      return {
        id: category.id,
        name: category.name,
        growthRate,
      };
    });
    
    const emergingCategories = [...categoryGrowth]
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 5);
    
    // Find category correlations (categories that often appear together)
    const categoryCorrelations: Array<{ category1: string, category2: string, count: number }> = [];
    
    briefs.forEach(brief => {
      const categories = brief.categories;
      
      for (let i = 0; i < categories.length; i++) {
        for (let j = i + 1; j < categories.length; j++) {
          const cat1 = categories[i].name;
          const cat2 = categories[j].name;
          
          // Ensure consistent ordering of category pairs
          const [catA, catB] = [cat1, cat2].sort();
          
          const existingCorrelation = categoryCorrelations.find(
            c => c.category1 === catA && c.category2 === catB
          );
          
          if (existingCorrelation) {
            existingCorrelation.count++;
          } else {
            categoryCorrelations.push({
              category1: catA,
              category2: catB,
              count: 1,
            });
          }
        }
      }
    });
    
    const topCorrelations = [...categoryCorrelations]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      categoryStats: sortedCategories,
      emergingCategories,
      categoryCorrelations: topCorrelations,
      totalCategories: categoryStats.size,
      mostPopularCategory: sortedCategories[0] || null,
      fastestGrowingCategory: emergingCategories[0] || null,
    };
  } catch (error) {
    console.error('Error in category trends analytics:', error);
    return {
      error: 'Failed to process category trends analytics',
      categoryStats: [],
      emergingCategories: [],
      categoryCorrelations: [],
      totalCategories: 0,
      mostPopularCategory: null,
      fastestGrowingCategory: null,
    };
  }
}

/**
 * Helper function to process time series data
 */
function processTimeSeriesData(data: any[], dateField: string) {
  const processedData = data.map(item => {
    const date = item[dateField]?.toISOString() || 'unknown';
    return {
      date,
      count: item._count?.id || 0,
    };
  }).filter(item => item.date !== 'unknown');
  
  return processedData.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Helper function to get week number from date
 */
function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}   