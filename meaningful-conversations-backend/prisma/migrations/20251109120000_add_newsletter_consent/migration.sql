-- AlterTable
ALTER TABLE `User` ADD COLUMN `newsletterConsent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `newsletterConsentDate` DATETIME(3) NULL;

