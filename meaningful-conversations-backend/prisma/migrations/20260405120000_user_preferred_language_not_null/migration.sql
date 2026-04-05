-- Align `User.preferredLanguage` with schema.prisma (`String @default("de")` => NOT NULL).
-- The migration `20251120_add_newsletter_improvements` added the column without NOT NULL;
-- some databases (e.g. production) therefore diverged from Prisma and from stricter envs.
-- Safe: only replaces NULLs with the schema default before tightening the constraint.

UPDATE `User` SET `preferredLanguage` = 'de' WHERE `preferredLanguage` IS NULL;

ALTER TABLE `User` MODIFY COLUMN `preferredLanguage` VARCHAR(191) NOT NULL DEFAULT 'de';
