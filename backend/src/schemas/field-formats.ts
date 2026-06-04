import { z } from 'zod';

/**
 * Shared, lean-permissive field-format validators for callsign / frequency / grid
 * (Data-quality F9). These catch obvious garbage, not style violations — when unsure,
 * accept. Defined once and reused by the QSO create schema, the ADIF import path, and
 * the ContactInfo schema. They do NOT provide any security property (injection is
 * already prevented by parameterized queries).
 */

// --- Callsign ---------------------------------------------------------------
// One or more slash-separated alphanumeric segments: bare calls (W1AW), with a
// suffix (W1AW/3), and full prefix/call/suffix forms (PA/W1AW/P, VP2E/AE9S/MM).
// Operators may type lowercase, so normalize to uppercase rather than rejecting.
// Digits may appear anywhere and a digit is NOT required (e.g. special-event calls).
const CALLSIGN_RE = /^[A-Z0-9]+(?:\/[A-Z0-9]+)*$/;

export function normalizeCallsign(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidCallsign(raw: string): boolean {
  return CALLSIGN_RE.test(normalizeCallsign(raw));
}

// --- Frequency (MHz) --------------------------------------------------------
// Reject NaN / 0 / negative / nonsense, but accept the full amateur range from LF
// (~0.1357 MHz) through microwave/SHF (23cm 1296 MHz and up past 241 GHz). The
// ceiling is a generous sanity bound, not a band limit.
const MAX_FREQ_MHZ = 300000; // ~300 GHz — above the highest amateur allocation

export function isValidFrequency(raw: string): boolean {
  const f = parseFloat(String(raw).trim());
  return Number.isFinite(f) && f > 0 && f <= MAX_FREQ_MHZ;
}

// --- Maidenhead grid (optional) --------------------------------------------
// 2/4/6/8 characters: field(AA) [square(00)] [subsquare(aa)] [extended(00)],
// case-insensitive. Empty/absent is valid (many QSOs have no grid).
const GRID_RE = /^[A-R]{2}(?:[0-9]{2}(?:[A-X]{2}(?:[0-9]{2})?)?)?$/i;

export function isValidGrid(raw: string): boolean {
  const g = String(raw).trim();
  if (g === '') return true;
  return GRID_RE.test(g);
}

// --- Zod field builders -----------------------------------------------------
export const callsignField = () =>
  z
    .string()
    .min(1, 'callsign is required')
    .transform(normalizeCallsign)
    .refine(isValidCallsign, 'Invalid callsign format');

export const frequencyField = () =>
  z.string().min(1, 'frequency is required').refine(isValidFrequency, 'Invalid frequency');

export const gridField = () => z.string().default('').refine(isValidGrid, 'Invalid Maidenhead grid');
