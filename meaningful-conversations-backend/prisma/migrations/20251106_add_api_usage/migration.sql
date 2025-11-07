-- CreateTable
CREATE TABLE `ApiUsage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `isGuest` BOOLEAN NOT NULL DEFAULT true,
    `endpoint` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `botId` VARCHAR(191) NULL,
    `inputTokens` INTEGER NOT NULL DEFAULT 0,
    `outputTokens` INTEGER NOT NULL DEFAULT 0,
    `totalTokens` INTEGER NOT NULL DEFAULT 0,
    `estimatedCostUSD` DECIMAL(10, 6) NOT NULL DEFAULT 0,
    `durationMs` INTEGER NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApiUsage_userId_idx`(`userId`),
    INDEX `ApiUsage_createdAt_idx`(`createdAt`),
    INDEX `ApiUsage_model_idx`(`model`),
    INDEX `ApiUsage_endpoint_idx`(`endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

