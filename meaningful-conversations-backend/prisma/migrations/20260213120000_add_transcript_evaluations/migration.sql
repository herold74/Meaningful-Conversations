-- CreateTable
CREATE TABLE `transcript_evaluations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `preAnswers` TEXT NOT NULL,
    `evaluationData` TEXT NOT NULL,
    `lang` VARCHAR(191) NOT NULL DEFAULT 'de',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transcript_evaluations_userId_idx`(`userId`),
    INDEX `transcript_evaluations_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transcript_evaluations` ADD CONSTRAINT `transcript_evaluations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
