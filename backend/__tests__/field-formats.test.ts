import { describe, it, expect } from '@jest/globals';
import {
  normalizeCallsign,
  isValidCallsign,
  isValidFrequency,
  isValidGrid,
} from '../src/schemas/field-formats.js';

/**
 * Data-quality F9 — shared field-format validators. Lean-permissive: accept
 * weird-but-legit, reject only obvious garbage.
 */

describe('isValidCallsign / normalizeCallsign', () => {
  it.each([
    'W1AW',          // bare call
    'W1AW/3',        // portable suffix
    'PA/W1AW/P',     // prefix/call/suffix
    'VP2E/AE9S/MM',  // multiple segments
    'ISOLATED',      // all letters, no digit
  ])('accepts %s', (call) => {
    expect(isValidCallsign(call)).toBe(true);
  });

  it('normalizes lowercase to uppercase and accepts it', () => {
    expect(normalizeCallsign(' w1aw ')).toBe('W1AW');
    expect(isValidCallsign('w1aw')).toBe(true);
  });

  it.each([
    '',           // empty
    '   ',        // whitespace only
    'W1 AW',      // internal space
    'W1@W',       // illegal char
    "';DROP",     // injection-shaped garbage
    '/W1AW',      // leading slash (empty segment)
    'W1AW/',      // trailing slash (empty segment)
  ])('rejects %s', (call) => {
    expect(isValidCallsign(call)).toBe(false);
  });
});

describe('isValidFrequency', () => {
  it.each([
    '14.074',    // HF
    '0.1357',    // 2200m LF
    '50',        // 6m
    '1296',      // 23cm microwave
    '1296.0',
    '10368.1',   // 3cm microwave
  ])('accepts %s MHz', (f) => {
    expect(isValidFrequency(f)).toBe(true);
  });

  it.each([
    '0',
    '-5',
    'abc',
    '',
  ])('rejects %s', (f) => {
    expect(isValidFrequency(f)).toBe(false);
  });
});

describe('isValidGrid', () => {
  it.each([
    '',          // absent — valid
    'DN70',      // 4-char square
    'DM79',
    'FN31pr',    // 6-char subsquare, mixed case
    'AA00',
    'FN31pr00',  // 8-char extended
  ])('accepts %s', (g) => {
    expect(isValidGrid(g)).toBe(true);
  });

  it.each([
    'ZZ99',   // Z is outside the A-R field range
    'A',      // too short
    '123',    // not a locator
    'FN3',    // odd length
  ])('rejects %s', (g) => {
    expect(isValidGrid(g)).toBe(false);
  });
});
