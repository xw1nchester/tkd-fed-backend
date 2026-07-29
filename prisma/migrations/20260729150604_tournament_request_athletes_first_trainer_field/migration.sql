/*
  Warnings:

  - Added the required column `first_trainer` to the `tournament_request_athletes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournament_request_athletes" ADD COLUMN     "first_trainer" TEXT NOT NULL;
