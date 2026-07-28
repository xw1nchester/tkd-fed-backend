-- CreateTable
CREATE TABLE "TournamentRequest" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "trainer_id" INTEGER NOT NULL,
    "organization" TEXT NOT NULL,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentRequestAthlete" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "weight_category_id" INTEGER NOT NULL,

    CONSTRAINT "TournamentRequestAthlete_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TournamentRequest" ADD CONSTRAINT "TournamentRequest_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRequest" ADD CONSTRAINT "TournamentRequest_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRequestAthlete" ADD CONSTRAINT "TournamentRequestAthlete_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "TournamentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRequestAthlete" ADD CONSTRAINT "TournamentRequestAthlete_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRequestAthlete" ADD CONSTRAINT "TournamentRequestAthlete_weight_category_id_fkey" FOREIGN KEY ("weight_category_id") REFERENCES "weight_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
