-- CreateTable
CREATE TABLE `practice_evaluations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `frameworkId` VARCHAR(191) NOT NULL,
    `scenarioId` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'moderate',
    `focusNote` TEXT NULL,
    `evaluationData` TEXT NOT NULL,
    `lang` VARCHAR(191) NOT NULL DEFAULT 'de',
    `selfRating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `practice_evaluations_userId_idx`(`userId`),
    INDEX `practice_evaluations_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `practice_evaluations` ADD CONSTRAINT `practice_evaluations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
