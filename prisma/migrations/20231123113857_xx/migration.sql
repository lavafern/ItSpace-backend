/*
  Warnings:

  - You are about to drop the column `verivied` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "verivied",
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
