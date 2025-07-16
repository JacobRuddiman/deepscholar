import { faker } from '@faker-js/faker';
import { SeedConfig } from './config';

// Helper functions
export function getRandomElement<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot get random element from empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomElements<T>(array: T[], count: number): T[] {
  if (array.length === 0) return [];
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function getWeightedRandom<T>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
  
  if (totalWeight === 0) {
    return entries[0][0];
  }
  
  let random = Math.random() * totalWeight;
  
  for (const [value, weight] of entries) {
    random -= weight;
    if (random <= 0) return value;
  }
  
  return entries[0][0];
}

export function getSkewedDate(config: SeedConfig): Date {
  const start = config.dataSkew?.startDate?.getTime() || Date.now() - 365 * 24 * 60 * 60 * 1000;
  const end = config.dataSkew?.endDate?.getTime() || Date.now();
  
  switch (config.dataSkew?.timeDistribution) {
    case 'recent':
      const recentBias = Math.pow(Math.random(), 2);
      return new Date(start + (end - start) * recentBias);
    case 'exponential':
      const expBias = Math.pow(Math.random(), 0.5);
      return new Date(start + (end - start) * expBias);
    case 'uniform':
    default:
      return faker.date.between({ from: new Date(start), to: new Date(end) });
  }
}

export function normalizeDistribution(distribution: Record<any, number>): Record<any, number> {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  if (total === 0) return distribution;
  
  const normalized: Record<any, number> = {};
  for (const [key, value] of Object.entries(distribution)) {
    normalized[key] = value / total;
  }
  return normalized;
}

export function validateConfig(config: SeedConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate rating distributions sum to ~1.0
  if (config.reviews?.ratingDistribution) {
    const total = Object.values(config.reviews.ratingDistribution).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      errors.push(`Review rating distribution should sum to 1.0, got ${total}`);
    }
  }
  
  if (config.aiReviews?.ratingDistribution) {
    const total = Object.values(config.aiReviews.ratingDistribution).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      errors.push(`AI review rating distribution should sum to 1.0, got ${total}`);
    }
  }
  
  // Validate ranges
  if (config.briefs?.viewCountRange && config.briefs.viewCountRange[0] > config.briefs.viewCountRange[1]) {
    errors.push('Brief view count range minimum cannot be greater than maximum');
  }
  
  // Check for dependency issues
  if (config.briefs?.enabled && !config.users?.enabled) {
    errors.push('Cannot create briefs without users');
  }
  
  if (config.reviews?.enabled && (!config.users?.enabled || !config.briefs?.enabled)) {
    errors.push('Cannot create reviews without users and briefs');
  }
  
  if (config.upvotes?.enabled && (!config.users?.enabled || !config.briefs?.enabled)) {
    errors.push('Cannot create upvotes without users and briefs');
  }
  
  return { valid: errors.length === 0, errors };
}

// Progress tracking
export class ProgressTracker {
  private totalSteps: number = 0;
  private currentStep: number = 0;
  private callback?: (message: string, percentage?: number) => void;
  
  constructor(callback?: (message: string, percentage?: number) => void) {
    this.callback = callback;
  }
  
  setTotalSteps(steps: number) {
    this.totalSteps = steps;
  }
  
  increment(message: string) {
    this.currentStep++;
    const percentage = this.totalSteps > 0 ? Math.round((this.currentStep / this.totalSteps) * 100) : 0;
    this.report(message, percentage);
  }
  
  report(message: string, percentage?: number) {
    console.log(`[${percentage ?? 0}%] ${message}`);
    if (this.callback) {
      this.callback(message, percentage);
    }
  }
}

// Helper functions for relational patterns
export function createUserClusters(users: any[], clusteringCoefficient: number): any[][] {
  const clusterCount = Math.max(1, Math.floor(users.length * 0.1));
  const clusters: any[][] = [];
  const clusteredUsers = new Set<string>();
  
  for (let i = 0; i < clusterCount; i++) {
    const clusterSize = Math.floor(users.length * clusteringCoefficient / clusterCount);
    const cluster: any[] = [];
    
    const availableUsers = users.filter(u => !clusteredUsers.has(u.id));
    if (availableUsers.length === 0) break;
    
    const seedUser = getRandomElement(availableUsers);
    cluster.push(seedUser);
    clusteredUsers.add(seedUser.id);
    
    for (let j = 1; j < clusterSize; j++) {
      const available = users.filter(u => !clusteredUsers.has(u.id));
      if (available.length === 0) break;
      
      const user = getRandomElement(available);
      cluster.push(user);
      clusteredUsers.add(user.id);
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

export function getEngagementMultiplier(pattern: string, progress: number): number {
  switch (pattern) {
    case 'viral':
      if (Math.random() < 0.1) return getRandomFloat(5, 10);
      return 1;
    case 'steady':
      return getRandomFloat(0.8, 1.2);
    case 'declining':
      return Math.max(0.1, 1 - progress * 0.8);
    case 'organic':
    default:
      return getRandomFloat(0.5, 2);
  }
}

export function getTemporalDate(config: SeedConfig, userCreatedAt: Date, index: number, total: number): Date {
  const clustering = config.relationalPatterns?.temporalClustering || 'none';
  const baseDate = getSkewedDate(config);
  
  const earliestDate = Math.max(userCreatedAt.getTime(), baseDate.getTime());
  
  switch (clustering) {
    case 'weekly':
      const weekNumber = Math.floor(index / (total / 52));
      const weekStart = new Date(earliestDate);
      weekStart.setDate(weekStart.getDate() + weekNumber * 7);
      return faker.date.between({ 
        from: weekStart, 
        to: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) 
      });
    case 'monthly':
      const monthNumber = Math.floor(index / (total / 12));
      const monthStart = new Date(earliestDate);
      monthStart.setMonth(monthStart.getMonth() + monthNumber);
      return faker.date.between({ 
        from: monthStart, 
        to: new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000) 
      });
    case 'events':
      const events = [0.1, 0.3, 0.5, 0.7, 0.9];
      const nearestEvent = events.reduce((prev, curr) => 
        Math.abs(curr - index/total) < Math.abs(prev - index/total) ? curr : prev
      );
      const eventTime = earliestDate + (Date.now() - earliestDate) * nearestEvent;
      const variance = 7 * 24 * 60 * 60 * 1000;
      return new Date(eventTime + (Math.random() - 0.5) * variance);
    case 'none':
    default:
      return new Date(earliestDate);
  }
}