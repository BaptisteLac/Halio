import { getCurrentTideHour, getTidePhaseAtTime } from '@/lib/tides/tide-service';
import { calculateFishingScore } from '@/lib/scoring/fishing-score';
import type { TideData, WeatherData, SolunarData, BestWindow, SpeciesResult } from '@/types';

const THRESHOLD = 65;
const SLOTS = 24; // créneaux horaires sur 24h
const SLOT_MS = 60 * 60 * 1000;

/**
 * Calcule la meilleure fenêtre de pêche sur 24h pour un ensemble d'espèces.
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
      return calculateFishingScore(
        species, spot, weatherData, syntheticTide, solunarData, slotTime
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
