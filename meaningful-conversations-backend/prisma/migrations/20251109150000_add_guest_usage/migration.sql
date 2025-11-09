-- CreateTable
CREATE TABLE `GuestUsage` (
    `id` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `messageCount` INTEGER NOT NULL DEFAULT 0,
    `weekStart` DATETIME(3) NOT NULL,
    `lastUsed` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `GuestUsage_fingerprint_key`(`fingerprint`),
    INDEX `GuestUsage_fingerprint_idx`(`fingerprint`),
    INDEX `GuestUsage_weekStart_idx`(`weekStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

