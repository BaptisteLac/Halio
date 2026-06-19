import SunCalc from "npm:suncalc@1";
import TidePredictor from "npm:@neaps/tide-predictor@2";
import { nearest } from "npm:@neaps/tide-database@1";

export type RuleType =
  | "species_score" | "global_score"
  | "wind_speed" | "wind_direction" | "coefficient"
  | "tide_phase" | "pressure_trend"
  | "cloud_cover" | "swell_height"
  | "hour_of_day_range";
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
  hour: number;
  global_score: number;
  species_scores: Record<string, number>;
  wind_speed: number;
  wind_direction: number | null;
  coefficient: number;
  tide_phase: "montant" | "descendant" | "etale_pm" | "etale_bm";
  pressure_trend: "hausse" | "stable" | "baisse";
  cloud_cover: number | null;
  swell_height: number | null;
};

export const WIND_SECTORS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
export type WindSector = (typeof WIND_SECTORS)[number];

export function degreesToCardinal8(deg: number): WindSector {
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 45) % 8;
  return WIND_SECTORS[idx];
}

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
  if (rule.type === "tide_phase") {
    return c.tide_phase === rule.value;
  }
  if (rule.type === "pressure_trend") return c.pressure_trend === rule.value;
  if (rule.type === "hour_of_day_range") {
    const [start, end] = rule.value.split("-").map(Number);
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    return c.hour >= start && c.hour <= end;
  }
  if (rule.type === "wind_direction") {
    if (c.wind_direction === null) return false;
    const selected = rule.value.split(",").map((s) => s.trim()).filter(Boolean);
    if (selected.length === 0) return false;
    return selected.includes(degreesToCardinal8(c.wind_direction));
  }

  let actual: number;
  if (rule.type === "species_score") actual = c.species_scores[rule.species_id ?? ""] ?? 0;
  else if (rule.type === "global_score") actual = c.global_score;
  else if (rule.type === "wind_speed") actual = c.wind_speed;
  else if (rule.type === "cloud_cover") {
    if (c.cloud_cover === null) return false;
    actual = c.cloud_cover;
  }
  else if (rule.type === "swell_height") {
    if (c.swell_height === null) return false;
    actual = c.swell_height;
  }
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

export function computeTidePhase(
  lat: number,
  lng: number,
  referenceTime: Date,
): "montant" | "descendant" | "etale_pm" | "etale_bm" {
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

  if (before && Math.abs(refMs - new Date(before.time).getTime()) < ONE_HOUR) return before.high ? "etale_pm" : "etale_bm";
  if (after  && Math.abs(new Date(after.time).getTime() - refMs)  < ONE_HOUR) return after.high  ? "etale_pm" : "etale_bm";

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
  cloudCover: number | null,
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
    hour: 8,
    global_score: computeGlobalScore(speciesScores),
    species_scores: speciesScores,
    wind_speed: windKn,
    wind_direction: null,
    coefficient,
    tide_phase,
    pressure_trend: pressureTrend,
    cloud_cover: cloudCover,
    swell_height: null,
  };
}

// Returns the offset in hours from UTC for the given timezone on the given date.
// Positive = ahead of UTC. e.g. Europe/Paris in summer → 2.
function timezoneOffsetHours(todayStr: string, timezone: string): number {
  const noonUtcMs = Date.parse(`${todayStr}T12:00:00Z`);
  const localHourAtNoonUtc = Number(
    new Date(noonUtcMs).toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }),
  );
  return localHourAtNoonUtc - 12;
}

// Build 24 ComputedConditions snapshots, one per local hour (0..23).
// `hourlyWinds` and `hourlyClouds` come from Open-Meteo with timezone=zone.timezone,
// so index h corresponds to local hour h. `dayWindKn` is the day-level wind used to
// compute species/global scores (kept day-level intentionally — see plan).
export function buildHourlyConditions(
  lat: number,
  lng: number,
  todayStr: string,
  timezone: string,
  hourlyWinds: number[],
  hourlyClouds: (number | null)[],
  hourlyWindDirs: (number | null)[],
  hourlySwell: (number | null)[],
  dayWindKn: number,
  pressureTrend: "hausse" | "stable" | "baisse",
): ComputedConditions[] {
  const utcMidnightMs = Date.parse(`${todayStr}T00:00:00Z`);
  const targetDate = new Date(utcMidnightMs);
  const offsetHours = timezoneOffsetHours(todayStr, timezone);

  const moonIllum = SunCalc.getMoonIllumination(targetDate);
  const coefficient = estimateCoefficient(moonIllum.phase);
  const temp = SST_MONTHLY[targetDate.getUTCMonth()];

  const dailySpeciesScores: Record<string, number> = {};
  for (const id of Object.keys(SPECIES_WEIGHTS)) {
    dailySpeciesScores[id] = computeSpeciesScore(id, coefficient, dayWindKn, pressureTrend, temp);
  }
  const dailyGlobalScore = computeGlobalScore(dailySpeciesScores);

  const result: ComputedConditions[] = [];
  for (let h = 0; h < 24; h++) {
    const referenceTime = new Date(utcMidnightMs + (h - offsetHours) * 3_600_000);
    const tide_phase = computeTidePhase(lat, lng, referenceTime);
    result.push({
      hour: h,
      global_score: dailyGlobalScore,
      species_scores: dailySpeciesScores,
      wind_speed: hourlyWinds[h] ?? dayWindKn,
      wind_direction: hourlyWindDirs[h] ?? null,
      coefficient,
      tide_phase,
      pressure_trend: pressureTrend,
      cloud_cover: hourlyClouds[h] ?? null,
      swell_height: hourlySwell[h] ?? null,
    });
  }
  return result;
}
