-- AlterTable
ALTER TABLE `User` ADD COLUMN `preferredLanguage` VARCHAR(191) DEFAULT 'de',
                   ADD COLUMN `unsubscribeToken` VARCHAR(191) UNIQUE;

-- CreateTable
CREATE TABLE IF NOT EXISTS `NewsletterLog` (
    `id` VARCHAR(191) NOT NULL,
    `subjectDE` VARCHAR(191) NOT NULL,
    `subjectEN` VARCHAR(191) NOT NULL,
    `textBodyDE` TEXT NOT NULL,
    `textBodyEN` TEXT NOT NULL,
    `htmlBodyDE` TEXT,
    `htmlBodyEN` TEXT,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `senderId` VARCHAR(191) NOT NULL,
    `totalRecipients` INTEGER NOT NULL,
    `successfulSends` INTEGER NOT NULL,
    `failedSends` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
    `errorMessage` TEXT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NewsletterLog` ADD CONSTRAINT `NewsletterLog_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

