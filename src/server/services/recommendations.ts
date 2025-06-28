import { db } from '@/server/db';
import { setRecalcProgress, clearRecalcProgress } from '@/server/actions/admin';



// Common words to exclude from title analysis
const COMMON_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'the', 'this', 'these', 'those',
  'what', 'when', 'where', 'which', 'who', 'why', 'how', 'can',
  'could', 'would', 'should', 'may', 'might', 'must', 'shall',
  'will', 'do', 'does', 'did', 'have', 'has', 'had', 'been'
]);

interface WordCount {
  word: string;
  count: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface UserInteraction {
  userId: string;
  name: string;
  interactionCount: number;
}

interface DomainCount {
  domain: string;
  count: number;
}

export class RecommendationService {
  private static progressCallbacks = new Map<string, (progress: number) => void>();
  
  static setProgressCallback(userId: string, callback: (progress: number) => void) {
    this.progressCallbacks.set(userId, callback);
  }
  
  static removeProgressCallback(userId: string) {
    this.progressCallbacks.delete(userId);
  }
  
  private static updateProgress(userId: string, progress: number) {
    const callback = this.progressCallbacks.get(userId);
    if (callback) {
      callback(progress);
    }
  }
  
  static async calculateUserRecommendations(userId: string) {
    try {
      this.updateProgress(userId, 0);
      
      // Fetch all user data needed for recommendations
      this.updateProgress(userId, 10);
      const userData = await db.user.findUnique({
        where: { id: userId },
        include: {
          briefs: {
            include: {
              categories: true,
              sources: true,
              reviews: true,
              upvotes: true,
            }
          },
          reviews: {
            include: {
              brief: {
                include: {
                  categories: true,
                  author: true
                }
              }
            }
          },
          briefUpvotes: {
            include: {
              brief: {
                include: {
                  categories: true,
                  author: true
                }
              }
            }
          },
          savedBriefs: {
            include: {
              brief: {
                include: {
                  categories: true,
                  author: true
                }
              }
            }
          },
          briefViews: {
            include: {
              brief: {
                include: {
                  categories: true,
                  author: true
                }
              }
            }
          }
        }
      });

      if (!userData) {
        throw new Error('User not found');
      }

      this.updateProgress(userId, 25);
      
      // Calculate category preferences
      const createdCategories = this.calculateCategoryFrequency(
        userData.briefs.flatMap(b => b.categories)
      );
      
      this.updateProgress(userId, 35);
      
      const interactedBriefs = [
        ...userData.reviews.map(r => r.brief),
        ...userData.briefUpvotes.map(u => u.brief),
        ...userData.savedBriefs.map(s => s.brief),
        ...userData.briefViews.map(v => v.brief)
      ];
      
      const interactedCategories = this.calculateCategoryFrequency(
        interactedBriefs.flatMap(b => b.categories)
      );
      
      const combinedCategories = this.combineCategoryFrequencies(
        createdCategories,
        interactedCategories
      );

      this.updateProgress(userId, 50);

      // Calculate title word frequencies
      const createdTitleWords = this.calculateTitleWordFrequency(
        userData.briefs.map(b => b.title)
      );
      
      const interactedTitleWords = this.calculateTitleWordFrequency(
        interactedBriefs.map(b => b.title)
      );
      
      const combinedTitleWords = this.combineWordFrequencies(
        createdTitleWords,
        interactedTitleWords
      );

      this.updateProgress(userId, 65);

      // Calculate interaction counts
      const totalBriefsCreated = userData.briefs.length;
      const totalReviews = userData.reviews.length;
      const totalUpvotes = userData.briefUpvotes.length;
      const totalSaves = userData.savedBriefs.length;
      const totalViews = userData.briefViews.length;
      
      const totalReviewsReceived = userData.briefs.reduce(
        (sum, brief) => sum + brief.reviews.length, 0
      );
      const totalUpvotesReceived = userData.briefs.reduce(
        (sum, brief) => sum + brief.upvotes.length, 0
      );

      this.updateProgress(userId, 75);

      // Calculate top interacted users
      const userInteractions = this.calculateUserInteractions(userData);

      // Calculate citation domains
      const citationDomains = this.calculateCitationDomains(userData.briefs);

      this.updateProgress(userId, 85);

      // Calculate additional metrics
      const engagementScore = this.calculateEngagementScore(userData);
      const contentQualityScore = this.calculateContentQualityScore(userData.briefs);

      this.updateProgress(userId, 95);

      // Get or create recommendation record
      const recommendation = await db.userRecommendation.upsert({
        where: { userId },
        create: {
          userId,
          topCreatedCategories: createdCategories.slice(0, 10),
          topInteractedCategories: interactedCategories.slice(0, 10),
          topCombinedCategories: combinedCategories.slice(0, 10),
          topCreatedTitleWords: createdTitleWords.slice(0, 20),
          topInteractedTitleWords: interactedTitleWords.slice(0, 20),
          topCombinedTitleWords: combinedTitleWords.slice(0, 20),
          totalBriefsCreated,
          totalReviews,
          totalUpvotes,
          totalSaves,
          totalViews,
          totalReviewsReceived,
          totalUpvotesReceived,
          searchKeywords: [],
          lastSearchQueries: [],
          topInteractedUsers: userInteractions.slice(0, 10),
          topCitationDomains: citationDomains.slice(0, 10),
          engagementScore,
          contentQualityScore,
          lastCalculated: new Date()
        },
        update: {
          topCreatedCategories: createdCategories.slice(0, 10),
          topInteractedCategories: interactedCategories.slice(0, 10),
          topCombinedCategories: combinedCategories.slice(0, 10),
          topCreatedTitleWords: createdTitleWords.slice(0, 20),
          topInteractedTitleWords: interactedTitleWords.slice(0, 20),
          topCombinedTitleWords: combinedTitleWords.slice(0, 20),
          totalBriefsCreated,
          totalReviews,
          totalUpvotes,
          totalSaves,
          totalViews,
          totalReviewsReceived,
          totalUpvotesReceived,
          topInteractedUsers: userInteractions.slice(0, 10),
          topCitationDomains: citationDomains.slice(0, 10),
          engagementScore,
          contentQualityScore,
          lastCalculated: new Date()
        }
      });

      this.updateProgress(userId, 100);
      
      // Clean up callback
      setTimeout(() => {
        this.removeProgressCallback(userId);
      }, 1000);

      return recommendation;
      
    } catch (error) {
      this.removeProgressCallback(userId);
      console.error('Error calculating recommendations:', error);
      throw error;
    }
  }

