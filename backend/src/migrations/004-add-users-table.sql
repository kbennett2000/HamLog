-- Migration 004: Add Users table for multi-user support
-- BACKUP: mysqldump HamLogDB > backup-YYYYMMDD-HHMM.sql

CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `callsign` VARCHAR(12) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_username_unique` (`username`),
  UNIQUE INDEX `users_callsign_unique` (`callsign`)
);
