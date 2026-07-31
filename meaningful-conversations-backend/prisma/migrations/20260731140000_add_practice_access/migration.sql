-- Coach Practice add-on: separate entitlement from Premium (trial grants both until expiry).
ALTER TABLE `User` ADD COLUMN `hasPracticeAccess` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `User` ADD COLUMN `practiceExpiresAt` DATETIME(3) NULL;

-- Active 9-day Premium trials (registered 2026+): include Practice until trial ends.
UPDATE `User`
SET `hasPracticeAccess` = true,
    `practiceExpiresAt` = `premiumExpiresAt`
WHERE `isPremium` = true
  AND `premiumExpiresAt` IS NOT NULL
  AND `premiumExpiresAt` > NOW()
  AND `isClient` = false
  AND `isAdmin` = false
  AND `isDeveloper` = false
  AND DATEDIFF(`premiumExpiresAt`, `createdAt`) <= 10;
