-- Upgrade all 2025 early-adopter users to Premium trial until June 30, 2026
-- These users were registered before 2026 and have accessExpiresAt = 2026-06-30
UPDATE `User`
SET `isPremium` = true,
    `premiumExpiresAt` = '2026-06-30 23:59:59.000'
WHERE `accessExpiresAt` = '2026-06-30 23:59:59.000'
  AND `isPremium` = false
  AND `isClient` = false
  AND `isAdmin` = false;
