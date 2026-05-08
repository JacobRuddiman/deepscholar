// @ts-nocheck - Seed file, not production code
import { db } from "@/server/db";
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import * as sampleData from '../../seed-data';
import { SeedConfig } from '../config';
import {
  getRandomElement,
  getRandomInt,
  getSkewedDate,
  getWeightedRandom
} from '../utils';

// User creation with relational patterns
export async function createUsers(config: SeedConfig, createdData: any) {
  const users = [];
  const userCount = config.users?.count || 100;

  // Determine power users based on correlation pattern
  const powerUserIndices = new Set<number>();
  if (config.dataSkew?.powerUsers) {
    const powerUserCount = Math.floor(userCount * 0.1);

    switch (config.relationalPatterns?.userBriefCorrelation) {
      case 'powerLaw':
        // Top 10% of users
        for (let i = 0; i < powerUserCount; i++) {
          powerUserIndices.add(i);
        }
        break;
      case 'uniform':
        // Random distribution
        while (powerUserIndices.size < powerUserCount) {
          powerUserIndices.add(getRandomInt(0, userCount - 1));
        }
        break;
      case 'normal':
      default:
        // Clustered around middle
        const middle = Math.floor(userCount / 2);
        const spread = Math.floor(userCount / 4);
        for (let i = 0; i < powerUserCount; i++) {
          const index = Math.max(0, Math.min(userCount - 1,
            Math.floor(middle + (Math.random() - 0.5) * spread * 2)
          ));
          powerUserIndices.add(index);
        }
    }
  }

  // Create user cohorts for temporal clustering
  const cohortSize = Math.ceil(userCount / 10);
  const cohortDates: Date[] = [];
  if (config.relationalPatterns?.temporalClustering !== 'none') {
    const start = config.dataSkew?.startDate?.getTime() || Date.now() - 365 * 24 * 60 * 60 * 1000;
    const end = config.dataSkew?.endDate?.getTime() || Date.now();

    for (let i = 0; i < 10; i++) {
      cohortDates.push(new Date(start + (end - start) * (i / 10)));
    }
  }

  for (let i = 0; i < userCount; i++) {
    const isPowerUser = powerUserIndices.has(i);
    const isWhale = config.tokens?.whaleRatio && Math.random() < config.tokens.whaleRatio;
    const isAdmin = Math.random() < (config.users?.adminRatio || 0.05);
    const isEmailVerified = Math.random() < (config.users?.emailVerifiedRatio || 0.8);

    // Determine cohort and creation date
    let createdAt: Date;
    if (config.relationalPatterns?.temporalClustering !== 'none' && cohortDates.length > 0) {
      const cohortIndex = Math.floor(i / cohortSize);
      const cohortDate = cohortDates[Math.min(cohortIndex, cohortDates.length - 1)];
      const variance = 7 * 24 * 60 * 60 * 1000; // 7 days variance
      createdAt = new Date(cohortDate.getTime() +  (Math.random() - 0.5) * variance);
    } else {
      createdAt = getSkewedDate(config);
    }

    const user = await db.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        emailVerified: isEmailVerified ? faker.date.between({ from: createdAt, to: new Date() }) : null,
        image: null, // Use app's default avatar system to avoid CDN timeouts
        isAdmin,
        lastInteractionDate: isPowerUser ? faker.date.recent() : faker.date.between({ from: createdAt, to: new Date() }),
        lastPromotionEmailDate: faker.date.between({ from: createdAt, to: new Date() }),
        emailNotifications: Math.random() < (config.users?.notificationSettings?.emailNotificationsRatio || 0.7),
        briefInterestUpdates: Math.random() < (config.users?.notificationSettings?.briefInterestUpdatesRatio || 0.6),
        promotionalNotifications: Math.random() < (config.users?.notificationSettings?.promotionalNotificationsRatio || 0.5),
        createdAt,
        isSeedData: true,
      },
    });

    // Track special users
    if (isPowerUser) {
      createdData.powerUsers.push(user);
    }

    // Store whale status for later token creation
    (user as any).isWhale = isWhale;
    (user as any).isPowerUser = isPowerUser;

    // Create account for user
    if (config.accounts?.enabled) {
      const provider = getWeightedRandom(config.accounts.providersDistribution || { google: 1 });

      await db.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: provider as string,
          providerAccountId: faker.string.uuid(),
          access_token: faker.string.alphanumeric(40),
          refresh_token: faker.string.alphanumeric(40),
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      });
    }

    users.push(user);
  }

  return users;
}

