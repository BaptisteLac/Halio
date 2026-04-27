'use client';

import { useMemo, useState } from 'react';
import { getCurrentTideHour, getTidePhaseAtTime } from '@/lib/tides/tide-service';
import { calculateFishingScore, getFishingScoreLabel } from '@/lib/scoring/fishing-score';
import { getBestWindow, weatherAtSlot } from '@/lib/scoring/fishing-windows';
import type { TideData, WeatherData, SolunarData, SpeciesResult } from '@/types';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { T, scoreColor } from '@/design/tokens';

const SLOTS = 24;
const SLOT_MS = 60 * 60 * 1000;

interface Props {
  topSpecies: SpeciesResult[];
  tideData: TideData;
  weatherData: WeatherData;
  solunarData: SolunarData;
  now: Date;
}

function slotBg(score: number): string {
  if (score >= 80) return '#22d3ee';
  if (score >= 65) return 'rgba(74,222,128,.8)';
  if (score >= 50) return 'rgba(250,204,21,.5)';
  if (score >= 35) return 'rgba(251,146,60,.4)';
  return T.l3;
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
        const slotWeather = weatherAtSlot(weatherData, slotTime);
        return calculateFishingScore(
          species, spot, slotWeather, syntheticTide, solunarData, slotTime
        ).total;
      })
    );

    return { speciesTimelines, currentSlotIndex, slots };
  }, [topSpecies, tideData, weatherData, solunarData, now]);

  const bestWindow = useMemo(
    () => getBestWindow(topSpecies, tideData, weatherData, solunarData, now),
    [topSpecies, tideData, weatherData, solunarData, now]
  );

  return (
    <div style={{
      background: T.l2,
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t2, margin: 0 }}>Fenêtres de pêche</h3>
        <InfoTooltip content="Créneaux horaires où toutes les conditions convergent : heure de marée optimale, période solunaire active, aube ou crépuscule. Plus la barre est verte, plus le moment est favorable." />
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setTooltip(null);
        }}
      >
        {speciesTimelines.map((timeline, si) => {
          const species = topSpecies[si]!.species;
          const activeTooltip = tooltip?.speciesIndex === si ? tooltip.slotIndex : null;

          return (
            <div key={species.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', color: T.t3 }}>{species.name}</span>

              <div style={{ position: 'relative' }}>
                {[6, 12, 18].map((h) => (
                  <div
                    key={h}
                    style={{
                      position: 'absolute', top: 0, bottom: 0,
                      width: 1, background: `${T.border2}`,
                      pointerEvents: 'none', zIndex: 10,
                      left: `${(h / 24) * 100}%`,
                    }}
                  />
                ))}

                <div style={{ display: 'flex', gap: 1, height: 20, overflow: 'hidden', borderRadius: 10 }}>
                  {timeline.map((score, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        background: slotBg(score),
                        opacity: activeTooltip !== null && activeTooltip !== i ? 0.4 : 1,
                        transition: 'opacity 0.12s ease',
                      }}
                      onClick={() =>
                        setTooltip((prev) =>
                          prev?.slotIndex === i && prev.speciesIndex === si ? null : { slotIndex: i, speciesIndex: si }
                        )
                      }
                    />
                  ))}
                </div>

                <div
                  style={{
                    position: 'absolute', top: 0, bottom: 0,
                    width: 2, background: 'rgba(255,255,255,.6)',
                    pointerEvents: 'none', zIndex: 20,
                    left: `${((currentSlotIndex + 0.5) / SLOTS) * 100}%`,
                  }}
                />

                {activeTooltip !== null && slots[activeTooltip] && (
                  <div
                    style={{
                      position: 'absolute', zIndex: 30, top: -42,
                      background: T.l1,
                      border: `1px solid ${T.border2}`,
                      borderRadius: 10,
                      padding: '6px 10px',
                      boxShadow: '0 4px 16px rgba(0,0,0,.4)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      left: `clamp(0px, calc(${((activeTooltip + 0.5) / SLOTS) * 100}% - 3rem), calc(100% - 6rem))`,
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: T.t3 }}>
                      {fmtHour(slots[activeTooltip]!)}
                    </span>
                    <span style={{ margin: '0 6px', color: T.t4 }}>·</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: scoreColor(timeline[activeTooltip] ?? 0) }}>
                      {getFishingScoreLabel(timeline[activeTooltip] ?? 0)}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: '0.75rem', color: T.t3 }}>
                      ({timeline[activeTooltip]})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {['0h', '6h', '12h', '18h', '24h'].map((label) => (
          <span key={label} style={{ fontSize: '0.75rem', color: T.t4 }}>{label}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {[
          { color: '#22d3ee',              label: 'Exceptionnel' },
          { color: 'rgba(74,222,128,.8)',  label: 'Excellent' },
          { color: 'rgba(250,204,21,.5)',  label: 'Bon' },
          { color: 'rgba(251,146,60,.4)', label: 'Moyen' },
          { color: T.l3,                  label: 'Faible' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color, border: `1px solid ${T.border}` }} />
            <span style={{ fontSize: '0.75rem', color: T.t4 }}>{label}</span>
          </div>
        ))}
      </div>

      {bestWindow ? (
        <div style={{
          background: 'rgba(34,211,238,.08)',
          border: `1px solid rgba(34,211,238,.2)`,
          borderRadius: 10,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#a5f3fc' }}>
            ★ Meilleure sortie : {fmtHour(bestWindow.start)} → {fmtHour(bestWindow.end)}
          </span>
          <span style={{ color: T.t4, fontSize: '0.75rem' }}>·</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: scoreColor(bestWindow.score) }}>
            {getFishingScoreLabel(bestWindow.score)} ({bestWindow.score})
          </span>
        </div>
      ) : (
        <div style={{
          background: T.l3,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: '8px 12px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '0.875rem', color: T.t3 }}>Aucune fenêtre optimale aujourd&apos;hui</span>
        </div>
      )}
    </div>
  );
}
