/*
  Warnings:

  - You are about to drop the column `priority` on the `MerchantRule` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "MerchantRule_userId_priority_idx";

-- AlterTable
ALTER TABLE "MerchantRule" DROP COLUMN "priority";
