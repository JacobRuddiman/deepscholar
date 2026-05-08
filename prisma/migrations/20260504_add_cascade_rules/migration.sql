-- Add CASCADE rules to foreign key constraints

-- EmailSend → User
ALTER TABLE "EmailSend" DROP CONSTRAINT IF EXISTS "EmailSend_sentBy_fkey";
ALTER TABLE "EmailSend" ADD CONSTRAINT "EmailSend_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ScheduledEmail → User
ALTER TABLE "ScheduledEmail" DROP CONSTRAINT IF EXISTS "ScheduledEmail_sentBy_fkey";
ALTER TABLE "ScheduledEmail" ADD CONSTRAINT "ScheduledEmail_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Brief.parentBriefId → Brief (SET NULL)
ALTER TABLE "Brief" DROP CONSTRAINT IF EXISTS "Brief_parentBriefId_fkey";
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_parentBriefId_fkey" FOREIGN KEY ("parentBriefId") REFERENCES "Brief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Review → User
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_userId_fkey";
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review → Brief
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_briefId_fkey";
ALTER TABLE "Review" ADD CONSTRAINT "Review_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AIReview → Brief
ALTER TABLE "AIReview" DROP CONSTRAINT IF EXISTS "AIReview_briefId_fkey";
ALTER TABLE "AIReview" ADD CONSTRAINT "AIReview_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BriefUpvote → User
ALTER TABLE "BriefUpvote" DROP CONSTRAINT IF EXISTS "BriefUpvote_userId_fkey";
ALTER TABLE "BriefUpvote" ADD CONSTRAINT "BriefUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BriefUpvote → Brief
ALTER TABLE "BriefUpvote" DROP CONSTRAINT IF EXISTS "BriefUpvote_briefId_fkey";
ALTER TABLE "BriefUpvote" ADD CONSTRAINT "BriefUpvote_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ReviewUpvote → User
ALTER TABLE "ReviewUpvote" DROP CONSTRAINT IF EXISTS "ReviewUpvote_userId_fkey";
ALTER TABLE "ReviewUpvote" ADD CONSTRAINT "ReviewUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ReviewUpvote → Review
ALTER TABLE "ReviewUpvote" DROP CONSTRAINT IF EXISTS "ReviewUpvote_reviewId_fkey";
ALTER TABLE "ReviewUpvote" ADD CONSTRAINT "ReviewUpvote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedBrief → Brief
ALTER TABLE "SavedBrief" DROP CONSTRAINT IF EXISTS "SavedBrief_briefId_fkey";
ALTER TABLE "SavedBrief" ADD CONSTRAINT "SavedBrief_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedBrief → User
ALTER TABLE "SavedBrief" DROP CONSTRAINT IF EXISTS "SavedBrief_userId_fkey";
ALTER TABLE "SavedBrief" ADD CONSTRAINT "SavedBrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BriefView → Brief
ALTER TABLE "BriefView" DROP CONSTRAINT IF EXISTS "BriefView_briefId_fkey";
ALTER TABLE "BriefView" ADD CONSTRAINT "BriefView_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BriefView → User
ALTER TABLE "BriefView" DROP CONSTRAINT IF EXISTS "BriefView_userId_fkey";
ALTER TABLE "BriefView" ADD CONSTRAINT "BriefView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserToken → User
ALTER TABLE "UserToken" DROP CONSTRAINT IF EXISTS "UserToken_userId_fkey";
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TokenTransaction → Brief (SET NULL)
ALTER TABLE "TokenTransaction" DROP CONSTRAINT IF EXISTS "TokenTransaction_briefId_fkey";
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TokenTransaction → User
ALTER TABLE "TokenTransaction" DROP CONSTRAINT IF EXISTS "TokenTransaction_userId_fkey";
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TokenPurchase → User
ALTER TABLE "TokenPurchase" DROP CONSTRAINT IF EXISTS "TokenPurchase_userId_fkey";
ALTER TABLE "TokenPurchase" ADD CONSTRAINT "TokenPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ReviewHelpful → User
ALTER TABLE "ReviewHelpful" DROP CONSTRAINT IF EXISTS "ReviewHelpful_userId_fkey";
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ExportHistory → User
ALTER TABLE "ExportHistory" DROP CONSTRAINT IF EXISTS "ExportHistory_userId_fkey";
ALTER TABLE "ExportHistory" ADD CONSTRAINT "ExportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ExportUsage → User
ALTER TABLE "ExportUsage" DROP CONSTRAINT IF EXISTS "ExportUsage_userId_fkey";
ALTER TABLE "ExportUsage" ADD CONSTRAINT "ExportUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
