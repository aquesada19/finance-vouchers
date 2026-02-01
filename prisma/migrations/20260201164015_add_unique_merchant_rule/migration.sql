/*
  Warnings:

  - A unique constraint covering the columns `[userId,name,pattern,categoryId]` on the table `MerchantRule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MerchantRule_userId_name_pattern_categoryId_key" ON "MerchantRule"("userId", "name", "pattern", "categoryId");
