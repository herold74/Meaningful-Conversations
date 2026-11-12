-- CreateTable
CREATE TABLE `connector_run_stats` (
    `id` VARCHAR(191) NOT NULL,
    `overallScore` INTEGER NOT NULL,
    `empathy` INTEGER NOT NULL,
    `presence` INTEGER NOT NULL,
    `curiosity` INTEGER NOT NULL,
    `nonJudgment` INTEGER NOT NULL,
    `steadiness` INTEGER NOT NULL,
    `vignetteIds` JSON NOT NULL,
    `endTypes` JSON NOT NULL,
    `lang` VARCHAR(191) NOT NULL DEFAULT 'de',
    `liveMode` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `connector_run_stats_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
