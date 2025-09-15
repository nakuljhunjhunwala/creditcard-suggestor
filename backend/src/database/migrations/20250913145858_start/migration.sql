/*
  Warnings:

  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guardians` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `section_staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_guardians` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `terms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "attendance";

-- DropTable
DROP TABLE "attendance_codes";

-- DropTable
DROP TABLE "courses";

-- DropTable
DROP TABLE "enrollments";

-- DropTable
DROP TABLE "guardians";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "schools";

-- DropTable
DROP TABLE "section_staff";

-- DropTable
DROP TABLE "sections";

-- DropTable
DROP TABLE "staff";

-- DropTable
DROP TABLE "student_guardians";

-- DropTable
DROP TABLE "students";

-- DropTable
DROP TABLE "sync_configs";

-- DropTable
DROP TABLE "sync_jobs";

-- DropTable
DROP TABLE "terms";

-- DropTable
DROP TABLE "user_types";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "UserTypeEnum";

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "estimatedTime" INTEGER,
    "inputData" JSONB,
    "outputData" JSONB,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryAfter" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DECIMAL(10,2),
    "topCategory" TEXT,
    "totalTransactions" INTEGER,
    "categorizedCount" INTEGER,
    "unknownMccCount" INTEGER,
    "newMccDiscovered" INTEGER,
    "filePath" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "annualFee" DECIMAL(8,2) NOT NULL,
    "signupBonus" DECIMAL(10,2),
    "signupSpendReq" DECIMAL(10,2),
    "signupTimeReq" INTEGER,
    "defaultCashback" DECIMAL(4,3) NOT NULL,
    "defaultPoints" DECIMAL(4,3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tier" TEXT NOT NULL,
    "creditRequirement" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "applyUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_benefits" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "categoryId" TEXT,
    "subCategoryId" TEXT,
    "mccCodes" TEXT[],
    "rate" DECIMAL(4,3) NOT NULL,
    "maxSpend" DECIMAL(10,2),
    "maxEarning" DECIMAL(10,2),
    "isRotating" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "quarterActive" INTEGER[],
    "minSpend" DECIMAL(8,2),
    "multiplier" DECIMAL(3,2),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcc_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "discoveryMethod" TEXT NOT NULL DEFAULT 'manual',
    "confidence" DECIMAL(3,2),
    "discoveredBy" TEXT,
    "verifiedCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "merchantPatterns" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcc_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "merchant" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "mccCode" TEXT,
    "categoryId" TEXT,
    "subCategoryId" TEXT,
    "categoryName" TEXT,
    "subCategoryName" TEXT,
    "mccStatus" TEXT NOT NULL DEFAULT 'pending',
    "mccConfidence" DECIMAL(3,2),
    "aiSearchQuery" TEXT,
    "aiSearchResult" JSONB,
    "rawDescription" TEXT,
    "confidence" DECIMAL(3,2),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "originalIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "rank" INTEGER NOT NULL,
    "potentialSavings" DECIMAL(10,2) NOT NULL,
    "currentEarnings" DECIMAL(10,2) NOT NULL,
    "yearlyEstimate" DECIMAL(10,2) NOT NULL,
    "benefitBreakdown" JSONB NOT NULL,
    "primaryReason" TEXT NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "signupBonusValue" DECIMAL(10,2),
    "feeBreakeven" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_aliases" (
    "id" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "aliases" TEXT[],
    "mccCode" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processing_jobs_sessionId_idx" ON "processing_jobs"("sessionId");

-- CreateIndex
CREATE INDEX "processing_jobs_status_idx" ON "processing_jobs"("status");

-- CreateIndex
CREATE INDEX "processing_jobs_jobType_idx" ON "processing_jobs"("jobType");

-- CreateIndex
CREATE INDEX "processing_jobs_priority_idx" ON "processing_jobs"("priority");

-- CreateIndex
CREATE INDEX "processing_jobs_queuedAt_idx" ON "processing_jobs"("queuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "credit_cards_issuer_idx" ON "credit_cards"("issuer");

-- CreateIndex
CREATE INDEX "credit_cards_isActive_idx" ON "credit_cards"("isActive");

-- CreateIndex
CREATE INDEX "credit_cards_tier_idx" ON "credit_cards"("tier");

-- CreateIndex
CREATE INDEX "card_benefits_cardId_idx" ON "card_benefits"("cardId");

-- CreateIndex
CREATE INDEX "card_benefits_categoryId_idx" ON "card_benefits"("categoryId");

-- CreateIndex
CREATE INDEX "card_benefits_benefitType_idx" ON "card_benefits"("benefitType");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "sub_categories_categoryId_idx" ON "sub_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_categoryId_slug_key" ON "sub_categories"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "mcc_codes_code_key" ON "mcc_codes"("code");

-- CreateIndex
CREATE INDEX "mcc_codes_code_idx" ON "mcc_codes"("code");

-- CreateIndex
CREATE INDEX "mcc_codes_categoryId_idx" ON "mcc_codes"("categoryId");

-- CreateIndex
CREATE INDEX "mcc_codes_isActive_idx" ON "mcc_codes"("isActive");

-- CreateIndex
CREATE INDEX "mcc_codes_discoveryMethod_idx" ON "mcc_codes"("discoveryMethod");

-- CreateIndex
CREATE INDEX "transactions_sessionId_idx" ON "transactions"("sessionId");

-- CreateIndex
CREATE INDEX "transactions_mccCode_idx" ON "transactions"("mccCode");

-- CreateIndex
CREATE INDEX "transactions_categoryId_idx" ON "transactions"("categoryId");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_mccStatus_idx" ON "transactions"("mccStatus");

-- CreateIndex
CREATE INDEX "recommendations_sessionId_idx" ON "recommendations"("sessionId");

-- CreateIndex
CREATE INDEX "recommendations_cardId_idx" ON "recommendations"("cardId");

-- CreateIndex
CREATE INDEX "recommendations_score_idx" ON "recommendations"("score");

-- CreateIndex
CREATE UNIQUE INDEX "app_config_key_key" ON "app_config"("key");

-- CreateIndex
CREATE INDEX "merchant_aliases_merchantName_idx" ON "merchant_aliases"("merchantName");

-- CreateIndex
CREATE INDEX "merchant_aliases_mccCode_idx" ON "merchant_aliases"("mccCode");
