import SunCalc from "npm:suncalc@1";
import TidePredictor from "npm:@neaps/tide-predictor@2";
import { nearest } from "npm:@neaps/tide-database@1";

export type RuleType = "species_score" | "global_score" | "wind_speed" | "coefficient" | "tide_phase" | "pressure_trend";
export type Operator = ">" | "<" | ">=" | "<=" | "=";

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
  tide_phase: "montant" | "descendant" | "etale";
  pressure_trend: "hausse" | "stable" | "baisse";
};

export const SPECIES_WEIGHTS: Record<string, {
  coeff: { opt: number; sig: number };
  wind:  { min: number; max: number; safe: number };
  temp:  { min: number; max: number; absMin: number };
}> = {
  bar:    { coeff: { opt: 75, sig: 20 }, wind: { min: 8,  max: 18, safe: 25 }, temp: { min: 14, max: 20, absMin: 10 } },
  dorade: { coeff: { opt: 55, sig: 25 }, wind: { min: 5,  max: 15, safe: 25 }, temp: { min: 16, max: 23, absMin: 12 } },
  maigre: { coeff: { opt: 90, sig: 15 }, wind: { min: 0,  max: 8,  safe: 20 }, temp: { min: 18, max: 25, absMin: 15 } },
  seiche: { coeff: { opt: 50, sig: 20 }, wind: { min: 5,  max: 12, safe: 18 }, temp: { min: 12, max: 18, absMin: 8  } },
  sole:   { coeff: { opt: 80, sig: 15 }, wind: { min: 0,  max: 12, safe: 20 }, temp: { min: 10, max: 17, absMin: 6  } },
  mulet:  { coeff: { opt: 60, sig: 25 }, wind: { min: 0,  max: 15, safe: 22 }, temp: { min: 14, max: 22, absMin: 10 } },
};

export const SST_MONTHLY = [10, 9, 10, 12, 15, 18, 21, 22, 20, 17, 14, 11];

export function gaussian(v: number, opt: number, sig: number): number {
  return Math.round(Math.max(0, Math.exp(-((v - opt) ** 2) / (2 * sig ** 2)) * 100));
}

export function windScore(kn: number, min: number, max: number, safe: number): number {
  if (kn > safe) return 0;
  if (kn >= min && kn <= max) return 100;
  if (kn < min) return min === 0 ? 100 : Math.round((kn / min) * 80);
  return Math.round(((safe - kn) / (safe - max)) * 100);
}

export function pressureScore(trend: "hausse" | "stable" | "baisse"): number {
  return trend === "baisse" ? 80 : trend === "stable" ? 50 : 20;
}

export function tempScore(temp: number, min: number, max: number, absMin: number): number {
  if (temp < absMin) return 0;
  if (temp >= min && temp <= max) return 100;
  if (temp < min) return Math.round(((temp - absMin) / (min - absMin)) * 100);
  return Math.max(0, Math.round(100 - (temp - max) * 10));
}

export function computeSpeciesScore(
  speciesId: string,
  coeff: number,
  windKn: number,
  trend: "hausse" | "stable" | "baisse",
  temp: number,
): number {
  const w = SPECIES_WEIGHTS[speciesId];
  if (!w) return 0;
  return Math.round(
    gaussian(coeff, w.coeff.opt, w.coeff.sig) * 0.40 +
    windScore(windKn, w.wind.min, w.wind.max, w.wind.safe) * 0.35 +
    pressureScore(trend) * 0.15 +
    tempScore(temp, w.temp.min, w.temp.max, w.temp.absMin) * 0.10,
  );
}

export function estimateCoefficient(moonPhase: number): number {
  const dist = 1 - Math.abs((moonPhase % 0.5) / 0.25 - 1);
  return Math.round(45 + dist * 50);
}

export function computeGlobalScore(speciesScores: Record<string, number>): number {
  const values = Object.values(speciesScores);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function evaluateRule(rule: NotificationRule, c: ComputedConditions): boolean {
  if (rule.type === "tide_phase") return c.tide_phase === rule.value;
  if (rule.type === "pressure_trend") return c.pressure_trend === rule.value;

  let actual: number;
  if (rule.type === "species_score") actual = c.species_scores[rule.species_id ?? ""] ?? 0;
  else if (rule.type === "global_score") actual = c.global_score;
  else if (rule.type === "wind_speed") actual = c.wind_speed;
  else actual = c.coefficient;

  const threshold = Number(rule.value);
  if (rule.operator === ">")  return actual > threshold;
  if (rule.operator === "<")  return actual < threshold;
  if (rule.operator === ">=") return actual >= threshold;
  if (rule.operator === "<=") return actual <= threshold;
  return actual === threshold;
}

export function evaluateRules(rules: NotificationRule[], c: ComputedConditions): boolean {
  return rules.filter((r) => r.enabled).every((r) => evaluateRule(r, c));
}

export function computeTidePhase(
  lat: number,
  lng: number,
  referenceTime: Date,
): "montant" | "descendant" | "etale" {
  const result = nearest({ latitude: lat, longitude: lng });
  if (!result) return "montant";
  const [station] = result;

  const start = new Date(referenceTime);
  start.setDate(start.getDate() - 1);
  const end = new Date(referenceTime);
  end.setDate(end.getDate() + 1);

  const predictor = TidePredictor(station.harmonic_constituents);
  const extremes: Array<{ time: Date; high: boolean }> = predictor.getExtremesPrediction({ start, end });

  const refMs = referenceTime.getTime();
  const ONE_HOUR = 60 * 60 * 1000;

  const before = extremes.filter((e) => new Date(e.time).getTime() <= refMs).pop();
  const after   = extremes.find((e)   => new Date(e.time).getTime() > refMs);

  if (before && Math.abs(refMs - new Date(before.time).getTime()) < ONE_HOUR) return "etale";
  if (after  && Math.abs(new Date(after.time).getTime() - refMs)  < ONE_HOUR) return "etale";

  if (before?.high === false) return "montant";
  if (before?.high === true)  return "descendant";
  return "montant";
}

export function computeConditions(
  lat: number,
  lng: number,
  targetDate: Date,
  windKn: number,
  pressureTrend: "hausse" | "stable" | "baisse",
): ComputedConditions {
  const moonIllum = SunCalc.getMoonIllumination(targetDate);
  const coefficient = estimateCoefficient(moonIllum.phase);
  const temp = SST_MONTHLY[targetDate.getMonth()];

  const referenceTime = new Date(targetDate);
  referenceTime.setUTCHours(8, 0, 0, 0);
  const tide_phase = computeTidePhase(lat, lng, referenceTime);

  const speciesScores: Record<string, number> = {};
  for (const id of Object.keys(SPECIES_WEIGHTS)) {
    speciesScores[id] = computeSpeciesScore(id, coefficient, windKn, pressureTrend, temp);
  }

  return {
    global_score: computeGlobalScore(speciesScores),
    species_scores: speciesScores,
    wind_speed: windKn,
    coefficient,
    tide_phase,
    pressure_trend: pressureTrend,
  };
}
