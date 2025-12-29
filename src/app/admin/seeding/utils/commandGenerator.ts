import { SeedConfig } from '@/server/actions/seed';

export function generateConsoleCommand(config: SeedConfig): string {
  let command = 'npm run db:seed';
  
  // Basic flags
  if (!config.deleteAll) command += ' --no-delete';

  // Users
  if (config.users?.enabled) {
    if (config.users.count) command += ` --users ${config.users.count}`;
    if (config.users.adminRatio && config.users.adminRatio !== 0.05) {
      command += ` --admin-ratio ${config.users.adminRatio}`;
    }
    if (config.users.emailVerifiedRatio && config.users.emailVerifiedRatio !== 0.8) {
      command += ` --email-verified-ratio ${config.users.emailVerifiedRatio}`;
    }
  }
  
  // Briefs
  if (config.briefs?.enabled) {
    if (config.briefs.count) command += ` --briefs ${config.briefs.count}`;
    if (config.briefs.publishedRatio && config.briefs.publishedRatio !== 0.9) {
      command += ` --published-ratio ${config.briefs.publishedRatio}`;
    }
    if (config.briefs.categoriesPerBrief) {
      command += ` --categories-per-brief ${config.briefs.categoriesPerBrief[0]},${config.briefs.categoriesPerBrief[1]}`;
    }
    if (config.briefs.sourcesPerBrief) {
      command += ` --sources-per-brief ${config.briefs.sourcesPerBrief[0]},${config.briefs.sourcesPerBrief[1]}`;
    }
  }
  
  // Sources & Categories
  if (config.sources?.count) command += ` --sources ${config.sources.count}`;
  if (config.categories?.count) command += ` --categories ${config.categories.count}`;
  
  // Reviews
  if (config.reviews?.enabled && config.reviews.reviewsPerBrief) {
    command += ` --reviews-per-brief ${config.reviews.reviewsPerBrief[0]},${config.reviews.reviewsPerBrief[1]}`;
  }
  if (config.aiReviews?.enabled && config.aiReviews.aiReviewsPerBrief) {
    command += ` --ai-reviews-per-brief ${config.aiReviews.aiReviewsPerBrief[0]},${config.aiReviews.aiReviewsPerBrief[1]}`;
  }
  
  // Engagement
  if (config.upvotes?.enabled) {
    if (config.upvotes.briefUpvoteRatio !== 0.6) {
      command += ` --brief-upvote-ratio ${config.upvotes.briefUpvoteRatio}`;
    }
  }
  
  if (config.savedBriefs?.enabled) {
    if (config.savedBriefs.saveRatio !== 0.3) {
      command += ` --save-ratio ${config.savedBriefs.saveRatio}`;
    }
  }
  
  // Tokens
  if (config.tokens?.enabled) {
    if (config.tokens.purchaseRatio !== 0.2) {
      command += ` --purchase-ratio ${config.tokens.purchaseRatio}`;
    }
    if (config.tokens.whaleRatio && config.tokens.whaleRatio > 0) {
      command += ` --whale-ratio ${config.tokens.whaleRatio}`;
    }
  }
  
  // Exports
  if (config.exports?.enabled && config.exports.exportsPerUser) {
    command += ` --exports-per-user ${config.exports.exportsPerUser[0]},${config.exports.exportsPerUser[1]}`;
  }

  // Data skew flags
  if (config.dataSkew?.powerUsers) command += ' --power-users';
  if (config.dataSkew?.viralBriefs) command += ' --viral-briefs';
  if (config.dataSkew?.controversialContent) command += ' --controversial';
  if (config.dataSkew?.timeDistribution && config.dataSkew.timeDistribution !== 'uniform') {
    command += ` --time-dist ${config.dataSkew.timeDistribution}`;
  }
  if (config.dataSkew?.startDate) {
    command += ` --start-date ${config.dataSkew.startDate.toISOString().split('T')[0]}`;
  }
  if (config.dataSkew?.endDate) {
    command += ` --end-date ${config.dataSkew.endDate.toISOString().split('T')[0]}`;
  }
  
  return command;
}