-- CreateEnum
CREATE TYPE "BeltRankType" AS ENUM ('GEUP', 'DAN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "belt_id" INTEGER;

-- CreateTable
CREATE TABLE "belts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "stripe_color" TEXT NOT NULL,
    "rank_type" "BeltRankType" NOT NULL,
    "rank_number" INTEGER NOT NULL,

    CONSTRAINT "belts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_belt_id_fkey" FOREIGN KEY ("belt_id") REFERENCES "belts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
