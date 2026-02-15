-- AlterTable
ALTER TABLE `UpgradeCode` ADD COLUMN `referrer` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `UpgradeCode_referrer_idx` ON `UpgradeCode`(`referrer`);
