/*
  Warnings:

  - Added the required column `sort_order` to the `belts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "belts" ADD COLUMN     "sort_order" INTEGER NOT NULL;
