-- Migration 002: Add frequency_mhz DECIMAL column
-- Converts QSO_Frequency (VARCHAR) to DECIMAL(10,6) in MHz.
-- Handles formats: "14.074" (MHz.kHz), "14.242.030" (MHz.kHz.Hz), "7.2" (MHz only)
-- For multi-dot formats, strips the Hz component (everything after the second dot).
--
-- BACKUP: Run scripts/backup.ps1 -Label "pre-migration-002" before applying.

ALTER TABLE Contacts ADD COLUMN frequency_mhz DECIMAL(10,6) NULL AFTER QSO_Frequency;

UPDATE Contacts
SET frequency_mhz = CAST(
  CASE
    WHEN CHAR_LENGTH(QSO_Frequency) - CHAR_LENGTH(REPLACE(QSO_Frequency, '.', '')) >= 2
    THEN LEFT(QSO_Frequency, LOCATE('.', QSO_Frequency, LOCATE('.', QSO_Frequency) + 1) - 1)
    ELSE QSO_Frequency
  END
  AS DECIMAL(10,6)
)
WHERE QSO_Frequency IS NOT NULL AND QSO_Frequency != '';