export async function createResearchAIModels(config: SeedConfig) {
  const models = config.researchAIModels?.models || [];
  const createdModels = [];

  for (const modelConfig of models) {
    const model = await db.researchAIModel.create({
      data: {
        name: modelConfig.name,
        provider: modelConfig.provider,
        version: modelConfig.version,
      },
    });
    createdModels.push(model);
  }

  return createdModels;
}

export async function createReviewAIModels(config: SeedConfig) {
  const models = config.reviewAIModels?.models || [];
  const createdModels = [];

  for (const modelConfig of models) {
    const model = await db.reviewAIModel.create({
      data: {
        name: modelConfig.name,
        provider: modelConfig.provider,
        version: modelConfig.version,
      },
    });
    createdModels.push(model);
  }

  return createdModels;
}

export async function createCategories(config: SeedConfig) {
  const customCategories = config.categories?.customCategories ||
    sampleData.categories.slice(0, config.categories?.count || 20);
  const createdCategories = [];

  // Apply category distribution pattern
  const distribution = config.relationalPatterns?.categoryDistribution || 'balanced';

  for (let i = 0; i < customCategories.length; i++) {
    const categoryName = customCategories[i];

    // Adjust description based on distribution
    let description = getRandomElement(sampleData.categoryDescriptions);
    if (distribution === 'hierarchical' && i > 5) {
      description = `Subcategory of ${customCategories[i % 5]}. ${description}`;
    }

    const category = await db.category.create({
      data: {
        name: categoryName,
        description,
      },
    });
    createdCategories.push(category);
  }

  return createdCategories;
}

export async function createNotifications(config: SeedConfig, createdData: { users: any[]; briefs: any[] }) {
  const notifications = [];
  const users = createdData.users;
  const briefs = createdData.briefs;

  if (users.length < 2) return notifications;

  const notificationTypes = ['follow', 'review', 'upvote', 'publish', 'mention', 'system'] as const;
  const notificationTemplates = {
    follow: (actor: string) => ({ title: 'New Follower', message: `${actor} started following you` }),
    review: (actor: string, briefTitle?: string) => ({ title: 'New Review', message: `${actor} reviewed your brief "${briefTitle || 'Untitled'}"` }),
    upvote: (actor: string, briefTitle?: string) => ({ title: 'New Upvote', message: `${actor} upvoted your brief "${briefTitle || 'Untitled'}"` }),
    publish: (_actor: string, briefTitle?: string) => ({ title: 'Brief Published', message: `Your brief "${briefTitle || 'Untitled'}" has been published` }),
    mention: (actor: string) => ({ title: 'You were mentioned', message: `${actor} mentioned you in a review` }),
    system: () => ({ title: 'Welcome to DeepScholar', message: 'Start exploring research briefs from the community' }),
  };

  // Create ~3 notifications per user (subset)
  const targetCount = Math.min(users.length * 3, 300);

  for (let i = 0; i < targetCount; i++) {
    const recipient = getRandomElement(users);
    const actor = getRandomElement(users.filter((u: any) => u.id !== recipient.id)) || users[0];
    const type = getRandomElement([...notificationTypes]);
    const brief = briefs.length > 0 ? getRandomElement(briefs) : null;

    const template = notificationTemplates[type](
      actor?.name || 'Someone',
      brief?.title
    );

    const isRead = Math.random() < 0.6;

    const notification = await db.notification.create({
      data: {
        userId: recipient.id,
        type,
        title: template.title,
        message: template.message,
        actionUrl: brief ? `/briefs/${brief.slug || brief.id}` : undefined,
        relatedId: type === 'follow' ? actor?.id : brief?.id,
        read: isRead,
        readAt: isRead ? faker.date.recent() : null,
        createdAt: getSkewedDate(config),
      },
    });
    notifications.push(notification);
  }

  return notifications;
}

export async function createSources(config: SeedConfig) {
  const sources = [];
  const sourceCount = config.sources?.count || 200;

  for (let i = 0; i < sourceCount; i++) {
    const source = await db.source.create({
      data: {
        title: getRandomElement(sampleData.sourceTitles),
        url: config.sources?.urlPatterns?.length
          ? getRandomElement(config.sources.urlPatterns).replace('{id}', faker.string.uuid())
          : faker.internet.url(),
        createdAt: getSkewedDate(config),
      },
    });
    sources.push(source);
  }

  return sources;
}
