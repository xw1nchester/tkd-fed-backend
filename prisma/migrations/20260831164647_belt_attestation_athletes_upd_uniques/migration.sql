/*
  Warnings:

  - A unique constraint covering the columns `[certificate_region_code,certificate_serial]` on the table `belt_attestation_athletes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "belt_attestation_athletes_certificate_region_code_certifica_key";

-- CreateIndex
CREATE UNIQUE INDEX "belt_attestation_athletes_certificate_region_code_certifica_key" ON "belt_attestation_athletes"("certificate_region_code", "certificate_serial");
