'use client';

import type { CoachContext } from '@/types';
import { kmhToKnots, getWindDirectionLabel } from '@/lib/weather/weather-service';
import { formatTideHour } from '@/lib/tides/tide-utils';

interface ConditionBadgesProps {
  context: CoachContext;
}

export default function ConditionBadges({ context }: ConditionBadgesProps) {
  const { tideData, weatherData, topSpecies } = context;
  const windKnots = kmhToKnots(weatherData.current.windSpeed);
  const windDir = getWindDirectionLabel(weatherData.current.windDirection);
  const tideLabel = formatTideHour(tideData.currentHour, tideData.currentPhase);
  const topScore = topSpecies[0]?.score.total ?? null;
  const topLabel = topSpecies[0]?.score.label ?? null;

  const badges = [
    {
      label: `Coeff ${tideData.coefficient}`,
      color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25',
    },
    {
      label: `${windDir} ${windKnots.toFixed(0)} nd`,
      color: 'text-green-400 bg-green-400/10 border-green-400/25',
    },
    {
      label: tideLabel,
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
    },
    ...(topScore !== null && topLabel
      ? [{
          label: `${topLabel} ${topScore}/100`,
          color: 'text-pink-400 bg-pink-400/10 border-pink-400/25',
        }]
      : []),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
      {badges.map((b) => (
        <span
          key={b.label}
          className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${b.color}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
