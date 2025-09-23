/*
  Warnings:

  - You are about to drop the column `annualFee` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `applyUrl` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `creditRequirement` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `defaultCashback` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `defaultPoints` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `issuer` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `network` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `signupBonus` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `signupSpendReq` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `signupTimeReq` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the `card_benefits` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `credit_cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `additionalBenefits` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerSatisfactionScore` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eligibilityRequirements` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feeStructure` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuerId` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `networkId` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rewardStructure` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `credit_cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "credit_cards_issuer_idx";

-- DropIndex
DROP INDEX "credit_cards_tier_idx";

-- AlterTable
ALTER TABLE "credit_cards" DROP COLUMN "annualFee",
DROP COLUMN "applyUrl",
DROP COLUMN "creditRequirement",
DROP COLUMN "defaultCashback",
DROP COLUMN "defaultPoints",
DROP COLUMN "imageUrl",
DROP COLUMN "issuer",
DROP COLUMN "network",
DROP COLUMN "signupBonus",
DROP COLUMN "signupSpendReq",
DROP COLUMN "signupTimeReq",
DROP COLUMN "tier",
ADD COLUMN     "additionalBenefits" JSONB NOT NULL,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "customerSatisfactionScore" DECIMAL(2,1) NOT NULL,
ADD COLUMN     "eligibilityRequirements" JSONB NOT NULL,
ADD COLUMN     "feeStructure" JSONB NOT NULL,
ADD COLUMN     "iconName" TEXT,
ADD COLUMN     "isLifetimeFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issuerId" TEXT NOT NULL,
ADD COLUMN     "lastUpdated" TIMESTAMP(3),
ADD COLUMN     "launchDate" TIMESTAMP(3),
ADD COLUMN     "networkId" TEXT NOT NULL,
ADD COLUMN     "popularityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recommendationScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rewardStructure" JSONB NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "subCategoryId" TEXT,
ADD COLUMN     "uniqueFeatures" TEXT[];

-- DropTable
DROP TABLE "card_benefits";

-- CreateTable
CREATE TABLE "card_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_sub_categories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_networks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_issuers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "marketShare" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_issuers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "mccCodes" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accelerated_rewards" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "rewardCategoryId" TEXT,
    "merchantPatterns" TEXT[],
    "rewardRate" DECIMAL(5,2) NOT NULL,
    "conditions" TEXT[],
    "cappingLimit" DECIMAL(10,2),
    "cappingPeriod" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accelerated_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_categories_slug_key" ON "card_categories"("slug");

-- CreateIndex
CREATE INDEX "card_categories_slug_idx" ON "card_categories"("slug");

-- CreateIndex
CREATE INDEX "card_sub_categories_categoryId_idx" ON "card_sub_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "card_sub_categories_categoryId_slug_key" ON "card_sub_categories"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "card_networks_slug_key" ON "card_networks"("slug");

-- CreateIndex
CREATE INDEX "card_networks_slug_idx" ON "card_networks"("slug");

-- CreateIndex
CREATE INDEX "card_networks_isActive_idx" ON "card_networks"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "card_issuers_slug_key" ON "card_issuers"("slug");

-- CreateIndex
CREATE INDEX "card_issuers_slug_idx" ON "card_issuers"("slug");

-- CreateIndex
CREATE INDEX "card_issuers_isActive_idx" ON "card_issuers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "reward_categories_slug_key" ON "reward_categories"("slug");

-- CreateIndex
CREATE INDEX "reward_categories_slug_idx" ON "reward_categories"("slug");

-- CreateIndex
CREATE INDEX "accelerated_rewards_cardId_idx" ON "accelerated_rewards"("cardId");

-- CreateIndex
CREATE INDEX "accelerated_rewards_rewardCategoryId_idx" ON "accelerated_rewards"("rewardCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_cards_slug_key" ON "credit_cards"("slug");

-- CreateIndex
CREATE INDEX "credit_cards_slug_idx" ON "credit_cards"("slug");

-- CreateIndex
CREATE INDEX "credit_cards_issuerId_idx" ON "credit_cards"("issuerId");

-- CreateIndex
CREATE INDEX "credit_cards_networkId_idx" ON "credit_cards"("networkId");

-- CreateIndex
CREATE INDEX "credit_cards_categoryId_idx" ON "credit_cards"("categoryId");

-- CreateIndex
CREATE INDEX "credit_cards_subCategoryId_idx" ON "credit_cards"("subCategoryId");

-- CreateIndex
CREATE INDEX "credit_cards_isLifetimeFree_idx" ON "credit_cards"("isLifetimeFree");

-- CreateIndex
CREATE INDEX "credit_cards_popularityScore_idx" ON "credit_cards"("popularityScore");

-- AddForeignKey
ALTER TABLE "card_sub_categories" ADD CONSTRAINT "card_sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "card_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "card_issuers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "card_networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "card_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "card_sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accelerated_rewards" ADD CONSTRAINT "accelerated_rewards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accelerated_rewards" ADD CONSTRAINT "accelerated_rewards_rewardCategoryId_fkey" FOREIGN KEY ("rewardCategoryId") REFERENCES "reward_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
