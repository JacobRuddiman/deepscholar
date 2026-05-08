-- AlterTable
ALTER TABLE "Brief" ADD COLUMN "referencesText" TEXT;
ALTER TABLE "Brief" ADD COLUMN "conversationTurns" JSONB;
ALTER TABLE "Brief" ADD COLUMN "selectedTurnIndex" INTEGER;
