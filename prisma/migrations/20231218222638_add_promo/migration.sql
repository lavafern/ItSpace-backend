/*
  Warnings:

  - You are about to drop the column `code` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_code_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "code";

-- CreateTable
CREATE TABLE "Promo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePromo" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER,
    "promoId" INTEGER NOT NULL,

    CONSTRAINT "CoursePromo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CoursePromo" ADD CONSTRAINT "CoursePromo_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePromo" ADD CONSTRAINT "CoursePromo_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
