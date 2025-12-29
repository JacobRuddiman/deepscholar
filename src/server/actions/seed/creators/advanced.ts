import { db } from "@/server/db";
import { faker } from '@faker-js/faker';
import * as sampleData from '../../seed-data';
import { SeedConfig } from '../config';
import {
  getRandomElement,
  getRandomElements,
  getRandomInt,
  getRandomFloat,
  getWeightedRandom,
  normalizeDistribution,
  createUserClusters,
  getEngagementMultiplier,
  getTemporalDate
} from '../utils';

// Create Briefs with all complex relationships
export async function createBriefs(config: SeedConfig, createdData: any) {
  const briefs: any[] = [];
  const briefCount = config.briefs?.count || 500;

  // Check prerequisites
  if (createdData.users.length === 0) {
    console.warn('⚠️ No users available for brief creation');
    return briefs;
  }

  if (createdData.researchAIModels.length === 0) {
    console.warn('⚠️ No AI models available for brief creation');
    return briefs;
  }

  // Determine viral briefs
  const viralIndices = new Set<number>();
  if (config.dataSkew?.viralBriefs) {
    const viralCount = Math.floor(briefCount * 0.05);
    while (viralIndices.size < viralCount) {
      viralIndices.add(getRandomInt(0, briefCount - 1));
    }
  }

  // Apply user-brief correlation pattern
  const getUserForBrief = (index: number): any => {
    switch (config.relationalPatterns?.userBriefCorrelation) {
      case 'powerLaw':
        // Power users create most content
        if (createdData.powerUsers.length > 0 && Math.random() < 0.7) {
          return getRandomElement(createdData.powerUsers);
        }
        return getRandomElement(createdData.users);

      case 'uniform':
        // Even distribution
        return createdData.users[index % createdData.users.length];

      case 'normal':
      default:
        // Normal distribution
        return getRandomElement(createdData.users);
    }
  };

  // Apply category distribution
  const getCategoriesForBrief = (): any[] => {
    if (createdData.categories.length === 0) return [];

    const count = getRandomInt(...(config.briefs?.categoriesPerBrief || [1, 4]));

    switch (config.relationalPatterns?.categoryDistribution) {
      case 'skewed':
        // Popular categories get more briefs
        const popularCategories = createdData.categories.slice(0, Math.ceil(createdData.categories.length * 0.3));
        if (Math.random() < 0.7 && popularCategories.length > 0) {
          return getRandomElements(popularCategories, count);
        }
        break;

      case 'hierarchical':
        // Related categories cluster together
        const baseIndex = getRandomInt(0, createdData.categories.length - 1);
        const related = [];
        for (let i = 0; i < count; i++) {
          const offset = getRandomInt(-2, 2);
          const index = Math.max(0, Math.min(createdData.categories.length - 1, baseIndex + offset));
          related.push(createdData.categories[index]);
        }
        return related;
    }

    return getRandomElements(createdData.categories, count);
  };

  // Create briefs with temporal patterns
  for (let i = 0; i < briefCount; i++) {
    const isViral = viralIndices.has(i);
    const isPublished = Math.random() < (config.briefs?.publishedRatio || 0.9);
    const isDraft = !isPublished && Math.random() < (config.briefs?.draftRatio || 0.5);

    const author = getUserForBrief(i);
    const selectedCategories = getCategoriesForBrief();
    const sourcesCount = getRandomInt(...(config.briefs?.sourcesPerBrief || [2, 8]));
    const selectedSources = getRandomElements(createdData.sources, sourcesCount);

    // Determine quality tier
    const qualityDist = config.briefs?.qualityDistribution || { high: 0.2, medium: 0.6, low: 0.2 };
    const quality = getWeightedRandom(qualityDist);

    // Adjust metrics based on quality
    let viewCount: number;
    let accuracy: number;

    switch (quality) {
      case 'high':
        viewCount = isViral ? getRandomInt(50000, 200000) : getRandomInt(5000, 20000);
        accuracy = getRandomFloat(4.0, 5.0);
        break;
      case 'low':
        viewCount = isViral ? getRandomInt(10000, 50000) : getRandomInt(0, 1000);
        accuracy = getRandomFloat(2.0, 3.5);
        break;
      case 'medium':
      default:
        viewCount = isViral ? getRandomInt(20000, 100000) : getRandomInt(1000, 10000);
        accuracy = getRandomFloat(3.0, 4.5);
    }

    // Apply engagement pattern
    const engagementMultiplier = getEngagementMultiplier(
      config.relationalPatterns?.engagementPatterns || 'organic',
      i / briefCount
    );
    viewCount = Math.floor(viewCount * engagementMultiplier);

    const createdAt = getTemporalDate(config, author.createdAt, i, briefCount);

    const brief = await db.brief.create({
      data: {
        title: getRandomElement(sampleData.briefTitles),
        prompt: getRandomElement(sampleData.briefPrompts),
        response: getRandomElement(sampleData.briefResponses),
        abstract: Math.random() < (config.briefs?.withAbstractRatio || 0.7)
          ? getRandomElement(sampleData.briefAbstracts)
          : null,
        thinking: Math.random() < (config.briefs?.withThinkingRatio || 0.3)
          ? getRandomElement(sampleData.briefThinking)
          : null,
        modelId: (getRandomElement(createdData.researchAIModels) as any).id,
        userId: author.id,
        categories: selectedCategories.length > 0 ? {
          connect: selectedCategories.map((c: any) => ({ id: c.id })),
        } : undefined,
        sources: selectedSources.length > 0 ? {
          connect: selectedSources.map((s: any) => ({ id: s.id })),
        } : undefined,
        viewCount,
        readTime: getRandomInt(...(config.briefs?.readTimeRange || [3, 30])),
        accuracy,
        slug: faker.lorem.slug(),
        published: isPublished,
        isDraft,
        createdAt,
        isSeedData: true,
      },
    });

    // Track viral briefs
    if (isViral) {
      createdData.viralBriefs.push(brief);
    }

    // Create references for this brief
    const referencesCount = Math.min(
      selectedSources.length,
      getRandomInt(...(config.briefs?.referencesPerBrief || [1, 5]))
    );

    for (let j = 0; j < referencesCount; j++) {
      await db.briefReference.create({
        data: {
          briefId: brief.id,
          sourceId: selectedSources[j].id,
          highlightedText: getRandomElement(sampleData.highlightedTexts),
          context: Math.random() > 0.5 ? getRandomElement(sampleData.referenceContexts) : null,
        },
      });
    }

    briefs.push(brief);
  }

  // Create versions for some briefs
  if (config.briefs?.versionsEnabled && briefs.length > 0) {
    const briefsWithVersions = getRandomElements(
      briefs.filter(b => b.published && !b.isDraft),
      Math.min(Math.floor(briefs.length * 0.1), 50)
    );

    for (const parentBrief of briefsWithVersions) {
      const versionCount = getRandomInt(1, config.briefs?.maxVersionsPerBrief || 3);

      for (let v = 2; v <= versionCount + 1; v++) {
        await db.brief.create({
          data: {
            title: `${parentBrief.title} (v${v})`,
            prompt: parentBrief.prompt,
            response: getRandomElement(sampleData.briefResponses),
            abstract: parentBrief.abstract,
            thinking: parentBrief.thinking,
            modelId: getRandomElement(createdData.researchAIModels).id,
            userId: parentBrief.userId,
            viewCount: Math.floor(parentBrief.viewCount * Math.pow(0.7, v - 1)),
            readTime: parentBrief.readTime,
            accuracy: parentBrief.accuracy,
            published: true,
            isDraft: false,
            isActive: false,
            parentBriefId: parentBrief.id,
            versionNumber: v,
            changeLog: getRandomElement(sampleData.changeLogs),
            createdAt: faker.date.between({
              from: parentBrief.createdAt,
              to: new Date()
            }),
            isSeedData: true,
          },
        });
      }
    }
  }

  return briefs;
}

