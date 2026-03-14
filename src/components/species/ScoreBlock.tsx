'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import type { Species, FishingScore, Spot } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getBestScoreForSpecies, getFishingScoreColor, getFishingScoreLabel } from '@/lib/scoring/fishing-score';
import { SPOTS } from '@/data/spots';

interface Props {
  species: Species;
}

export default function ScoreBlock({ species }: Props) {
  const [result, setResult] = useState<{ score: FishingScore; spot: Spot } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const now = new Date();

    Promise.allSettled([getTideData(now), fetchWeatherData()])
      .then(([tideResult, weatherResult]) => {
        if (tideResult.status === 'fulfilled' && weatherResult.status === 'fulfilled') {
          const solunar = getSolunarData(now);
          setResult(getBestScoreForSpecies(species, SPOTS, weatherResult.value, tideResult.value, solunar, now, SPOTS[0]!));
        } else {
          setError(true);
        }
      });
  }, [species]);

  if (error) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
        <WifiOff size={20} className="text-slate-500 shrink-0" />
        <p className="text-slate-500 text-sm">Score indisponible — météo hors ligne</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-slate-700 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-16 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const { score, spot } = result;
  const color = getFishingScoreColor(score.total);
  const label = getFishingScoreLabel(score.total);

  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold tabular-nums ${color}`}>{score.total}</span>
        <span className="text-slate-500 text-sm">/100</span>
      </div>
      <div>
        <p className={`font-semibold ${color}`}>{label}</p>
        <p className="text-slate-400 text-xs">📍 {spot.name}</p>
      </div>
    </div>
  );
}
