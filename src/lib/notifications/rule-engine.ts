export type RuleType =
  | 'species_score' | 'global_score'
  | 'wind_speed' | 'wind_direction' | 'coefficient'
  | 'tide_phase' | 'pressure_trend'
  | 'cloud_cover' | 'swell_height'
  | 'hour_of_day_range';
export type Operator = '>' | '<' | '>=' | '<=' | '=';

export type NotificationRule = {
  id: string;
  user_id: string;
  zone_id: string;
  type: RuleType;
  species_id: string | null;
  operator: Operator;
  value: string;
  enabled: boolean;
};

export type ComputedConditions = {
  hour: number;
  global_score: number;
  species_scores: Record<string, number>;
  wind_speed: number;
  wind_direction: number | null;
  coefficient: number;
  tide_phase: 'montant' | 'descendant' | 'etale_pm' | 'etale_bm';
  pressure_trend: 'hausse' | 'stable' | 'baisse';
  cloud_cover: number | null;
  swell_height: number | null;
};

export const WIND_SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;
export type WindSector = (typeof WIND_SECTORS)[number];

export function degreesToCardinal8(deg: number): WindSector {
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 45) % 8;
  return WIND_SECTORS[idx];
}

export function evaluateRule(rule: NotificationRule, conditions: ComputedConditions): boolean {
  if (rule.type === 'tide_phase') {
    return conditions.tide_phase === rule.value;
  }
  if (rule.type === 'pressure_trend') {
    return conditions.pressure_trend === rule.value;
  }
  if (rule.type === 'hour_of_day_range') {
    const [start, end] = rule.value.split('-').map(Number);
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    return conditions.hour >= start && conditions.hour <= end;
  }
  if (rule.type === 'wind_direction') {
    if (conditions.wind_direction === null) return false;
    const selected = rule.value.split(',').map((s) => s.trim()).filter(Boolean);
    if (selected.length === 0) return false;
    return selected.includes(degreesToCardinal8(conditions.wind_direction));
  }

  let actual: number;
  if (rule.type === 'species_score') {
    actual = conditions.species_scores[rule.species_id ?? ''] ?? 0;
  } else if (rule.type === 'global_score') {
    actual = conditions.global_score;
  } else if (rule.type === 'wind_speed') {
    actual = conditions.wind_speed;
  } else if (rule.type === 'cloud_cover') {
    if (conditions.cloud_cover === null) return false;
    actual = conditions.cloud_cover;
  } else if (rule.type === 'swell_height') {
    if (conditions.swell_height === null) return false;
    actual = conditions.swell_height;
  } else {
    actual = conditions.coefficient;
  }

  const threshold = Number(rule.value);
  switch (rule.operator) {
    case '>':  return actual > threshold;
    case '<':  return actual < threshold;
    case '>=': return actual >= threshold;
    case '<=': return actual <= threshold;
    case '=':  return actual === threshold;
    default: return false;
  }
}

export function evaluateRules(rules: NotificationRule[], conditions: ComputedConditions): boolean {
  return rules.filter((r) => r.enabled).every((r) => evaluateRule(r, conditions));
}

export function evaluateRulesAcrossDay(
  rules: NotificationRule[],
  hourlyConditions: ComputedConditions[],
): { matched: boolean; matchingHours: number[] } {
  const enabled = rules.filter((r) => r.enabled);
  const matchingHours = hourlyConditions
    .filter((c) => enabled.every((r) => evaluateRule(r, c)))
    .map((c) => c.hour);
  return { matched: matchingHours.length > 0, matchingHours };
}
