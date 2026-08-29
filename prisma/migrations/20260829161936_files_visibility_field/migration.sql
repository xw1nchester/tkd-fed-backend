-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "visibility" "FileVisibility" NOT NULL DEFAULT 'PUBLIC';
