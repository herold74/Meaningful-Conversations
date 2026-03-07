-- AlterTable
ALTER TABLE `Purchase` ADD COLUMN `invoiceNumber` VARCHAR(191) NULL,
    ADD COLUMN `invoiceSentAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Purchase_invoiceNumber_key` ON `Purchase`(`invoiceNumber`);
