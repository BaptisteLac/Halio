import { describe, it, expect } from 'vitest';
import {
  mslToZH,
  formatTideHeight,
  formatDuration,
  getTidePhaseLabel,
  getTidePhaseIcon,
  isTidePhaseOptimal,
  getDayExtremes,
  getNextExtreme,
  getPrevExtreme,
  interpolateTideHeight,
  ARCACHON_LAT_DATUM,
} from '../tide-utils';
import type { TideExtreme } from '@/types';

// ── mslToZH ──────────────────────────────────────────────────────────────────

describe('mslToZH', () => {
  it('converts MSL 0 to positive ZH (LAT datum is negative)', () => {
    // LAT_DATUM = -2.428 → mslToZH(0) = 0 - (-2.428) = 2.428
    expect(mslToZH(0)).toBe(2.43); // rounded to 2 decimals
  });

  it('converts LAT datum level to ZH 0', () => {
    expect(mslToZH(ARCACHON_LAT_DATUM)).toBe(0);
  });

  it('converts a typical PM height correctly', () => {
    // PM à ~1.5m MSL → 1.5 + 2.428 = 3.928 ZH
    expect(mslToZH(1.5)).toBe(3.93);
  });

  it('rounds to 2 decimal places', () => {
    const result = mslToZH(0.123);
    expect(result.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

// ── formatTideHeight ──────────────────────────────────────────────────────────

describe('formatTideHeight', () => {
  it('formats height with 2 decimals and unit', () => {
    expect(formatTideHeight(2.5)).toBe('2.50 m');
  });

  it('formats integer height', () => {
    expect(formatTideHeight(3)).toBe('3.00 m');
  });
});

// ── formatDuration ────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('displays minutes for durations under 1h', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(59)).toBe('59 min');
  });

  it('displays hours only for exact hours', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('displays hours and minutes for non-round durations', () => {
    expect(formatDuration(90)).toBe('1h 30min');
    expect(formatDuration(75)).toBe('1h 15min');
  });
});

// ── getTidePhaseLabel & getTidePhaseIcon ──────────────────────────────────────

describe('getTidePhaseLabel', () => {
  it('returns correct French label', () => {
    expect(getTidePhaseLabel('montant')).toBe('Montant');
    expect(getTidePhaseLabel('descendant')).toBe('Descendant');
  });
});

describe('getTidePhaseIcon', () => {
  it('returns correct arrow icon', () => {
    expect(getTidePhaseIcon('montant')).toBe('↑');
    expect(getTidePhaseIcon('descendant')).toBe('↓');
  });
});

// ── isTidePhaseOptimal ────────────────────────────────────────────────────────

describe('isTidePhaseOptimal', () => {
  it('tous → always optimal', () => {
    expect(isTidePhaseOptimal('montant', 'tous')).toBe(true);
    expect(isTidePhaseOptimal('descendant', 'tous')).toBe(true);
  });

  it('matches exact phase', () => {
    expect(isTidePhaseOptimal('montant', 'montant')).toBe(true);
    expect(isTidePhaseOptimal('descendant', 'descendant')).toBe(true);
  });

  it('does not match opposite phase', () => {
    expect(isTidePhaseOptimal('montant', 'descendant')).toBe(false);
    expect(isTidePhaseOptimal('descendant', 'montant')).toBe(false);
  });

  it('etale → never optimal (requires separate handling)', () => {
    expect(isTidePhaseOptimal('montant', 'etale')).toBe(false);
    expect(isTidePhaseOptimal('descendant', 'etale')).toBe(false);
  });
});

// ── getDayExtremes ────────────────────────────────────────────────────────────

describe('getDayExtremes', () => {
  const today = new Date('2026-03-14T12:00:00');
  const extremes: TideExtreme[] = [
    { time: new Date('2026-03-14T06:00:00'), height: 1.5, type: 'high' },
    { time: new Date('2026-03-14T18:00:00'), height: -0.5, type: 'low' },
    { time: new Date('2026-03-15T07:00:00'), height: 1.8, type: 'high' },
  ];

  it('returns only extremes for the given day', () => {
    const result = getDayExtremes(extremes, today);
    expect(result).toHaveLength(2);
  });

  it('excludes extremes from other days', () => {
    const result = getDayExtremes(extremes, today);
    result.forEach((e) => expect(e.time.toDateString()).toBe(today.toDateString()));
  });
});

// ── getNextExtreme & getPrevExtreme ───────────────────────────────────────────

describe('getNextExtreme', () => {
  const now = new Date('2026-03-14T12:00:00');
  const extremes: TideExtreme[] = [
    { time: new Date('2026-03-14T06:00:00'), height: 1.5, type: 'high' },
    { time: new Date('2026-03-14T18:00:00'), height: -0.5, type: 'low' },
    { time: new Date('2026-03-15T07:00:00'), height: 1.8, type: 'high' },
  ];

  it('returns the first extreme after now', () => {
    const result = getNextExtreme(extremes, now);
    expect(result?.time.toISOString()).toBe(new Date('2026-03-14T18:00:00').toISOString());
  });

  it('returns null when no future extremes', () => {
    const future = new Date('2026-03-16T00:00:00');
    expect(getNextExtreme(extremes, future)).toBeNull();
  });
});

describe('getPrevExtreme', () => {
  const now = new Date('2026-03-14T12:00:00');
  const extremes: TideExtreme[] = [
    { time: new Date('2026-03-14T06:00:00'), height: 1.5, type: 'high' },
    { time: new Date('2026-03-14T18:00:00'), height: -0.5, type: 'low' },
  ];

  it('returns the most recent extreme before now', () => {
    const result = getPrevExtreme(extremes, now);
    expect(result?.time.toISOString()).toBe(new Date('2026-03-14T06:00:00').toISOString());
  });
});

// ── interpolateTideHeight ─────────────────────────────────────────────────────

describe('interpolateTideHeight', () => {
  const low: TideExtreme = { time: new Date('2026-03-14T06:00:00'), height: -1, type: 'low' };
  const high: TideExtreme = { time: new Date('2026-03-14T12:00:00'), height: 1, type: 'high' };

  it('returns prev extreme height at start', () => {
    expect(interpolateTideHeight(low, high, low.time)).toBe(-1);
  });

  it('returns next extreme height at end', () => {
    expect(interpolateTideHeight(low, high, high.time)).toBe(1);
  });

  it('returns mid-level height at midpoint (sinusoidal)', () => {
    const mid = new Date('2026-03-14T09:00:00'); // 50% through
    const result = interpolateTideHeight(low, high, mid);
    // cos(π*0.5) = 0 → height = prev + (next-prev) * (1-0)/2 = -1 + 2 * 0.5 = 0
    // Note: Math.round peut retourner -0 (négatif zéro) en flottant
    expect(result).toBeCloseTo(0, 5);
  });
});
