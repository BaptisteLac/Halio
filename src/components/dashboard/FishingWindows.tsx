'use client';

import { useMemo } from 'react';
import { getCurrentTideHour, getTidePhaseAtTime } from '@/lib/tides/tide-service';
import { calculateFishingScore } from '@/lib/scoring/fishing-score';
import { DASHBOARD_SPOT } from '@/data/spots';
import type { TideData, WeatherData, SolunarData, Species, FishingScore } from '@/types';
const THRESHOLD = 65;
const SLOTS = 48; // 30-min slots over 24h

interface SpeciesResult {
  species: Species;
  score: FishingScore;
}

interface Props {
  topSpecies: SpeciesResult[];
  tideData: TideData;
  weatherData: WeatherData;
  solunarData: SolunarData;
  now: Date;
}

function slotColor(score: number): string {
  if (score >= 80) return 'bg-cyan-500';
  if (score >= 65) return 'bg-green-500/80';
  if (score >= 50) return 'bg-yellow-500/50';
  if (score >= 35) return 'bg-orange-500/40';
  return 'bg-slate-700/30';
}

function fmtTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

export default function FishingWindows({
  topSpecies,
  tideData,
  weatherData,
  solunarData,
  now,
}: Props) {
  const { speciesTimelines, bestWindow, currentSlotIndex } = useMemo(() => {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const slots = Array.from(
      { length: SLOTS },
      (_, i) => new Date(startOfDay.getTime() + i * 30 * 60 * 1000)
    );

    const currentSlotIndex = Math.min(
      SLOTS - 1,
      Math.floor((now.getTime() - startOfDay.getTime()) / (30 * 60 * 1000))
    );

    // Score par espèce × slot (solunarData couvre la journée entière)
    const speciesTimelines = topSpecies.map(({ species }) =>
      slots.map((slotTime) => {
        const currentHour = getCurrentTideHour(slotTime, tideData.extremes);
        const currentPhase = getTidePhaseAtTime(slotTime, tideData.extremes);
        const syntheticTide: TideData = { ...tideData, currentHour, currentPhase };
        return calculateFishingScore(
          species, DASHBOARD_SPOT, weatherData, syntheticTide, solunarData, slotTime
        ).total;
      })
    );

    // Score moyen par slot (0-100) pour la vue globale — évite qu'une somme dépasse le seuil
    const n = speciesTimelines.length || 1;
    const combinedScores = slots.map((_, i) =>
      speciesTimelines.reduce((sum, tl) => sum + (tl[i] ?? 0), 0) / n
    );

    const maxCombined = Math.max(...combinedScores);
    const peakIdx = combinedScores.indexOf(maxCombined);

    // Expansion du pic : fenêtre continue où le score moyen ≥ THRESHOLD
    const isGood = combinedScores.map((avg) => avg >= THRESHOLD);

    let wStart = peakIdx;
    let wEnd = peakIdx;
    while (wStart > 0 && isGood[wStart - 1]) wStart--;
    while (wEnd < SLOTS - 1 && isGood[wEnd + 1]) wEnd++;

    const bestWindow =
      (combinedScores[peakIdx] ?? 0) >= THRESHOLD
        ? {
            start: slots[wStart]!,
            end: new Date(slots[wEnd]!.getTime() + 30 * 60 * 1000),
          }
        : null;

    return { speciesTimelines, bestWindow, currentSlotIndex };
  }, [topSpecies, tideData, weatherData, solunarData, now]);

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
      <h3 className="text-slate-300 font-medium text-sm">Fenêtres de pêche</h3>

      <div className="space-y-3">
        {speciesTimelines.map((timeline, si) => {
          const species = topSpecies[si]!.species;
          return (
            <div key={species.id} className="space-y-1">
              <span className="text-xs text-slate-400">{species.name}</span>
              <div className="relative">
                <div className="flex gap-px h-3 overflow-hidden rounded-full">
                  {timeline.map((score, i) => (
                    <div key={i} className={`flex-1 ${slotColor(score)}`} />
                  ))}
                </div>
                {/* Marqueur heure courante */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-orange-400/80 pointer-events-none"
                  style={{ left: `${((currentSlotIndex + 0.5) / SLOTS) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Axe temporel */}
      <div className="flex justify-between text-xs text-slate-600">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>

      {/* Meilleure fenêtre */}
      {bestWindow ? (
        <div className="bg-cyan-950/50 border border-cyan-700/40 rounded-lg px-3 py-2 text-center">
          <span className="text-cyan-300 text-sm font-medium">
            ★ Meilleure sortie : {fmtTime(bestWindow.start)} → {fmtTime(bestWindow.end)}
          </span>
        </div>
      ) : (
        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg px-3 py-2 text-center">
          <span className="text-slate-500 text-sm">Aucune fenêtre optimale aujourd&apos;hui</span>
        </div>
      )}
    </div>
  );
}
