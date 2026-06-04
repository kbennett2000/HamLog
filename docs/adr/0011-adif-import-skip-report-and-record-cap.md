# 0011. ADIF import skips-and-reports bad records rather than aborting; rejects over-cap files up front

Date: 2026-06-04
Status: Accepted

## Context

SECURITY_AUDIT.md findings F9 and F10 (PRs #37–#44) called for two
improvements to the ADIF import path:

1. **Error handling per record.** The original import loop aborted the entire
   batch when any single record failed validation. For an import of hundreds or
   thousands of QSOs, one malformed record would silently discard all QSOs that
   followed it in the file — or abort the whole import with no indication of
   what was salvageable.

2. **Record count cap.** The audit noted that while a `multer` 10 MB file-size
   limit was already in place, a 10 MB ADIF file can contain tens of thousands
   of records. The import loop was not extractable from the route handler, which
   made it untestable in isolation.

These two issues had independent solutions but were addressed in the same PR
because they are in the same code path.

The design had two genuine forks in behavior that each required a specific
choice:

**On a bad record: skip or abort?** A failed record could mean a typo in one
field, a missing mandatory field, or data that doesn't match the expected
format. The remaining records are likely valid. Aborting the whole batch
penalizes the user for a single error and may be unrecoverable if the source
file is not available for manual correction. Skipping and reporting preserves
the valid records and gives the user actionable information about what was
rejected.

**On an over-cap file: truncate or reject?** A partial import (first N records)
looks like a complete import — the user has no way to know the tail was dropped
unless they count carefully. A silent truncation can cause data loss that isn't
discovered until a discrepancy is noticed later. Rejection up front is unambiguous:
the user gets an error before any records are written, and can either split the
file or raise the cap.

## Decision

**Per-record errors: skip-and-report.** A record that fails validation is
skipped; its position and the validation error are collected. After the loop,
the response includes both the count of successfully imported records and an
array of `{ recordNumber, error }` objects for the skipped ones. The caller
can display these to the user.

**Over-cap files: reject up front, zero rows written.** `MAX_IMPORT_RECORDS`
(default 50000, env-tunable) is checked before the import loop starts. If the
parsed file contains more records than the cap, the request fails with a
descriptive error and no records are inserted. The cap is not a hard upper
bound on a reasonable import (50k QSOs is a large but realistic amateur log),
but it prevents a pathological file from running the server out of memory.

**Service extraction.** The import loop is extracted into a testable
`importAdif(records, userId)` function in `services/qso-service.ts`. The route
handler is responsible only for file parsing and HTTP response shaping. This
makes unit testing the skip-and-report logic straightforward without needing to
POST a file.

## Alternatives considered

- **Abort-on-first-error** (original behavior). The simplest implementation.
  Rejected: for a batch import it is the wrong failure mode. The user has
  already uploaded a file; discarding all subsequent valid records because of
  one bad entry is a poor tradeoff. The ADIF format is text-based and
  record-by-record; there is no structural reason why one record's failure
  should contaminate others.

- **Truncate at the cap rather than reject.** Import the first N records
  and return success with a warning. Rejected: a partial import that looks
  complete is worse than a clear upfront failure. Silent data loss in a log
  application is particularly bad — QSOs represent real events, and a missing
  tail of records may not be noticed until the operator looks for a specific
  contact. Reject-not-truncate is unambiguous; the operator can split or
  re-import.

- **No record-count cap; rely on the file-size limit alone.** The existing
  10 MB `multer` limit is already in place and provides a hard memory ceiling.
  Partially rejected: the file-size limit bounds the input bytes but not the
  number of records or the number of DB inserts. A 10 MB ADIF file of minimal
  records could still trigger tens of thousands of individual `INSERT` calls in
  a tight loop. The cap provides a second, semantically appropriate guard that
  also gives a clearer error message to the user than a timeout or OOM condition.

- **Keep the import logic inside the route handler.** No extraction.
  Rejected: the per-record skip logic and the cap check are the parts of the
  import worth testing; if they live inside a route handler they can only be
  tested via HTTP integration tests, which are slower and more fragile than
  direct unit tests on the service function.

## Consequences

- A user importing a mixed-quality ADIF file (e.g., from an old logging
  program with inconsistent formatting) gets the valid records imported and
  a clear list of what was rejected. They can fix the bad records and re-import
  them without losing what was already saved.
- Reject-not-truncate means a user with a very large log (>50k QSOs) must
  either split the file or raise `MAX_IMPORT_RECORDS`. The default of 50k is
  generous for typical amateur logs (contest logs often run 1–5k QSOs; a
  lifetime log is typically under 100k). The env-tunable cap means the operator
  can raise it without a code change.
- The skip-and-report response shape adds a contract: clients must handle an
  array of `{ recordNumber, error }` objects in the response. Future changes to
  the import endpoint must maintain this structure or version the endpoint.
- The extracted `importAdif()` service function is now independently testable;
  the backend test suite covers the skip, cap, and success paths without HTTP
  overhead.

## Revisit if

- The default cap of 50000 records proves too low for real-world imports from
  operators who have been logging for decades (typical: lifetime logs of 50–200k
  QSOs). Consider raising the default or adding a streaming/chunked import path.
- The skip-and-report response grows unwieldy when hundreds of records are
  rejected (e.g., a corrupt file). Add a cap on the error array length (e.g.,
  return the first 100 errors and a total-errors count) if this becomes a
  practical UX issue.
- ADIF import performance becomes a bottleneck (thousands of individual
  INSERTs). At that point, replace the per-record INSERT loop with a bulk INSERT
  and adjust the service interface accordingly.
