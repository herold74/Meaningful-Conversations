-- Remove encryptedTranscript column from session_behavior_logs
-- GDPR compliance: Transcripts are not stored, only keyword frequencies
-- Users can download transcript immediately after session

ALTER TABLE `session_behavior_logs` DROP COLUMN `encryptedTranscript`;
