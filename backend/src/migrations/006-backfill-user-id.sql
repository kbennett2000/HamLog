-- Migration 006: Backfill user_id for existing contacts
-- Assigns all existing contacts to user id=1 (the first registered user).
-- Idempotent: only updates rows where user_id IS NULL.
-- BACKUP: mysqldump HamLogDB > backup-YYYYMMDD-HHMM.sql

UPDATE `Contacts` SET `user_id` = 1 WHERE `user_id` IS NULL;

-- Verify: SELECT COUNT(*) FROM Contacts WHERE user_id IS NULL; -- should be 0
