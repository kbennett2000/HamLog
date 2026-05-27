-- Migration 001: Add qso_datetime_utc column
-- Combines QSO_Date + QSO_MTZTime into a single UTC datetime.
-- Uses CONVERT_TZ to convert from America/Denver (Mountain Time) to UTC.
--
-- BACKUP: Run scripts/backup.ps1 -Label "pre-migration-001" before applying.

ALTER TABLE Contacts ADD COLUMN qso_datetime_utc DATETIME NULL AFTER QSO_MTZTime;

-- Step 1: Combine date + time (handles both HH:MM and HH:MM:SS formats)
UPDATE Contacts
SET qso_datetime_utc = CONCAT(
  DATE(QSO_Date),
  ' ',
  CASE
    WHEN LENGTH(QSO_MTZTime) = 5 THEN CONCAT(QSO_MTZTime, ':00')
    ELSE LEFT(QSO_MTZTime, 8)
  END
)
WHERE QSO_MTZTime IS NOT NULL AND QSO_MTZTime != '';

-- Step 2: Convert from Mountain Time to UTC (handles DST automatically)
UPDATE Contacts
SET qso_datetime_utc = CONVERT_TZ(qso_datetime_utc, 'America/Denver', 'UTC')
WHERE qso_datetime_utc IS NOT NULL;
