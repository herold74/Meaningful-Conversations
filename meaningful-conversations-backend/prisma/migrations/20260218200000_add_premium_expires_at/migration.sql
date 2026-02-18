-- AlterTable
ALTER TABLE `User` ADD COLUMN `premiumExpiresAt` DATETIME(3) NULL;

-- Backfill: For existing Premium users with accessExpiresAt set,
-- copy their accessExpiresAt to premiumExpiresAt so the new field is populated.
UPDATE `User`
SET `premiumExpiresAt` = `accessExpiresAt`
WHERE `isPremium` = true AND `accessExpiresAt` IS NOT NULL;
