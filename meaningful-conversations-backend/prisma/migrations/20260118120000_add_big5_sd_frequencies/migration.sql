-- Add Big5/OCEAN frequency columns to SessionBehaviorLog
ALTER TABLE `session_behavior_logs` ADD COLUMN `opennessFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `conscientiousnessFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `extraversionFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `agreeablenessFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `neuroticismFrequency` INTEGER NOT NULL DEFAULT 0;

-- Add Spiral Dynamics frequency columns to SessionBehaviorLog
ALTER TABLE `session_behavior_logs` ADD COLUMN `beigeFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `purpleFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `redFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `blueFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `orangeFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `greenFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `yellowFrequency` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `session_behavior_logs` ADD COLUMN `turquoiseFrequency` INTEGER NOT NULL DEFAULT 0;
