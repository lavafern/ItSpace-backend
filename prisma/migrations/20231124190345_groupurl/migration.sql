/*
  Warnings:

  - You are about to drop the column `group` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "group",
ADD COLUMN     "groupUrl" TEXT;
