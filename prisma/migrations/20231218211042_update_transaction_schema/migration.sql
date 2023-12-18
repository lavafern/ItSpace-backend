/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VIRTUAL_ACCOUNT', 'GERAI_RETAIL', 'E_WALLET');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "code" TEXT NOT NULL,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_code_key" ON "Transaction"("code");
