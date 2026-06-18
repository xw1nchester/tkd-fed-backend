/*
  Warnings:

  - You are about to drop the column `adminId` on the `rating_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `rating_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `rating_transactions` table. All the data in the column will be lost.
  - Added the required column `admin_id` to the `rating_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `rating_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rating_transactions" DROP CONSTRAINT "rating_transactions_adminId_fkey";

-- DropForeignKey
ALTER TABLE "rating_transactions" DROP CONSTRAINT "rating_transactions_userId_fkey";

-- AlterTable
ALTER TABLE "rating_transactions" DROP COLUMN "adminId",
DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "admin_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "rating_transactions" ADD CONSTRAINT "rating_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_transactions" ADD CONSTRAINT "rating_transactions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
