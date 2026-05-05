import { describe, it, expect } from 'vitest';
import { evaluateRule, evaluateRules } from '../rule-engine';
import type { NotificationRule, ComputedConditions } from '../rule-engine';

const baseConditions: ComputedConditions = {
  global_score: 72,
  species_scores: { bar: 85, dorade: 60, maigre: 40 },
  wind_speed: 12,
  coefficient: 82,
  tide_phase: 'montant',
  pressure_trend: 'baisse',
  cloud_cover: 25,
};

const rule = (overrides: Partial<NotificationRule>): NotificationRule => ({
  id: '1',
  user_id: 'u1',
  zone_id: 'arcachon',
  type: 'global_score',
  species_id: null,
  operator: '>=',
  value: '70',
  enabled: true,
  ...overrides,
});

describe('evaluateRule', () => {
  it('species_score >= threshold passes when score is above', () => {
    expect(evaluateRule(rule({ type: 'species_score', species_id: 'bar', operator: '>=', value: '80' }), baseConditions)).toBe(true);
  });

  it('species_score >= threshold fails when score is below', () => {
    expect(evaluateRule(rule({ type: 'species_score', species_id: 'dorade', operator: '>=', value: '80' }), baseConditions)).toBe(false);
  });

  it('wind_speed <= threshold passes', () => {
    expect(evaluateRule(rule({ type: 'wind_speed', operator: '<=', value: '15' }), baseConditions)).toBe(true);
  });

  it('wind_speed <= threshold fails when wind is too high', () => {
    expect(evaluateRule(rule({ type: 'wind_speed', operator: '<=', value: '10' }), baseConditions)).toBe(false);
  });

  it('tide_phase = value passes on match', () => {
    expect(evaluateRule(rule({ type: 'tide_phase', operator: '=', value: 'montant' }), baseConditions)).toBe(true);
  });

  it('tide_phase = value fails on mismatch', () => {
    expect(evaluateRule(rule({ type: 'tide_phase', operator: '=', value: 'etale_pm' }), baseConditions)).toBe(false);
  });

  it('disabled rule still evaluates its condition', () => {
    expect(evaluateRule(rule({ type: 'wind_speed', operator: '<=', value: '5', enabled: false }), baseConditions)).toBe(false);
  });

  it('unknown species returns 0 score, fails >= threshold', () => {
    expect(evaluateRule(rule({ type: 'species_score', species_id: 'requin', operator: '>=', value: '50' }), baseConditions)).toBe(false);
  });

  it('pressure_trend = value passes on match', () => {
    expect(evaluateRule(rule({ type: 'pressure_trend', operator: '=', value: 'baisse' }), baseConditions)).toBe(true);
  });

  it('pressure_trend = value fails on mismatch', () => {
    expect(evaluateRule(rule({ type: 'pressure_trend', operator: '=', value: 'hausse' }), baseConditions)).toBe(false);
  });

  it('tide_phase = etale_pm matches when conditions report etale_pm', () => {
    expect(evaluateRule(rule({ type: 'tide_phase', operator: '=', value: 'etale_pm' }), { ...baseConditions, tide_phase: 'etale_pm' })).toBe(true);
  });

  it('tide_phase = etale_bm matches when conditions report etale_bm', () => {
    expect(evaluateRule(rule({ type: 'tide_phase', operator: '=', value: 'etale_bm' }), { ...baseConditions, tide_phase: 'etale_bm' })).toBe(true);
  });

  it('tide_phase = etale_pm does not match etale_bm', () => {
    expect(evaluateRule(rule({ type: 'tide_phase', operator: '=', value: 'etale_pm' }), { ...baseConditions, tide_phase: 'etale_bm' })).toBe(false);
  });


  it('cloud_cover <= threshold passes when sky is clear', () => {
    expect(evaluateRule(rule({ type: 'cloud_cover', operator: '<=', value: '30' }), baseConditions)).toBe(true);
  });

  it('cloud_cover <= threshold fails when sky is overcast', () => {
    expect(evaluateRule(rule({ type: 'cloud_cover', operator: '<=', value: '30' }), { ...baseConditions, cloud_cover: 80 })).toBe(false);
  });

  it('cloud_cover rule blocks notification when data is unavailable', () => {
    expect(evaluateRule(rule({ type: 'cloud_cover', operator: '<=', value: '30' }), { ...baseConditions, cloud_cover: null })).toBe(false);
  });
});

describe('evaluateRules', () => {
  it('returns true when all rules pass', () => {
    const rules: NotificationRule[] = [
      rule({ type: 'species_score', species_id: 'bar', operator: '>=', value: '80' }),
      rule({ type: 'wind_speed', operator: '<=', value: '15' }),
      rule({ type: 'coefficient', operator: '>=', value: '70' }),
    ];
    expect(evaluateRules(rules, baseConditions)).toBe(true);
  });

  it('returns false when one rule fails', () => {
    const rules: NotificationRule[] = [
      rule({ type: 'species_score', species_id: 'bar', operator: '>=', value: '80' }),
      rule({ type: 'wind_speed', operator: '<=', value: '5' }),
    ];
    expect(evaluateRules(rules, baseConditions)).toBe(false);
  });

  it('returns true when rule list is empty', () => {
    expect(evaluateRules([], baseConditions)).toBe(true);
  });

  it('disabled rules are skipped — does not block notification', () => {
    const rules: NotificationRule[] = [
      rule({ type: 'species_score', species_id: 'bar', operator: '>=', value: '80' }),
      rule({ type: 'wind_speed', operator: '<=', value: '5', enabled: false }),
    ];
    expect(evaluateRules(rules, baseConditions)).toBe(true);
  });
});