  private static calculateCategoryFrequency(categories: any[]): CategoryCount[] {
    const frequency = new Map<string, number>();
    
    categories.forEach(cat => {
      const count = frequency.get(cat.name) || 0;
      frequency.set(cat.name, count + 1);
    });

    return Array.from(frequency.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  private static combineCategoryFrequencies(
    created: CategoryCount[],
    interacted: CategoryCount[]
  ): CategoryCount[] {
    const combined = new Map<string, number>();
    
    created.forEach(({ category, count }) => {
      combined.set(category, (combined.get(category) || 0) + count * 2); // Weight created higher
    });
    
    interacted.forEach(({ category, count }) => {
      combined.set(category, (combined.get(category) || 0) + count);
    });

    return Array.from(combined.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  private static calculateTitleWordFrequency(titles: string[]): WordCount[] {
    const frequency = new Map<string, number>();
    
    titles.forEach(title => {
      const words = title.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !COMMON_WORDS.has(word));
      
      words.forEach(word => {
        frequency.set(word, (frequency.get(word) || 0) + 1);
      });
    });

    return Array.from(frequency.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }

  private static combineWordFrequencies(
    created: WordCount[],
    interacted: WordCount[]
  ): WordCount[] {
    const combined = new Map<string, number>();
    
    created.forEach(({ word, count }) => {
      combined.set(word, (combined.get(word) || 0) + count * 2);
    });
    
    interacted.forEach(({ word, count }) => {
      combined.set(word, (combined.get(word) || 0) + count);
    });

    return Array.from(combined.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }

  private static calculateUserInteractions(userData: any): UserInteraction[] {
    const interactions = new Map<string, { name: string; count: number }>();
    
    // Count interactions from reviews
    userData.reviews.forEach((review: any) => {
      const authorId = review.brief.author.id;
      if (authorId !== userData.id) {
        const current = interactions.get(authorId) || { name: review.brief.author.name || 'Unknown', count: 0 };
        current.count += 1;
        interactions.set(authorId, current);
      }
    });

    // Count interactions from upvotes
    userData.briefUpvotes.forEach((upvote: any) => {
      const authorId = upvote.brief.author.id;
      if (authorId !== userData.id) {
        const current = interactions.get(authorId) || { name: upvote.brief.author.name || 'Unknown', count: 0 };
        current.count += 1;
        interactions.set(authorId, current);
      }
    });

    return Array.from(interactions.entries())
      .map(([userId, { name, count }]) => ({ userId, name, interactionCount: count }))
      .sort((a, b) => b.interactionCount - a.interactionCount);
  }

  private static calculateCitationDomains(briefs: any[]): DomainCount[] {
    const domains = new Map<string, number>();
    
    briefs.forEach(brief => {
      brief.sources?.forEach((source: any) => {
        try {
          const url = new URL(source.url);
          const domain = url.hostname.replace('www.', '');
          domains.set(domain, (domains.get(domain) || 0) + 1);
        } catch (e) {
          // Invalid URL, skip
        }
      });
    });

    return Array.from(domains.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  }

  private static calculateEngagementScore(userData: any): number {
    const briefsCreated = userData.briefs.length;
    const reviews = userData.reviews.length;
    const upvotes = userData.briefUpvotes.length;
    const saves = userData.savedBriefs.length;
    
    // Weighted engagement score (0-100)
    const score = Math.min(100, 
      (briefsCreated * 10) + 
      (reviews * 5) + 
      (upvotes * 2) + 
      (saves * 3)
    );
    
    return Math.round(score * 10) / 10;
  }

  private static calculateContentQualityScore(briefs: any[]): number {
    if (briefs.length === 0) return 0;
    
    let totalScore = 0;
    let scoredBriefs = 0;
    
    briefs.forEach(brief => {
      if (brief.reviews.length > 0) {
        const avgRating = brief.reviews.reduce((sum: number, r: any) =>sum + r.rating, 0) / brief.reviews.length;
        totalScore += avgRating;
        scoredBriefs++;
      }
    });
    
    if (scoredBriefs === 0) return 0;
    
    return Math.round((totalScore / scoredBriefs) * 20); // Convert 1-5 to 0-100
  }

  static async calculateAllUserRecommendations() {
    try {
      const users = await db.user.findMany({
        select: { id: true }
      });

      const results = await Promise.allSettled(
        users.map(user => this.calculateUserRecommendations(user.id))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        total: users.length,
        successful,
        failed
      };
    } catch (error) {
      console.error('Error calculating all recommendations:', error);
      throw error;
    }
  }

  
}