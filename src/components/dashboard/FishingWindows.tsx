'use client';

import { useMemo, useState } from 'react';
import { getCurrentTideHour, getTidePhaseAtTime } from '@/lib/tides/tide-service';
import { calculateFishingScore, getFishingScoreLabel } from '@/lib/scoring/fishing-score';
import { getBestWindow } from '@/lib/scoring/fishing-windows';
import type { TideData, WeatherData, SolunarData, SpeciesResult } from '@/types';

const SLOTS = 24; // créneaux de 1h sur 24h
const SLOT_MS = 60 * 60 * 1000;

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

function tooltipTextColor(score: number): string {
  if (score >= 80) return 'text-cyan-300';
  if (score >= 65) return 'text-green-300';
  if (score >= 50) return 'text-yellow-300';
  if (score >= 35) return 'text-orange-300';
  return 'text-slate-400';
}

function fmtHour(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

interface TooltipState {
  slotIndex: number;
  speciesIndex: number;
}

export default function FishingWindows({
  topSpecies,
  tideData,
  weatherData,
  solunarData,
  now,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Timelines par espèce + position du créneau courant pour l'affichage
  const { speciesTimelines, currentSlotIndex, slots } = useMemo(() => {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const slots = Array.from(
      { length: SLOTS },
      (_, i) => new Date(startOfDay.getTime() + i * SLOT_MS)
    );

    const currentSlotIndex = Math.min(
      SLOTS - 1,
      Math.floor((now.getTime() - startOfDay.getTime()) / SLOT_MS)
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

    return { speciesTimelines, currentSlotIndex, slots };
  }, [topSpecies, tideData, weatherData, solunarData, now]);

  // Meilleure fenêtre via la fonction lib partagée (évite la duplication de l'algo)
  const bestWindow = useMemo(
    () => getBestWindow(topSpecies, tideData, weatherData, solunarData, now),
    [topSpecies, tideData, weatherData, solunarData, now]
  );

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
      <h3 className="text-slate-300 font-medium text-sm">Fenêtres de pêche</h3>

      <div
        className="space-y-4"
        onPointerDown={(e) => {
          // Ferme le tooltip si le tap est en dehors des slots
          if (e.target === e.currentTarget) setTooltip(null);
        }}
      >
        {speciesTimelines.map((timeline, si) => {
          const species = topSpecies[si]!.species;
          const activeTooltip = tooltip?.speciesIndex === si ? tooltip.slotIndex : null;

          return (
            <div key={species.id} className="space-y-1">
              <span className="text-xs text-slate-400">{species.name}</span>

              {/* Timeline */}
              <div className="relative">
                {/* Lignes de repère verticales 6h / 12h / 18h */}
                {[6, 12, 18].map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 w-px bg-slate-600/40 pointer-events-none z-10"
                    style={{ left: `${(h / 24) * 100}%` }}
                  />
                ))}

                {/* Blocs */}
                <div className="flex gap-px h-5 overflow-hidden rounded-lg">
                  {timeline.map((score, i) => (
                    <div
                      key={i}
                      className={`flex-1 cursor-pointer transition-opacity ${slotColor(score)} ${
                        activeTooltip !== null && activeTooltip !== i ? 'opacity-50' : 'opacity-100'
                      }`}
                      onClick={() =>
                        setTooltip((prev) =>
                          prev?.slotIndex === i && prev.speciesIndex === si ? null : { slotIndex: i, speciesIndex: si }
                        )
                      }
                    />
                  ))}
                </div>

                {/* Marqueur heure courante */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-400 pointer-events-none z-20"
                  style={{ left: `${((currentSlotIndex + 0.5) / SLOTS) * 100}%` }}
                />

                {/* Tooltip */}
                {activeTooltip !== null && slots[activeTooltip] && (
                  <div
                    className="absolute z-30 -top-10 bg-slate-900 border border-slate-600/60 rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none whitespace-nowrap"
                    style={{
                      left: `clamp(0px, calc(${((activeTooltip + 0.5) / SLOTS) * 100}% - 3rem), calc(100% - 6rem))`,
                    }}
                  >
                    <span className="text-slate-400 text-xs">
                      {fmtHour(slots[activeTooltip]!)}
                    </span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <span className={`text-xs font-semibold ${tooltipTextColor(timeline[activeTooltip] ?? 0)}`}>
                      {getFishingScoreLabel(timeline[activeTooltip] ?? 0)}
                    </span>
                    <span className="ml-1.5 text-slate-400 text-xs">
                      ({timeline[activeTooltip]})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axe temporel */}
      <div className="flex justify-between text-xs text-slate-400 px-0">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>

      {/* Légende couleurs */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { color: 'bg-cyan-500',       label: 'Excellent' },
          { color: 'bg-green-500/80',   label: 'Bon' },
          { color: 'bg-yellow-500/50',  label: 'Moyen' },
          { color: 'bg-orange-500/40',  label: 'Faible' },
          { color: 'bg-slate-700/30',   label: 'Nul' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Meilleure fenêtre */}
      {bestWindow ? (
        <div className="bg-cyan-950/50 border border-cyan-700/40 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
          <span className="text-cyan-300 text-sm font-medium">
            ★ Meilleure sortie : {fmtHour(bestWindow.start)} → {fmtHour(bestWindow.end)}
          </span>
          <span className="text-cyan-600 text-xs">·</span>
          <span className={`text-xs font-semibold ${tooltipTextColor(bestWindow.score)}`}>
            {getFishingScoreLabel(bestWindow.score)} ({bestWindow.score})
          </span>
        </div>
      ) : (
        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg px-3 py-2 text-center">
          <span className="text-slate-400 text-sm">Aucune fenêtre optimale aujourd&apos;hui</span>
        </div>
      )}
    </div>
  );
}
