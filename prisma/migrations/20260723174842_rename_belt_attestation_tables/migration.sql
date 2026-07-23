/*
  Warnings:

  - You are about to drop the `attestation_athletes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attestation_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "attestation_athletes" DROP CONSTRAINT "attestation_athletes_athlete_id_fkey";

-- DropForeignKey
ALTER TABLE "attestation_athletes" DROP CONSTRAINT "attestation_athletes_request_id_fkey";

-- DropForeignKey
ALTER TABLE "attestation_athletes" DROP CONSTRAINT "attestation_athletes_requested_belt_id_fkey";

-- DropForeignKey
ALTER TABLE "attestation_requests" DROP CONSTRAINT "attestation_requests_chairman_id_fkey";

-- DropForeignKey
ALTER TABLE "attestation_requests" DROP CONSTRAINT "attestation_requests_trainer_id_fkey";

-- DropTable
DROP TABLE "attestation_athletes";

-- DropTable
DROP TABLE "attestation_requests";

-- CreateTable
CREATE TABLE "belt_attestation_requests" (
    "id" SERIAL NOT NULL,
    "trainer_id" INTEGER NOT NULL,
    "chairman_id" INTEGER,
    "attestation_date" TIMESTAMP(3) NOT NULL,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "belt_attestation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belt_attestation_athletes" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "requested_belt_id" INTEGER NOT NULL,

    CONSTRAINT "belt_attestation_athletes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "belt_attestation_athletes_request_id_athlete_id_key" ON "belt_attestation_athletes"("request_id", "athlete_id");

-- AddForeignKey
ALTER TABLE "belt_attestation_requests" ADD CONSTRAINT "belt_attestation_requests_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belt_attestation_requests" ADD CONSTRAINT "belt_attestation_requests_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belt_attestation_athletes" ADD CONSTRAINT "belt_attestation_athletes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "belt_attestation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belt_attestation_athletes" ADD CONSTRAINT "belt_attestation_athletes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belt_attestation_athletes" ADD CONSTRAINT "belt_attestation_athletes_requested_belt_id_fkey" FOREIGN KEY ("requested_belt_id") REFERENCES "belts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
