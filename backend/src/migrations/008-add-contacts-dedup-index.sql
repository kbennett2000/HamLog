-- Migration 008: Add a composite index to support QSO duplicate detection.
-- Speeds up the dedup lookup run before every insert (ADIF import + manual create):
--   WHERE user_id = ? AND UPPER(QSO_Callsign) = UPPER(?) AND <datetime to the minute>
-- band/mode are intentionally NOT in the index: they are filtered with the null-safe
-- <=> operator and the (user_id, callsign, datetime) prefix already narrows to a handful
-- of rows, so indexing them buys nothing.
-- Additive and non-destructive: an index add touches no row data.
-- NOT a UNIQUE index on purpose: existing logs may already contain duplicates (a
-- UNIQUE build would fail) and MySQL UNIQUE treats NULLs as distinct, which would not
-- match the null-safe band/mode dedup semantics enforced in application code.
--
-- BACKUP (operator runs first): mysqldump HamLogDB > backup-YYYYMMDD-HHMM.sql
-- VERIFY (after):
--   SHOW INDEX FROM Contacts WHERE Key_name = 'idx_contacts_dedup';  -- returns rows
--   SELECT COUNT(*) FROM Contacts;                                    -- unchanged

ALTER TABLE `Contacts`
  ADD INDEX `idx_contacts_dedup` (`user_id`, `QSO_Callsign`, `qso_datetime_utc`);
