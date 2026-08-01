/*
  Warnings:

  - You are about to drop the column `weight` on the `weight_categories` table. All the data in the column will be lost.
  - Added the required column `age_category_id` to the `weight_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "weight_categories" DROP COLUMN "weight",
ADD COLUMN     "age_category_id" INTEGER NOT NULL,
ADD COLUMN     "max_weight" INTEGER,
ADD COLUMN     "min_weight" INTEGER;

-- AddForeignKey
ALTER TABLE "weight_categories" ADD CONSTRAINT "weight_categories_age_category_id_fkey" FOREIGN KEY ("age_category_id") REFERENCES "age_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
