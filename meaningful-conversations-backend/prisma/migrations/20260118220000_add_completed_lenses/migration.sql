-- Add completedLenses column to PersonalityProfile
ALTER TABLE `personality_profiles` ADD COLUMN `completedLenses` VARCHAR(191) NOT NULL DEFAULT '[]';

-- Make filterWorry and filterControl nullable (legacy fields no longer collected)
ALTER TABLE `personality_profiles` MODIFY COLUMN `filterWorry` INT NULL;
ALTER TABLE `personality_profiles` MODIFY COLUMN `filterControl` INT NULL;
