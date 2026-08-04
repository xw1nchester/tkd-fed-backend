/*
  Warnings:

  - You are about to drop the column `banner` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `tournaments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "banner",
DROP COLUMN "logo",
ADD COLUMN     "banner_id" INTEGER,
ADD COLUMN     "logo_id" INTEGER;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