// Create Reviews
export async function createReviews(config: SeedConfig, createdData: any) {
  const reviews = [];
  const ratingDist = normalizeDistribution(
    config.reviews?.ratingDistribution || { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.35, 5: 0.3 }
  );

  // Apply review authorship pattern
  const getReviewAuthor = (brief: any): any => {
    switch (config.relationalPatterns?.reviewAuthorship) {
      case 'concentrated':
        // Few users write most reviews
        if (createdData.powerUsers.length > 0 && Math.random() < 0.6) {
          return getRandomElement(createdData.powerUsers);
        }
        break;

      case 'reciprocal':
        // Users review each other's content
        const otherUsers = createdData.users.filter((u: any) => u.id !== brief.userId);
        if (otherUsers.length > 0) {
          return getRandomElement(otherUsers);
        }
        break;
    }

    return getRandomElement(createdData.users);
  };

  for (const brief of createdData.briefs) {
    const isViralBrief = createdData.viralBriefs.includes(brief);
    const reviewCountRange = config.reviews?.reviewsPerBrief || [0, 15];
    let reviewCount = getRandomInt(...reviewCountRange);

    // Viral briefs get more reviews
    if (isViralBrief) {
      reviewCount = Math.floor(reviewCount * 3);
    }

    // Quality correlation - better briefs get more reviews
    if (brief.accuracy >= 4.0) {
      reviewCount = Math.floor(reviewCount * 1.5);
    }

    const reviewAuthors = new Set<string>();

    for (let i = 0; i < reviewCount; i++) {
      const author = getReviewAuthor(brief);

      // Prevent duplicate reviews from same author
      if (reviewAuthors.has(author.id)) continue;
      reviewAuthors.add(author.id);

      let rating = parseInt(getWeightedRandom(ratingDist) as any);

      // Controversial content gets mixed ratings
      if (config.dataSkew?.controversialContent && Math.random() < 0.1) {
        rating = Math.random() < 0.5 ? 1 : 5;
      }

      // Quality correlation
      if (brief.accuracy >= 4.0 && rating < 3) {
        rating = Math.min(5, rating + 2);
      } else if (brief.accuracy <= 3.0 && rating > 3) {
        rating = Math.max(1, rating - 1);
      }

      const review = await db.review.create({
        data: {
          content: getRandomElement(sampleData.reviewContents[rating] || sampleData.reviewContents[3]),
          rating,
          briefId: brief.id,
          userId: author.id,
          createdAt: faker.date.between({
            from: brief.createdAt,
            to: new Date()
          }),
        },
      });
      reviews.push(review);
    }
  }

  return reviews;
}

