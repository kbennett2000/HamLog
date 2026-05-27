-- Migration 005: Add user_id FK to Contacts (expand phase)
-- Column is nullable initially. A later migration makes it NOT NULL after backfill.
-- BACKUP: mysqldump HamLogDB > backup-YYYYMMDD-HHMM.sql

ALTER TABLE `Contacts` ADD COLUMN `user_id` INT NULL AFTER `QSO_ID`;
ALTER TABLE `Contacts` ADD INDEX `idx_contacts_user_id` (`user_id`);
ALTER TABLE `Contacts` ADD CONSTRAINT `fk_contacts_user_id`
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT;
