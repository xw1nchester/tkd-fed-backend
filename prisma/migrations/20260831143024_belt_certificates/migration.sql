/*
  Warnings:

  - A unique constraint covering the columns `[certificate_region_code,certificate_year,certificate_serial]` on the table `belt_attestation_athletes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "belt_attestation_athletes" ADD COLUMN     "certificate_issued_at" TIMESTAMP(3),
ADD COLUMN     "certificate_region_code" TEXT,
ADD COLUMN     "certificate_serial" INTEGER,
ADD COLUMN     "certificate_year" INTEGER;

-- CreateTable
CREATE TABLE "belt_certificate_counters" (
    "id" SERIAL NOT NULL,
    "region_code" TEXT NOT NULL,
    "next_serial" INTEGER NOT NULL,

    CONSTRAINT "belt_certificate_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "belt_certificate_counters_region_code_key" ON "belt_certificate_counters"("region_code");

-- CreateIndex
CREATE UNIQUE INDEX "belt_attestation_athletes_certificate_region_code_certifica_key" ON "belt_attestation_athletes"("certificate_region_code", "certificate_year", "certificate_serial");
