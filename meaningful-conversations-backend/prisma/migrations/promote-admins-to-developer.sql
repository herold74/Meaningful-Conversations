-- Migration: Add isDeveloper column + Rename isBetaTester to isPremium
-- Date: 2025-02-11
-- 
-- This migration performs two changes:
-- 1. Renames isBetaTester to isPremium for clarity
-- 2. Adds the isDeveloper column and promotes existing admins to Developer
--
-- IMPORTANT: Execute these SQL commands BEFORE running `npx prisma db push`
-- to preserve existing data during the column rename.

-- Step 1: Rename isBetaTester -> isPremium (preserve data)
ALTER TABLE User ADD COLUMN isPremium BOOLEAN NOT NULL DEFAULT false;
UPDATE User SET isPremium = isBetaTester;
ALTER TABLE User DROP COLUMN isBetaTester;

-- Step 2: Add isDeveloper column
ALTER TABLE User ADD COLUMN isDeveloper BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Promote existing admins to Developer status
UPDATE User SET isDeveloper = true WHERE isAdmin = true;

-- Step 4: Now run `npx prisma db push` to sync the Prisma client
-- (This should be a no-op since the schema already matches)

-- Verify:
-- SELECT id, email, isPremium, isAdmin, isDeveloper FROM User WHERE isAdmin = true OR isPremium = true;
