/*
  Warnings:

  - Changed the type of `isPremium` on the `Course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "isPremium",
ADD COLUMN     "isPremium" BOOLEAN NOT NULL;
