-- AlterTable
ALTER TABLE "belt_attestation_athletes" ADD COLUMN     "current_belt_id" INTEGER;

-- AddForeignKey
ALTER TABLE "belt_attestation_athletes" ADD CONSTRAINT "belt_attestation_athletes_current_belt_id_fkey" FOREIGN KEY ("current_belt_id") REFERENCES "belts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
