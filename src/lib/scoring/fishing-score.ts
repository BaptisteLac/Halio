import type { Species, Spot, WeatherData, TideData, SolunarData, FishingScore, ScoreFactors } from '@/types';
import { getSolunarScore } from '@/lib/solunar/solunar-service';
import { kmhToKnots } from '@/lib/weather/weather-service';
import { angleDiff } from '@/lib/utils/geo';
import { SPOTS } from '@/data/spots';

// Température moyenne de surface (SST) à Arcachon par mois (°C)
// Source : climatologie SHOM/Ifremer Arcachon Eyrac
const ARCACHON_SST_MONTHLY = [10, 9, 10, 12, 15, 18, 21, 22, 20, 17, 14, 11];

function getArcachonWaterTemp(date: Date): number {
  return ARCACHON_SST_MONTHLY[date.getMonth()] ?? 15;
}

function gaussianScore(value: number, optimal: number, sigma: number): number {
  return Math.round(Math.max(0, Math.exp(-Math.pow(value - optimal, 2) / (2 * sigma * sigma)) * 100));
}

function tideHourScore(currentHour: number, optimalHours: number[]): number {
  if (optimalHours.includes(currentHour)) return 100;
  const minDist = Math.min(...optimalHours.map((h) => Math.abs(h - currentHour)));
  return Math.max(0, 100 - minDist * 25);
}

function windForceScore(windKnots: number, optimalMin: number, optimalMax: number, maxSafe: number): number {
  if (windKnots > maxSafe) return 0;
  if (windKnots >= optimalMin && windKnots <= optimalMax) return 100;
  if (windKnots < optimalMin) {
    return optimalMin === 0 ? 100 : Math.round((windKnots / optimalMin) * 100);
  }
  if (maxSafe === optimalMax) return 0;
  return Math.round(((maxSafe - windKnots) / (maxSafe - optimalMax)) * 100);
}

function windDirectionScore(windDegrees: number, optimalDirs: number[]): number {
  if (optimalDirs.length === 0) return 50;
  const minDiff = Math.min(...optimalDirs.map((d) => angleDiff(windDegrees, d)));
  return Math.round(Math.max(0, 100 - (minDiff / 90) * 100));
}

function pressureTrendScore(trend: 'hausse' | 'stable' | 'baisse'): number {
  if (trend === 'baisse') return 80;
  if (trend === 'stable') return 50;
  return 20;
}

function dawnDuskScore(now: Date, sunrise: Date, sunset: Date): number {
  const ONE_HOUR = 60 * 60 * 1000;
  const distSunrise = Math.abs(now.getTime() - sunrise.getTime());
  const distSunset = Math.abs(now.getTime() - sunset.getTime());
  const minDist = Math.min(distSunrise, distSunset);
  if (minDist <= ONE_HOUR) return Math.round(100 * (1 - minDist / ONE_HOUR));
  return 0;
}

function waterTempScore(
  temp: number,
  optimalMin: number,
  optimalMax: number,
  absoluteMin: number
): number {
  if (temp < absoluteMin) return 0;
  if (temp >= optimalMin && temp <= optimalMax) return 100;
  if (temp < optimalMin) {
    const range = optimalMin - absoluteMin;
    return range === 0 ? 0 : Math.round(((temp - absoluteMin) / range) * 100);
  }
  return Math.max(0, Math.round(100 - (temp - optimalMax) * 10));
}

export function getFishingScoreLabel(score: number): string {
  if (score >= 85) return 'Exceptionnel';
  if (score >= 70) return 'Excellent';
  if (score >= 55) return 'Bon';
  if (score >= 40) return 'Moyen';
  if (score >= 25) return 'Faible';
  return 'Déconseillé';
}

