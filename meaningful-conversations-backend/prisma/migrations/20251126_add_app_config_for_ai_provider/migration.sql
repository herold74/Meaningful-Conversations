-- CreateTable
CREATE TABLE `AppConfig` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `AppConfig_key_key`(`key`),
    INDEX `AppConfig_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert initial configuration
INSERT INTO `AppConfig` (`id`, `key`, `value`, `description`, `updatedAt`) VALUES
    ('ai_provider_001', 'AI_PROVIDER', 'google', 'Active AI provider: google or mistral', NOW()),
    ('ai_model_map_002', 'AI_MODEL_MAPPING', '{"flash":"mistral-small-latest","pro":"mistral-large-latest"}', 'Model mapping for Mistral equivalents', NOW());




