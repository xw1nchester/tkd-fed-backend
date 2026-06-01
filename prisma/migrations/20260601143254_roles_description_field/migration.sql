/*
  Warnings:

  - You are about to drop the column `creatorId` on the `teams` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_creatorId_fkey";

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "creatorId",
ADD COLUMN     "creator_id" INTEGER;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
