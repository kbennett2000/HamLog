# 0010. QSO field validation is lean-permissive; falsely rejecting a valid QSO is worse than storing an unusual value

Date: 2026-06-04
Status: Accepted

## Context

SECURITY_AUDIT.md finding F9 (PRs #37–#44) called for tightening validation on
the QSO create and import paths. The audit's draft suggestions for two fields
contained domain errors that, if implemented as written, would have rejected
valid amateur radio contacts:

**Frequency ceiling.** The audit suggested capping accepted frequencies at
1000 MHz (1 GHz). Amateur radio bands extend well above 1 GHz: the 23cm band
is 1240–1300 MHz, the 13cm band is 2300–2450 MHz, and allocations continue
through 76 GHz, 122 GHz, and 241 GHz at the high end. Capping at 1 GHz would
silently reject every microwave QSO.

**Callsign regex.** The audit suggested `^[A-Z0-9]+(?:/[A-Z0-9]+)?$` —
one optional slash segment, uppercase only. Portable and maritime-mobile
callsigns can have multiple slash segments: `PA/W1AW/P` (US operator active in
the Netherlands, portable), `W1AW/MM` (maritime mobile), and similar. A
single-slash pattern rejects any callsign with more than one modifier.

The broader design question was: when uncertain about the correct range or
format, should validation be strict (reject anything that looks wrong) or
permissive (accept anything that isn't clearly impossible)?

For a QSO logger, the cost of false negatives (rejecting a real contact) is
higher than the cost of false positives (storing an odd value). A rejected QSO
is lost permanently at import time or causes immediate user frustration at
log-time. An unusual but valid callsign or frequency causes no harm in storage
and can be corrected later if it is indeed wrong.

## Decision

Field validation is lean-permissive: validate format and rough plausibility,
not strict domain correctness. Specific choices:

- **Callsign regex:** `^[A-Z0-9]+(?:/[A-Z0-9]+)*$` — one or more alphanumeric
  segments separated by slashes, uppercase-normalized on ingest. This accepts
  `W1AW`, `PA/W1AW/P`, `W1AW/MM`, and similar multi-segment callsigns while
  still rejecting obvious junk (empty string, spaces, special characters).

- **Frequency range:** `0 < f ≤ 300000` MHz (300 GHz). This covers all
  current and likely future amateur allocations through the submillimetre bands.
  300 GHz is a practical ceiling for the foreseeable future; it is not meant
  to be physically precise.

- **Maidenhead grid:** validated against the standard format (two letters, two
  digits, optionally two more letters) but treated as optional — a QSO without
  a grid is valid.

The guiding principle is documented in code comments in `qso.schema.ts`:
*"Falsely rejecting a valid QSO is worse than storing an unusual value."*

## Alternatives considered

- **Adopt the audit's suggested values verbatim** (1 GHz ceiling, single-slash
  callsign). Rejected: both are domain errors. Implementing them would silently
  break QSO logging for any operator active on microwave bands or using portable
  callsign suffixes. The audit was a starting point, not an authoritative domain
  spec.

- **Strict validation against the current ITU/IARU frequency allocation
  tables** — only accept frequencies that fall within a recognized amateur
  band. Rejected: band plans vary by country and are revised periodically;
  embedding them as validation rules would create ongoing maintenance burden
  and would incorrectly reject QSOs made under special experimental licenses,
  during contests that use unusual frequencies, or in regions where the band
  plan is not yet reflected in our tables. The frequency field is for logging
  what actually happened, not for enforcing what is permitted.

- **No frequency or callsign validation** (keep `z.string().min(1)` for both).
  Rejected: a plausibility check still catches typos and import errors (a
  frequency of `145,200` with a comma instead of a decimal, or a callsign of
  `???`) without false-rejecting edge cases.

## Consequences

- Microwave QSOs (23cm, 13cm, and above) and multi-segment portable callsigns
  are accepted correctly.
- The callsign regex is permissive enough that some malformed inputs may pass
  (e.g., a single slash with nothing after it would be caught, but a plausible
  string of letters and digits that is not a real callsign would not be). This
  is acceptable: callsign format enforcement is not the purpose of the log.
- Frequency range `(0, 300000]` MHz will not reject any realistic amateur
  contact for the foreseeable future. If amateur allocations somehow extend
  above 300 GHz, the ceiling can be raised trivially.
- Accepting callsigns with multiple slashes means the HamDB lookup URL
  includes the full string; `encodeURIComponent` handles the slashes correctly
  and no injection risk is introduced (confirmed in SECURITY_AUDIT.md).

## Revisit if

- Malformed data from imports is causing operational problems (e.g., garbage
  frequency values corrupting band statistics). At that point, tighten the
  ceiling or add a warning-not-rejection path that flags unusual values without
  discarding them.
- A future feature needs to derive the country or license class from the
  callsign structure, which requires a more precise callsign format. At that
  point, tighten the regex and consider a dedicated callsign parsing library
  rather than a hand-rolled regex.