// Create AI Reviews
export async function createAIReviews(config: SeedConfig, createdData: any) {
  const aiReviews = [];
  const ratingDist = normalizeDistribution(
    config.aiReviews?.ratingDistribution || { 1: 0.02, 2: 0.08, 3: 0.25, 4: 0.40, 5: 0.25 }
  );

  for (const brief of createdData.briefs) {
    const aiReviewCount = getRandomInt(...(config.aiReviews?.aiReviewsPerBrief || [0, 3]));

    for (let i = 0; i < aiReviewCount; i++) {
      let rating = parseInt(getWeightedRandom(ratingDist) as any);

      // AI reviews correlate with actual quality
      if (brief.accuracy >= 4.5) {
        rating = Math.max(4, rating);
      } else if (brief.accuracy <= 3.0) {
        rating = Math.min(3, rating);
      }

      const aiReview = await db.aIReview.create({
        data: {
          content: getRandomElement(sampleData.aiReviewContents[rating] || sampleData.aiReviewContents[4]),
          rating,
          briefId: brief.id,
          modelId: getRandomElement(createdData.reviewAIModels).id,
          requesterId: Math.random() > 0.5 ? getRandomElement(createdData.users).id : null,
          helpfulCount: getRandomInt(0, 50),
          createdAt: faker.date.between({
            from: brief.createdAt,
            to: new Date()
          }),
        },
      });
      aiReviews.push(aiReview);
    }
  }

  return aiReviews;
}

// Create Upvotes
export async function createUpvotes(config: SeedConfig, createdData: any) {
  const interactionDensity = config.relationalPatterns?.networkEffects?.interactionDensity || 0.3;
  const clusteringCoefficient = config.relationalPatterns?.networkEffects?.clusteringCoefficient || 0.5;

  // Create user clusters for network effects
  const userClusters = createUserClusters(createdData.users, clusteringCoefficient);

  // Brief upvotes
  for (const user of createdData.users) {
    const maxUpvotes = config.upvotes?.maxUpvotesPerUser || 50;
    const briefUpvoteCount = Math.floor(maxUpvotes * (config.upvotes?.briefUpvoteRatio || 0.6));

    // Get briefs to upvote based on network effects
    let candidateBriefs = [...createdData.briefs];

    // Users in same cluster more likely to upvote each other's content
    const userCluster = userClusters.find(cluster => cluster.includes(user));
    if (userCluster && Math.random() < clusteringCoefficient) {
      const clusterBriefs = candidateBriefs.filter(b =>
        userCluster.some(u => u.id === b.userId)
      );
      if (clusterBriefs.length > 0) {
        candidateBriefs = clusterBriefs;
      }
    }

    // Apply interaction density
    const actualUpvoteCount = Math.floor(briefUpvoteCount * interactionDensity);
    const selectedBriefs = getRandomElements(candidateBriefs, actualUpvoteCount);

    for (const brief of selectedBriefs) {
      // Viral briefs more likely to get upvotes
      if (!createdData.viralBriefs.includes(brief) && Math.random() > 0.7) continue;

      await db.briefUpvote.create({
        data: {
          briefId: brief.id,
          userId: user.id,
          createdAt: faker.date.between({
            from: brief.createdAt,
            to: new Date()
          }),
        },
      }).catch(() => {}); // Ignore duplicates
    }
  }

  // Review upvotes with similar logic
  for (const user of createdData.users) {
    const maxUpvotes = config.upvotes?.maxUpvotesPerUser || 50;
    const reviewUpvoteCount = Math.floor(maxUpvotes * (config.upvotes?.reviewUpvoteRatio || 0.4));
    const actualUpvoteCount = Math.floor(reviewUpvoteCount * interactionDensity);
    const selectedReviews = getRandomElements(createdData.reviews, actualUpvoteCount);

    for (const review of selectedReviews) {
      await db.reviewUpvote.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          createdAt: faker.date.between({
            from: review.createdAt,
            to: new Date()
          }),
        },
      }).catch(() => {}); // Ignore duplicates
    }
  }
}

