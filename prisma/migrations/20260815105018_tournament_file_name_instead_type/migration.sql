/*
  Warnings:

  - You are about to drop the column `type` on the `tournament_files` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tournament_files" DROP COLUMN "type",
ADD COLUMN     "name" TEXT;

-- DropEnum
DROP TYPE "TournamentFileType";
