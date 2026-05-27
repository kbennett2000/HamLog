-- Migration 003: Add mode and band columns
-- No backfill needed — these fields were never captured before.
--
-- BACKUP: Run scripts/backup.ps1 -Label "pre-migration-003" before applying.

ALTER TABLE Contacts ADD COLUMN mode VARCHAR(10) NULL;
ALTER TABLE Contacts ADD COLUMN band VARCHAR(10) NULL;
