-- AlterTable
ALTER TABLE `transcript_evaluations` ADD COLUMN `userRating` INTEGER NULL,
    ADD COLUMN `userFeedback` TEXT NULL,
    ADD COLUMN `ratedAt` DATETIME(3) NULL;
