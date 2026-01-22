-- Add aiRegionPreference column to User table
-- Allows users to choose their preferred AI processing region: 'optimal', 'eu', or 'us'
ALTER TABLE `User` ADD COLUMN `aiRegionPreference` VARCHAR(191) NOT NULL DEFAULT 'optimal';
