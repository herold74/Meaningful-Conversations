-- AlterTable: Make paypalOrderId optional and paypalPayload optional
ALTER TABLE `Purchase` MODIFY COLUMN `paypalOrderId` VARCHAR(191) NULL;
ALTER TABLE `Purchase` MODIFY COLUMN `paypalPayload` JSON NULL;

-- AddColumn: platform field for multi-payment-provider support
ALTER TABLE `Purchase` ADD COLUMN `platform` VARCHAR(191) NOT NULL DEFAULT 'paypal';

-- AddColumn: Apple IAP fields
ALTER TABLE `Purchase` ADD COLUMN `appleTransactionId` VARCHAR(191) NULL;
ALTER TABLE `Purchase` ADD COLUMN `appleOriginalTransactionId` VARCHAR(191) NULL;
ALTER TABLE `Purchase` ADD COLUMN `subscriptionStatus` VARCHAR(191) NULL;
ALTER TABLE `Purchase` ADD COLUMN `renewsAt` DATETIME(3) NULL;

-- CreateIndex: Apple transaction unique constraint
CREATE UNIQUE INDEX `Purchase_appleTransactionId_key` ON `Purchase`(`appleTransactionId`);

-- CreateIndex: Platform and Apple original transaction indexes
CREATE INDEX `Purchase_platform_idx` ON `Purchase`(`platform`);
CREATE INDEX `Purchase_appleOriginalTransactionId_idx` ON `Purchase`(`appleOriginalTransactionId`);

-- AddColumn: User purchase platform tracking
ALTER TABLE `User` ADD COLUMN `purchasePlatform` VARCHAR(191) NULL;
