/*
  Warnings:

  - Made the column `completed` on table `Enrollment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "completed" SET NOT NULL,
ALTER COLUMN "completed" SET DEFAULT false;
