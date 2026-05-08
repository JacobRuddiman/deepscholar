// @ts-nocheck - Seed file, not production code
import { db } from "@/server/db";

// Delete all seed data from database
export async function deleteAllData() {
  await db.$transaction([
    db.exportUsage.deleteMany(),
    db.exportHistory.deleteMany(),
    db.reviewHelpful.deleteMany(),
    db.tokenPurchase.deleteMany(),
    db.tokenTransaction.deleteMany(),
    db.userToken.deleteMany(),
    db.briefView.deleteMany(),
    db.savedBrief.deleteMany(),
    db.reviewUpvote.deleteMany(),
    db.briefUpvote.deleteMany(),
    db.aIReview.deleteMany(),
    db.review.deleteMany(),
    db.briefReference.deleteMany(),
    db.brief.deleteMany(),
    db.category.deleteMany(),
    db.source.deleteMany(),
    db.reviewAIModel.deleteMany(),
    db.researchAIModel.deleteMany(),
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.verificationToken.deleteMany(),
    db.user.deleteMany(),
  ]);
}

// Delete data from specific tables
export async function deleteTableData(tables: string[]) {
  const deletions = [];

  for (const table of tables) {
    switch (table.toLowerCase()) {
      case 'users':
        deletions.push(
          db.exportUsage.deleteMany(),
          db.exportHistory.deleteMany(),
          db.reviewHelpful.deleteMany(),
          db.tokenPurchase.deleteMany(),
          db.tokenTransaction.deleteMany(),
          db.userToken.deleteMany(),
          db.briefView.deleteMany(),
          db.savedBrief.deleteMany(),
          db.reviewUpvote.deleteMany(),
          db.briefUpvote.deleteMany(),
          db.review.deleteMany(),
          db.brief.deleteMany(),
          db.session.deleteMany(),
          db.account.deleteMany(),
          db.user.deleteMany()
        );
        break;
      case 'briefs':
        deletions.push(
          db.exportHistory.deleteMany({ where: { exportType: 'brief' } }),
          db.reviewHelpful.deleteMany(),
          db.briefView.deleteMany(),
          db.savedBrief.deleteMany(),
          db.reviewUpvote.deleteMany(),
          db.briefUpvote.deleteMany(),
          db.aIReview.deleteMany(),
          db.review.deleteMany(),
          db.briefReference.deleteMany(),
          db.brief.deleteMany()
        );
        break;
      case 'reviews':
        deletions.push(
          db.reviewHelpful.deleteMany(),
          db.reviewUpvote.deleteMany(),
          db.aIReview.deleteMany(),
          db.review.deleteMany()
        );
        break;
      case 'categories':
        deletions.push(db.category.deleteMany());
        break;
      case 'sources':
        deletions.push(
          db.briefReference.deleteMany(),
          db.source.deleteMany()
        );
        break;
      case 'tokens':
        deletions.push(
          db.tokenPurchase.deleteMany(),
          db.tokenTransaction.deleteMany(),
          db.userToken.deleteMany()
        );
        break;
    }
  }

  if (deletions.length > 0) {
    await db.$transaction(deletions);
  }
}
