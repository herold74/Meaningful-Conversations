-- Add isClient field to User table
ALTER TABLE `User` ADD COLUMN `isClient` BOOLEAN NOT NULL DEFAULT false;
