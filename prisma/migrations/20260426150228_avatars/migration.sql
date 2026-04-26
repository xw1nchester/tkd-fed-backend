-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_key" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
