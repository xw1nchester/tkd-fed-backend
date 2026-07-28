/*
  Warnings:

  - You are about to drop the `TournamentRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentRequestAthlete` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TournamentRequest" DROP CONSTRAINT "TournamentRequest_tournament_id_fkey";

-- DropForeignKey
ALTER TABLE "TournamentRequest" DROP CONSTRAINT "TournamentRequest_trainer_id_fkey";

-- DropForeignKey
ALTER TABLE "TournamentRequestAthlete" DROP CONSTRAINT "TournamentRequestAthlete_athlete_id_fkey";

-- DropForeignKey
ALTER TABLE "TournamentRequestAthlete" DROP CONSTRAINT "TournamentRequestAthlete_request_id_fkey";

-- DropForeignKey
ALTER TABLE "TournamentRequestAthlete" DROP CONSTRAINT "TournamentRequestAthlete_weight_category_id_fkey";

-- DropTable
DROP TABLE "TournamentRequest";

-- DropTable
DROP TABLE "TournamentRequestAthlete";

-- CreateTable
CREATE TABLE "tournament_requests" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "trainer_id" INTEGER NOT NULL,
    "organization" TEXT NOT NULL,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_request_athletes" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "weight_category_id" INTEGER NOT NULL,

    CONSTRAINT "tournament_request_athletes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tournament_requests" ADD CONSTRAINT "tournament_requests_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_requests" ADD CONSTRAINT "tournament_requests_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_request_athletes" ADD CONSTRAINT "tournament_request_athletes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tournament_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_request_athletes" ADD CONSTRAINT "tournament_request_athletes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_request_athletes" ADD CONSTRAINT "tournament_request_athletes_weight_category_id_fkey" FOREIGN KEY ("weight_category_id") REFERENCES "weight_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
