/*
  Warnings:

  - You are about to drop the column `logo_key` on the `teams` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "teams" DROP COLUMN "logo_key",
ADD COLUMN     "logo_id" INTEGER;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
