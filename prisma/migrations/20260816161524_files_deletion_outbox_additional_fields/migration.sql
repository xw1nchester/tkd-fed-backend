-- AlterTable
ALTER TABLE "pending_file_deletions" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "locked_at" TIMESTAMP(3);
