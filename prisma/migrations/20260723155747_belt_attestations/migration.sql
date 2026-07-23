-- CreateTable
CREATE TABLE "attestation_requests" (
    "id" SERIAL NOT NULL,
    "trainer_id" INTEGER NOT NULL,
    "chairman_id" INTEGER,
    "attestation_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attestation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestation_athletes" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "requested_belt_id" INTEGER NOT NULL,

    CONSTRAINT "attestation_athletes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attestation_athletes_request_id_athlete_id_key" ON "attestation_athletes"("request_id", "athlete_id");

-- AddForeignKey
ALTER TABLE "attestation_requests" ADD CONSTRAINT "attestation_requests_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestation_requests" ADD CONSTRAINT "attestation_requests_chairman_id_fkey" FOREIGN KEY ("chairman_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestation_athletes" ADD CONSTRAINT "attestation_athletes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "attestation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestation_athletes" ADD CONSTRAINT "attestation_athletes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestation_athletes" ADD CONSTRAINT "attestation_athletes_requested_belt_id_fkey" FOREIGN KEY ("requested_belt_id") REFERENCES "belts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
