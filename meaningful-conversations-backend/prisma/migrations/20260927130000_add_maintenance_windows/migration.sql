-- CreateTable
CREATE TABLE `maintenance_windows` (
    `id` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `announceAt` DATETIME(3) NOT NULL,
    `titleDe` VARCHAR(200) NOT NULL,
    `titleEn` VARCHAR(200) NOT NULL,
    `bodyDe` TEXT NOT NULL,
    `bodyEn` TEXT NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `maintenance_windows_announceAt_idx`(`announceAt`),
    INDEX `maintenance_windows_startsAt_idx`(`startsAt`),
    INDEX `maintenance_windows_archivedAt_idx`(`archivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
