-- AlterTable
ALTER TABLE "users" ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "rating_transactions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rating_transactions" ADD CONSTRAINT "rating_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_transactions" ADD CONSTRAINT "rating_transactions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