// Create Saved Briefs
export async function createSavedBriefs(config: SeedConfig, createdData: any) {
  const interactionDensity = config.relationalPatterns?.networkEffects?.interactionDensity || 0.3;

  for (const user of createdData.users) {
    if (Math.random() < (config.savedBriefs?.saveRatio || 0.3)) {
      const maxSaves = config.savedBriefs?.maxSavesPerUser || 30;
      const saveCount = Math.floor(getRandomInt(1, maxSaves) * interactionDensity);

      // Power users save more
      const isPowerUser = createdData.powerUsers.includes(user);
      const actualSaveCount = isPowerUser ? Math.floor(saveCount * 1.5) : saveCount;

      const selectedBriefs = getRandomElements(createdData.briefs, actualSaveCount);

      for (const brief of selectedBriefs) {
        // Quality bias - better briefs more likely to be saved
        if (brief.accuracy < 3.5 && Math.random() > 0.3) continue;

        await db.savedBrief.create({
          data: {
            userId: user.id,
            briefId: brief.id,
            createdAt: faker.date.between({
              from: brief.createdAt,
              to: new Date()
            }),
          },
        }).catch(() => {}); // Ignore duplicates
      }
    }
  }
}

// Create Brief Views
export async function createBriefViews(config: SeedConfig, createdData: any) {
  const interactionDensity = config.relationalPatterns?.networkEffects?.interactionDensity || 0.3;

  for (const user of createdData.users) {
    if (Math.random() < (config.briefViews?.viewRatio || 0.8)) {
      const baseViewCount = getRandomInt(5, 50);
      const viewCount = Math.floor(baseViewCount * interactionDensity);

      // Power users view more content
      const isPowerUser = createdData.powerUsers.includes(user);
      const actualViewCount = isPowerUser ? Math.floor(viewCount * 2) : viewCount;

      const selectedBriefs = getRandomElements(createdData.briefs, actualViewCount);

      for (const brief of selectedBriefs) {
        await db.briefView.create({
          data: {
            userId: user.id,
            briefId: brief.id,
            createdAt: faker.date.between({
              from: brief.createdAt,
              to: new Date()
            }),
          },
        }).catch(() => {}); // Ignore duplicates

        // Multiple views from same user if enabled
        if (config.briefViews?.multipleViewsPerUser && Math.random() < 0.3) {
          const additionalViews = getRandomInt(1, 3);
          for (let i = 0; i < additionalViews; i++) {
            await db.briefView.create({
              data: {
                userId: user.id,
                briefId: brief.id,
                createdAt: faker.date.between({
                  from: brief.createdAt,
                  to: new Date()
                }),
              },
            }).catch(() => {});
          }
        }
      }
    }
  }
}

