-- CreateEnum
CREATE TYPE "TournamentFileType" AS ENUM ('REGULATION', 'OTHER');

-- CreateTable
CREATE TABLE "tournament_files" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "type" "TournamentFileType" NOT NULL,
    "file_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tournament_files" ADD CONSTRAINT "tournament_files_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_files" ADD CONSTRAINT "tournament_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
