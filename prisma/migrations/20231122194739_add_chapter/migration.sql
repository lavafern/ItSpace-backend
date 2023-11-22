/*
  Warnings:

  - You are about to drop the column `courseId` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `isPremium` on the `Video` table. All the data in the column will be lost.
  - Made the column `courseId` on table `Enrollment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `courseId` on table `Mentor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `videoId` on table `Progress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `courseId` on table `Rating` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `chapterId` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Mentor" DROP CONSTRAINT "Mentor_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Progress" DROP CONSTRAINT "Progress_videoId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_courseId_fkey";

-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "courseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Mentor" ALTER COLUMN "courseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Progress" ALTER COLUMN "videoId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Rating" ALTER COLUMN "courseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "courseId",
DROP COLUMN "isPremium",
ADD COLUMN     "chapterId" INTEGER NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "isPremium" BOOLEAN NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
