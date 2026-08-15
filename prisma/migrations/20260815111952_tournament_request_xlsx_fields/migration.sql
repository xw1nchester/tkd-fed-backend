-- AlterTable
ALTER TABLE "tournament_requests" ADD COLUMN     "approval_organization_line_1" TEXT,
ADD COLUMN     "approval_organization_line_2" TEXT,
ADD COLUMN     "approval_person_name" TEXT,
ADD COLUMN     "athlete_city" TEXT,
ADD COLUMN     "athlete_federal_district" TEXT,
ADD COLUMN     "athlete_sports_society" TEXT,
ADD COLUMN     "team_representative_name" TEXT;
