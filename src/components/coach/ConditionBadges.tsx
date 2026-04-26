'use client';

import type { CoachContext } from '@/types';
import { kmhToKnots, getWindDirectionLabel } from '@/lib/weather/weather-service';
import { formatTideHour } from '@/lib/tides/tide-utils';
import { T, scoreColor } from '@/design/tokens';

interface ConditionBadgesProps {
  context: CoachContext;
}

export default function ConditionBadges({ context }: ConditionBadgesProps) {
  const { tideData, weatherData, topSpecies } = context;
  const windKnots = kmhToKnots(weatherData.current.windSpeed);
  const windDir   = getWindDirectionLabel(weatherData.current.windDirection);
  const tideLabel = formatTideHour(tideData.currentHour, tideData.currentPhase);
  const topScore  = topSpecies[0]?.score.total ?? null;
  const topLabel  = topSpecies[0]?.score.label ?? null;

  const badges: { label: string; color: string; bg: string; border: string }[] = [
    { label: `Coeff ${tideData.coefficient}`, color: T.accent,  bg: `${T.accent}12`,  border: `${T.accent}30` },
    { label: `${windDir} ${windKnots.toFixed(0)} nd`, color: '#4ade80', bg: 'rgba(74,222,128,.1)', border: 'rgba(74,222,128,.25)' },
    { label: tideLabel, color: '#facc15', bg: 'rgba(250,204,21,.1)', border: 'rgba(250,204,21,.25)' },
    ...(topScore !== null && topLabel
      ? [{ label: `${topLabel} ${topScore}/100`, color: scoreColor(topScore), bg: `${scoreColor(topScore)}15`, border: `${scoreColor(topScore)}30` }]
      : []),
  ];

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
      {badges.map((b) => (
        <span
          key={b.label}
          style={{
            flexShrink: 0,
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: 9999,
            border: `1px solid ${b.border}`,
            background: b.bg,
            color: b.color,
            whiteSpace: 'nowrap',
          }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
