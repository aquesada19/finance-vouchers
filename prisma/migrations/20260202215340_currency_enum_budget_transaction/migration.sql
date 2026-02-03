/*
  Warnings:

  - Changed the type of `currency` on the `Budget` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `currency` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CRC', 'USD');

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_categoryId_month_currency_key" ON "Budget"("userId", "categoryId", "month", "currency");

-- CreateIndex
CREATE INDEX "Transaction_userId_currency_idx" ON "Transaction"("userId", "currency");
