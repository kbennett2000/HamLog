-- Migration 007: Make user_id NOT NULL (contract phase)
-- Only apply after confirming migration 006 backfilled all rows.
-- BACKUP: mysqldump HamLogDB > backup-YYYYMMDD-HHMM.sql

ALTER TABLE `Contacts` MODIFY COLUMN `user_id` INT NOT NULL;
