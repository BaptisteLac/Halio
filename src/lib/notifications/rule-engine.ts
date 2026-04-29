export type RuleType = 'species_score' | 'global_score' | 'wind_speed' | 'coefficient' | 'tide_phase' | 'pressure_trend';
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
  tide_phase: 'montant' | 'descendant' | 'etale';
  pressure_trend: 'hausse' | 'stable' | 'baisse';
};

export function evaluateRule(rule: NotificationRule, conditions: ComputedConditions): boolean {
  const stringTypes: RuleType[] = ['tide_phase', 'pressure_trend'];
  if (stringTypes.includes(rule.type)) {
    const actual = rule.type === 'tide_phase' ? conditions.tide_phase : conditions.pressure_trend;
    return actual === rule.value;
  }

  let actual: number;
  if (rule.type === 'species_score') {
    actual = conditions.species_scores[rule.species_id ?? ''] ?? 0;
  } else if (rule.type === 'global_score') {
    actual = conditions.global_score;
  } else if (rule.type === 'wind_speed') {
    actual = conditions.wind_speed;
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
