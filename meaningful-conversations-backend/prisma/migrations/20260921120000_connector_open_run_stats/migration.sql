-- Open Situation: optional scores + run metadata for k-anonymous aggregates
ALTER TABLE `connector_run_stats`
  MODIFY `overallScore` INTEGER NULL,
  MODIFY `empathy` INTEGER NULL,
  MODIFY `presence` INTEGER NULL,
  MODIFY `curiosity` INTEGER NULL,
  MODIFY `nonJudgment` INTEGER NULL,
  MODIFY `steadiness` INTEGER NULL,
  ADD COLUMN `runMode` VARCHAR(191) NOT NULL DEFAULT 'assessment',
  ADD COLUMN `lengthPreset` VARCHAR(191) NULL,
  ADD COLUMN `relationshipBucket` VARCHAR(191) NULL,
  ADD COLUMN `developmentFieldsTouched` JSON NULL;