// Create Token Data
export async function createTokenData(config: SeedConfig, createdData: any) {
  const tokenPackages = [
    { name: 'Starter Pack', tokens: 100, price: 9.99 },
    { name: 'Pro Pack', tokens: 500, price: 39.99 },
    { name: 'Enterprise Pack', tokens: 2000, price: 149.99 },
  ];

  const economyType = config.tokens?.economyType || 'balanced';

  for (const user of createdData.users) {
    const isWhale = (user as any).isWhale;
    const isPowerUser = (user as any).isPowerUser;

    // Determine initial balance based on user type and economy
    let initialBalance: number;

    if (isWhale) {
      initialBalance = getRandomInt(5000, 20000);
    } else if (isPowerUser) {
      initialBalance = getRandomInt(500, 2000);
    } else {
      initialBalance = getRandomInt(...(config.tokens?.initialBalanceRange || [0, 1000]));
    }

    // Adjust for economy type
    switch (economyType) {
      case 'inflationary':
        initialBalance = Math.floor(initialBalance * 1.5);
        break;
      case 'deflationary':
        initialBalance = Math.floor(initialBalance * 0.5);
        break;
    }

    // Create token balance
    const userToken = await db.userToken.create({
      data: {
        userId: user.id,
        balance: initialBalance,
      },
    });

    // Create purchase history
    const shouldPurchase = isWhale || (Math.random() < (config.tokens?.purchaseRatio || 0.2));

    if (shouldPurchase) {
      const purchaseCount = isWhale ? getRandomInt(3, 10) : getRandomInt(1, 3);

      for (let i = 0; i < purchaseCount; i++) {
        const tokenPackage = isWhale
          ? tokenPackages[tokenPackages.length - 1]
          : getRandomElement(tokenPackages);

        const purchaseDate = faker.date.between({
          from: user.createdAt,
          to: new Date()
        });

        const purchase = await db.tokenPurchase.create({
          data: {
            userId: user.id,
            packageName: tokenPackage.name,
            tokensAmount: tokenPackage.tokens,
            priceUSD: tokenPackage.price,
            paymentMethod: getRandomElement(['stripe', 'paypal']),
            paymentId: faker.string.uuid(),
            status: 'completed',
            createdAt: purchaseDate,
          },
        });

        // Create corresponding transaction
        await db.tokenTransaction.create({
          data: {
            userId: user.id,
            amount: tokenPackage.tokens,
            reason: 'Token purchase',
            purchaseId: purchase.id,
            createdAt: purchaseDate,
          },
        });
      }
    }

    // Create transaction history
    const baseTransactionCount = getRandomInt(...(config.tokens?.transactionCountRange || [0, 50]));
    const transactionCount = isPowerUser ? Math.floor(baseTransactionCount * 2) : baseTransactionCount;

    const userBriefs = createdData.briefs.filter((b: any) => b.userId === user.id);

    for (let i = 0; i < transactionCount; i++) {
      const transactionTypes = [
        { amount: -10, reason: 'Brief creation' },
        { amount: 5, reason: 'Review reward' },
        { amount: 2, reason: 'Upvote reward' },
        { amount: -5, reason: 'Export usage' },
        { amount: 10, reason: 'Quality content bonus' },
        { amount: -20, reason: 'Premium feature usage' },
      ];

      // Adjust transaction amounts for economy type
      const economyMultiplier = economyType === 'inflationary' ? 1.5 :
                                economyType === 'deflationary' ? 0.7 : 1.0;

      const transaction = getRandomElement(transactionTypes);
      const adjustedAmount = Math.floor(transaction.amount * economyMultiplier);

      await db.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: adjustedAmount,
          reason: transaction.reason,
          briefId: transaction.reason === 'Brief creation' && userBriefs.length > 0
            ? getRandomElement(userBriefs)?.id
            : null,
          createdAt: faker.date.between({
            from: user.createdAt,
            to: new Date()
          }),
        },
      });
    }
  }
}

// Create Export History
export async function createExportHistory(config: SeedConfig, createdData: any) {
  const exportTypes = ['brief', 'user_profile', 'search_results'];
  const formatDist = normalizeDistribution(
    config.exports?.formatDistribution ||
    { pdf: 0.4, markdown: 0.2, html: 0.15, json: 0.1, csv: 0.05, docx: 0.05, txt: 0.05 }
  );

  for (const user of createdData.users) {
    const isPowerUser = createdData.powerUsers.includes(user);
    const baseExportCount = getRandomInt(...(config.exports?.exportsPerUser || [0, 10]));
    const exportCount = isPowerUser ? Math.floor(baseExportCount * 2) : baseExportCount;

    for (let i = 0; i < exportCount; i++) {
      const exportType = getRandomElement(exportTypes);
      const exportFormat = getWeightedRandom(formatDist);

      const exportDate = faker.date.between({
        from: user.createdAt,
        to: new Date()
      });

      let targetId: string;
      if (exportType === 'brief' && createdData.briefs.length > 0) {
        targetId = getRandomElement(createdData.briefs).id;
      } else {
        targetId = user.id;
      }

      await db.exportHistory.create({
        data: {
          userId: user.id,
          exportType,
          exportFormat: exportFormat as string,
          targetId,
          filename: `export_${faker.string.alphanumeric(8)}.${exportFormat}`,
          fileSize: getRandomInt(1000, 5000000),
          status: 'completed',
          downloadCount: getRandomInt(1, 5),
          createdAt: exportDate,
        },
      });

      // Update or create export usage for rate limiting
      const dateOnly = new Date(exportDate);
      dateOnly.setHours(0, 0, 0, 0);

      await db.exportUsage.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: dateOnly,
          },
        },
        update: {
          count: { increment: 1 },
        },
        create: {
          userId: user.id,
          date: dateOnly,
          count: 1,
        },
      });
    }
  }
}

