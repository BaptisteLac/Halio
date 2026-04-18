import { getCurrentTideHour, getTidePhaseAtTime } from '@/lib/tides/tide-service';
import { calculateFishingScore } from '@/lib/scoring/fishing-score';
import type { TideData, WeatherData, SolunarData, BestWindow, SpeciesResult, PressureTrend } from '@/types';

const THRESHOLD = 65;
const SLOTS = 24;
const SLOT_MS = 60 * 60 * 1000;

/**
 * Construit une WeatherData avec les conditions prévues à l'heure du slot.
 * Utilise weather.hourly pour vent, direction et tendance pression.
 * Fallback sur weather.current si le slot n'a pas d'entrée horaire.
 */
function weatherAtSlot(weather: WeatherData, slotTime: Date): WeatherData {
  const d = slotTime.toDateString();
  const h = slotTime.getHours();
  const idx = weather.hourly.findIndex(
    (e) => e.time.toDateString() === d && e.time.getHours() === h
  );
  if (idx === -1) return weather;

  const entry = weather.hourly[idx]!;
  const prev = weather.hourly[idx - 3];
  const diff = prev ? entry.pressure - prev.pressure : 0;
  const pressureTrend: PressureTrend = diff > 1 ? 'hausse' : diff < -1 ? 'baisse' : 'stable';

  return {
    ...weather,
    current: {
      ...weather.current,
      windSpeed: entry.windSpeed,
      windDirection: entry.windDirection,
      windGusts: entry.windGusts,
      pressure: entry.pressure,
      pressureTrend,
    },
  };
}

export { weatherAtSlot };

/**
 * Calcule la meilleure fenêtre de pêche sur 24h pour un ensemble d'espèces.
 * Chaque créneau horaire utilise les prévisions météo correspondantes.
 * Retourne null si aucun créneau n'atteint le seuil de qualité (65/100).
 */
export function getBestWindow(
  topSpecies: SpeciesResult[],
  tideData: TideData,
  weatherData: WeatherData,
  solunarData: SolunarData,
  date: Date
): BestWindow | null {
  if (topSpecies.length === 0) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const slots = Array.from(
    { length: SLOTS },
    (_, i) => new Date(startOfDay.getTime() + i * SLOT_MS)
  );

  const speciesTimelines = topSpecies.map(({ species, spot }) =>
    slots.map((slotTime) => {
      const currentHour = getCurrentTideHour(slotTime, tideData.extremes);
      const currentPhase = getTidePhaseAtTime(slotTime, tideData.extremes);
      const syntheticTide: TideData = { ...tideData, currentHour, currentPhase };
      const slotWeather = weatherAtSlot(weatherData, slotTime);
      return calculateFishingScore(
        species, spot, slotWeather, syntheticTide, solunarData, slotTime
      ).total;
    })
  );

  const n = speciesTimelines.length;
  const combinedScores = slots.map((_, i) =>
    speciesTimelines.reduce((sum, tl) => sum + (tl[i] ?? 0), 0) / n
  );

  const maxCombined = Math.max(...combinedScores);
  if (maxCombined < THRESHOLD) return null;

  const peakIdx = combinedScores.indexOf(maxCombined);
  const isGood = combinedScores.map((avg) => avg >= THRESHOLD);

  let wStart = peakIdx;
  let wEnd = peakIdx;
  while (wStart > 0 && isGood[wStart - 1]) wStart--;
  while (wEnd < SLOTS - 1 && isGood[wEnd + 1]) wEnd++;

  return {
    start: slots[wStart]!,
    end: new Date(slots[wEnd]!.getTime() + SLOT_MS),
    score: Math.round(maxCombined),
  };
}
