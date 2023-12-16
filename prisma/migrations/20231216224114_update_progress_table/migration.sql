/*
  Warnings:

  - You are about to drop the column `completed` on the `Progress` table. All the data in the column will be lost.
  - Added the required column `completedDate` to the `Progress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Progress" DROP COLUMN "completed",
ADD COLUMN     "completedDate" TIMESTAMP(3) NOT NULL;
