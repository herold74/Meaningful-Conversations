-- AlterTable: add tokensInvalidatedAt column to User for cross-worker token revocation
ALTER TABLE `User` ADD COLUMN `tokensInvalidatedAt` DATETIME(3) NULL;
