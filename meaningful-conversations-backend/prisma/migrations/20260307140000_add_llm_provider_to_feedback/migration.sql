-- AlterTable
ALTER TABLE `Feedback` ADD COLUMN `llmProvider` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Feedback_llmProvider_idx` ON `Feedback`(`llmProvider`);
