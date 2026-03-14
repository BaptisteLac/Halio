import { describe, it, expect } from 'vitest';
import {
  getSolunarScore,
  isInSolunarPeriod,
  getSolunarData,
} from '../solunar-service';
import type { SolunarPeriod } from '@/types';

// ── getSolunarScore ───────────────────────────────────────────────────────────

describe('getSolunarScore', () => {
  it('retourne 0 quand il n\'y a aucune période', () => {
    expect(getSolunarScore(new Date(), [])).toBe(0);
  });

  it('retourne 100 au centre d\'une période majeure', () => {
    const center = new Date('2026-03-14T10:00:00');
    const periods: SolunarPeriod[] = [{
      type: 'majeure',
      start: new Date('2026-03-14T09:00:00'),
      end: new Date('2026-03-14T11:00:00'),
    }];
    expect(getSolunarScore(center, periods)).toBe(100);
  });

  it('retourne 70 au centre d\'une période mineure', () => {
    const center = new Date('2026-03-14T10:00:00');
    const periods: SolunarPeriod[] = [{
      type: 'mineure',
      start: new Date('2026-03-14T09:30:00'),
      end: new Date('2026-03-14T10:30:00'),
    }];
    expect(getSolunarScore(center, periods)).toBe(70);
  });

  it('retourne 0 en dehors de toutes les périodes', () => {
    const outside = new Date('2026-03-14T15:00:00');
    const periods: SolunarPeriod[] = [{
      type: 'majeure',
      start: new Date('2026-03-14T09:00:00'),
      end: new Date('2026-03-14T11:00:00'),
    }];
    expect(getSolunarScore(outside, periods)).toBe(0);
  });

  it('retourne ~50 à mi-chemin entre centre et bord d\'une période majeure', () => {
    // Period: 09:00 - 11:00, center = 10:00
    // À 09:30 (30 min du centre sur 60 min de demi-durée) → score ≈ 100 * (1 - 0.5) = 50
    const halfWay = new Date('2026-03-14T09:30:00');
    const periods: SolunarPeriod[] = [{
      type: 'majeure',
      start: new Date('2026-03-14T09:00:00'),
      end: new Date('2026-03-14T11:00:00'),
    }];
    expect(getSolunarScore(halfWay, periods)).toBe(50);
  });

  it('retourne le score le plus élevé si plusieurs périodes se chevauchent', () => {
    const date = new Date('2026-03-14T10:00:00');
    const periods: SolunarPeriod[] = [
      { type: 'mineure', start: new Date('2026-03-14T09:30:00'), end: new Date('2026-03-14T10:30:00') },
      { type: 'majeure', start: new Date('2026-03-14T09:00:00'), end: new Date('2026-03-14T11:00:00') },
    ];
    // Les deux couvrent 10:00 — la majeure donne 100
    expect(getSolunarScore(date, periods)).toBe(100);
  });
});

// ── isInSolunarPeriod ─────────────────────────────────────────────────────────

describe('isInSolunarPeriod', () => {
  const periods: SolunarPeriod[] = [
    { type: 'majeure', start: new Date('2026-03-14T09:00:00'), end: new Date('2026-03-14T11:00:00') },
    { type: 'mineure', start: new Date('2026-03-14T15:00:00'), end: new Date('2026-03-14T16:00:00') },
  ];

  it('retourne la période quand la date est dedans', () => {
    const inside = new Date('2026-03-14T10:00:00');
    const result = isInSolunarPeriod(inside, periods);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('majeure');
  });

  it('retourne null quand la date est en dehors', () => {
    const outside = new Date('2026-03-14T13:00:00');
    expect(isInSolunarPeriod(outside, periods)).toBeNull();
  });

  it('retourne null pour une liste vide', () => {
    expect(isInSolunarPeriod(new Date(), [])).toBeNull();
  });
});

// ── getSolunarData ────────────────────────────────────────────────────────────

describe('getSolunarData', () => {
  const date = new Date('2026-03-14T12:00:00');
  const data = getSolunarData(date);

  it('retourne un objet avec sunrise et sunset valides', () => {
    expect(data.sunrise).toBeInstanceOf(Date);
    expect(data.sunset).toBeInstanceOf(Date);
    expect(data.sunrise < data.sunset).toBe(true);
  });

  it('retourne des périodes solunaires non vides', () => {
    expect(data.periods.length).toBeGreaterThan(0);
  });

  it('moonPhase est entre 0 et 1', () => {
    expect(data.moonPhase).toBeGreaterThanOrEqual(0);
    expect(data.moonPhase).toBeLessThanOrEqual(1);
  });

  it('moonFraction est entre 0 et 1', () => {
    expect(data.moonFraction).toBeGreaterThanOrEqual(0);
    expect(data.moonFraction).toBeLessThanOrEqual(1);
  });

  it('moonPhaseName est une chaîne non vide', () => {
    expect(typeof data.moonPhaseName).toBe('string');
    expect(data.moonPhaseName.length).toBeGreaterThan(0);
  });

  it('les périodes sont triées chronologiquement', () => {
    for (let i = 1; i < data.periods.length; i++) {
      expect(data.periods[i].start.getTime()).toBeGreaterThanOrEqual(
        data.periods[i - 1].start.getTime()
      );
    }
  });
});