export function getFishingScoreColor(score: number): string {
  if (score >= 85) return 'text-cyan-400';
  if (score >= 70) return 'text-green-400';
  if (score >= 55) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function getFishingScoreBg(score: number): string {
  if (score >= 85) return 'bg-cyan-400/20 border-cyan-400/40';
  if (score >= 70) return 'bg-green-400/20 border-green-400/40';
  if (score >= 55) return 'bg-yellow-400/20 border-yellow-400/40';
  if (score >= 40) return 'bg-orange-400/20 border-orange-400/40';
  return 'bg-red-400/20 border-red-400/40';
}

export function calculateFishingScore(
  species: Species,
  spot: Spot,
  weather: WeatherData,
  tide: TideData,
  solunar: SolunarData,
  date: Date
): FishingScore {
  const w = species.scoreWeights;
  const windKnots = kmhToKnots(weather.current.windSpeed);
  const waterTemp = getArcachonWaterTemp(date);

  const factors: ScoreFactors = {
    coeffScore: gaussianScore(tide.coefficient, w.coeff.optimal, w.coeff.sigma),
    tideHourScore: tideHourScore(tide.currentHour, w.tideHour.optimal),
    windScore: windForceScore(windKnots, w.wind.optimalMin, w.wind.optimalMax, w.wind.maxSafe),
    windDirScore: windDirectionScore(weather.current.windDirection, spot.optimalWindDir),
    pressureScore: pressureTrendScore(weather.current.pressureTrend),
    solunarScore: getSolunarScore(date, solunar.periods),
    dawnDuskScore: dawnDuskScore(date, solunar.sunrise, solunar.sunset),
    tempScore: waterTempScore(waterTemp, w.temp.optimalMin, w.temp.optimalMax, w.temp.absoluteMin),
  };

  const total = Math.round(
    factors.coeffScore * w.coeff.weight +
    factors.tideHourScore * w.tideHour.weight +
    factors.windScore * w.wind.weight +
    factors.windDirScore * w.windDir.weight +
    factors.pressureScore * w.pressure.weight +
    factors.solunarScore * w.solunar.weight +
    factors.dawnDuskScore * w.dawnDusk.weight +
    factors.tempScore * w.temp.weight
  );

  return {
    total: Math.max(0, Math.min(100, total)),
    factors,
    label: getFishingScoreLabel(total),
    color: getFishingScoreColor(total),
  };
}

/**
 * Retourne les N meilleures espèces de saison pour les conditions données
 */
function isSpeciesInSeason(species: Species, month: number): boolean {
  const { start, end } = species.season;
  if (start <= end) return month >= start && month <= end;
  // Saison cyclique (ex: sole oct→mars : start=10, end=3)
  return month >= start || month <= end;
}

/**
 * Calcule le meilleur score possible pour une espèce en testant tous les spots qui la ciblent.
 * Retourne le score le plus élevé avec le spot correspondant.
 */
export function getBestScoreForSpecies(
  species: Species,
  spots: Spot[],
  weather: WeatherData,
  tide: TideData,
  solunar: SolunarData,
  date: Date,
  fallbackSpot: Spot
): { score: FishingScore; spot: Spot } {
  const candidates = spots.filter((sp) => sp.species.includes(species.id));
  const pool = candidates.length > 0 ? candidates : [fallbackSpot];
  return pool.reduce<{ score: FishingScore; spot: Spot } | null>((best, spot) => {
    const score = calculateFishingScore(species, spot, weather, tide, solunar, date);
    if (!best || score.total > best.score.total) return { score, spot };
    return best;
  }, null)!;
}

export function getTopSpeciesForConditions(
  allSpecies: Species[],
  fallbackSpot: Spot,
  weather: WeatherData,
  tide: TideData,
  solunar: SolunarData,
  date: Date,
  limit = 3
): Array<{ species: Species; score: FishingScore; spot: Spot }> {
  const currentMonth = date.getMonth() + 1;
  const inSeason = allSpecies.filter((s) => isSpeciesInSeason(s, currentMonth));

  return inSeason
    .map((s) => {
      const { score, spot } = getBestScoreForSpecies(s, SPOTS, weather, tide, solunar, date, fallbackSpot);
      return { species: s, score, spot };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, limit);
}
