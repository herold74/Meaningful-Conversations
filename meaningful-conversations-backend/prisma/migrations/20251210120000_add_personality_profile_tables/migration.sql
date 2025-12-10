-- CreateTable
CREATE TABLE `personality_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `testType` VARCHAR(191) NOT NULL,
    `filterWorry` INTEGER NOT NULL,
    `filterControl` INTEGER NOT NULL,
    `encryptedData` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sessionCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `personality_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_behavior_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `dauerFrequency` INTEGER NOT NULL DEFAULT 0,
    `wechselFrequency` INTEGER NOT NULL DEFAULT 0,
    `naeheFrequency` INTEGER NOT NULL DEFAULT 0,
    `distanzFrequency` INTEGER NOT NULL DEFAULT 0,
    `comfortScore` INTEGER NULL,
    `optedOut` BOOLEAN NOT NULL DEFAULT false,
    `encryptedTranscript` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `session_behavior_logs_userId_idx`(`userId`),
    INDEX `session_behavior_logs_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `personality_profiles` ADD CONSTRAINT `personality_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_behavior_logs` ADD CONSTRAINT `session_behavior_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