// Create User Recommendations based on user activity
export async function createUserRecommendations(config: SeedConfig, createdData: any) {
  console.log('Generating user recommendations based on activity...');

  for (const user of createdData.users) {
    // Get user's saved briefs
    const savedBriefs = await db.savedBrief.findMany({
      where: { userId: user.id },
      include: {
        brief: {
          include: {
            categories: true,
          },
        },
      },
    });

    // Get user's viewed briefs
    const viewedBriefs = await db.briefView.findMany({
      where: { userId: user.id },
      include: {
        brief: {
          include: {
            categories: true,
          },
        },
      },
      take: 50, // Limit to recent 50 views
      orderBy: { createdAt: 'desc' },
    });

    // Combine all interacted briefs
    const allInteractedBriefs = [
      ...savedBriefs.map(sb => sb.brief),
      ...viewedBriefs.map(vb => vb.brief),
    ];

    // Calculate top categories
    const categoryCount = new Map<string, number>();
    allInteractedBriefs.forEach(brief => {
      brief.categories.forEach(category => {
        categoryCount.set(category.name, (categoryCount.get(category.name) || 0) + 1);
      });
    });

    // Get top 5 categories
    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Extract keywords from brief titles (simple approach)
    const keywords = new Set<string>();
    allInteractedBriefs.forEach(brief => {
      const words = brief.title
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 4 && !commonWords.includes(word));
      words.forEach(word => keywords.add(word));
    });

    const relevantKeywords = Array.from(keywords).slice(0, 20);

    // Calculate engagement score based on activity
    const briefCount = createdData.briefs.filter((b: any) => b.userId === user.id).length;
    const reviewCount = createdData.reviews.filter((r: any) => r.userId === user.id).length;
    const saveCount = savedBriefs.length;
    const viewCount = viewedBriefs.length;

    const engagementScore = Math.min(
      100,
      (briefCount * 10) + (reviewCount * 5) + (saveCount * 3) + (viewCount * 1)
    );

    // Generate recent search queries based on categories and keywords
    const lastSearchQueries = generateSearchQueries(topCategories, Array.from(keywords));

    // Get last interaction date
    const lastInteractionDate = user.lastInteractionDate || new Date();

    // Create or update user recommendation
    await db.userRecommendation.upsert({
      where: { userId: user.id },
      update: {
        topCategories,
        topCreatedCategories: topCategories,
        relevantKeywords,
        engagementScore,
        lastSearchQueries,
        lastInteractionDate,
      },
      create: {
        userId: user.id,
        topCategories,
        topCreatedCategories: topCategories,
        relevantKeywords,
        engagementScore,
        lastSearchQueries,
        lastInteractionDate,
      },
    });
  }
}

// Helper function to generate realistic search queries
function generateSearchQueries(categories: string[], keywords: string[]): string[] {
  const queries: string[] = [];
  const queryCount = getRandomInt(3, 5);

  for (let i = 0; i < queryCount; i++) {
    if (Math.random() < 0.5 && categories.length > 0) {
      // Category-based query
      const category = getRandomElement(categories);
      queries.push(category.toLowerCase());
    } else if (keywords.length > 0) {
      // Keyword-based query
      const keywordCount = getRandomInt(1, 3);
      const selectedKeywords = getRandomElements(Array.from(keywords), keywordCount);
      queries.push(selectedKeywords.join(' '));
    }
  }

  return queries.slice(0, queryCount);
}

// Common words to filter out from keywords
const commonWords = [
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will',
  'what', 'their', 'which', 'about', 'other', 'into', 'after', 'could',
  'only', 'than', 'also', 'more', 'some', 'these', 'would', 'there',
];
