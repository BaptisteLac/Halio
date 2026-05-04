export type RuleType = 'species_score' | 'global_score' | 'wind_speed' | 'coefficient' | 'tide_phase' | 'pressure_trend' | 'cloud_cover';
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
  global_score: number;
  species_scores: Record<string, number>;
  wind_speed: number;
  coefficient: number;
  tide_phase: 'montant' | 'descendant' | 'etale' | 'haute' | 'basse';
  pressure_trend: 'hausse' | 'stable' | 'baisse';
  cloud_cover: number;
};

export function evaluateRule(rule: NotificationRule, conditions: ComputedConditions): boolean {
  if (rule.type === 'tide_phase') {
    // Backward-compat: a legacy rule value 'etale' matches the more precise 'haute' or 'basse'.
    if (rule.value === 'etale') return conditions.tide_phase === 'etale' || conditions.tide_phase === 'haute' || conditions.tide_phase === 'basse';
    return conditions.tide_phase === rule.value;
  }
  if (rule.type === 'pressure_trend') {
    return conditions.pressure_trend === rule.value;
  }

  let actual: number;
  if (rule.type === 'species_score') {
    actual = conditions.species_scores[rule.species_id ?? ''] ?? 0;
  } else if (rule.type === 'global_score') {
    actual = conditions.global_score;
  } else if (rule.type === 'wind_speed') {
    actual = conditions.wind_speed;
  } else if (rule.type === 'cloud_cover') {
    actual = conditions.cloud_cover;
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
