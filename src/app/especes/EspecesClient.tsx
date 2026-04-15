'use client';

import { useEffect, useState, useMemo } from 'react';
import type { TideData, WeatherData, SolunarData, FishingScore, Spot } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getBestScoreForSpecies } from '@/lib/scoring/fishing-score';
import { SPECIES, getSpeciesInSeason as filterSeason } from '@/data/species';
import { SPOTS } from '@/data/spots';

import BottomNav from '@/components/layout/BottomNav';
import WeatherErrorBanner from '@/components/layout/WeatherErrorBanner';
import SpeciesCard from '@/components/species/SpeciesCard';

type SeasonFilter = 'saison' | 'toutes';

export default function EspecesClient() {
  const [now, setNow] = useState(() => new Date());

  const [tideData, setTideData]       = useState<TideData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [solunarData, setSolunarData] = useState<SolunarData | null>(null);

  const [weatherError, setWeatherError] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('saison');

  useEffect(() => {
    const refresh = () => { if (!document.hidden) setNow(new Date()); };
    document.addEventListener('visibilitychange', refresh);
    const timer = setInterval(() => setNow(new Date()), 60 * 60 * 1000);
    return () => { document.removeEventListener('visibilitychange', refresh); clearInterval(timer); };
  }, []);

  useEffect(() => {
    setWeatherError(false);
    Promise.allSettled([getTideData(now), fetchWeatherData()])
      .then(([tideResult, weatherResult]) => {
        if (tideResult.status === 'fulfilled') setTideData(tideResult.value);
        if (weatherResult.status === 'fulfilled') {
          setWeatherData(weatherResult.value);
        } else {
          setWeatherError(true);
        }
        setSolunarData(getSolunarData(now));
      });
  }, [now]);

  const scoreMap = useMemo<Map<string, { score: FishingScore; spot: Spot }>>(() => {
    if (!tideData || !weatherData || !solunarData) return new Map();

    return new Map(
      SPECIES.map((species) => {
        const result = getBestScoreForSpecies(species, SPOTS, weatherData, tideData, solunarData, now, SPOTS[0]!);
        return [species.id, result];
      })
    );
  }, [tideData, weatherData, solunarData, now]);

  const currentMonth = now.getMonth() + 1;

  const inSeasonIds = useMemo(
    () => new Set(filterSeason(currentMonth).map((s) => s.id)),
    [currentMonth]
  );

  const displayed = useMemo(() => {
    if (seasonFilter === 'saison') {
      return SPECIES.filter((s) => inSeasonIds.has(s.id));
    }
    return SPECIES;
  }, [seasonFilter, inSeasonIds]);

  return (
    <div className="h-dvh flex flex-col bg-slate-950 overflow-hidden">
      <header className="shrink-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-40">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-base font-bold text-white">Espèces</h1>
            <p className="text-xs text-slate-400">{displayed.length} espèce{displayed.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex bg-slate-800 rounded-full p-0.5 gap-0.5">
            {(['saison', 'toutes'] as SeasonFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSeasonFilter(f)}
                className={`text-xs px-3 min-h-[44px] rounded-full font-medium transition-colors ${
                  seasonFilter === f
                    ? 'bg-cyan-400 text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'saison' ? 'En saison' : 'Toutes'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {weatherError && <WeatherErrorBanner />}

      <div className="flex-1 overflow-y-auto touch-pan-y">
        <div className="grid grid-cols-2 gap-2 p-3 pb-20 max-w-lg mx-auto">
          {displayed.map((species) => (
            <SpeciesCard
              key={species.id}
              species={species}
              score={scoreMap.get(species.id)?.score}
              spotName={scoreMap.get(species.id)?.spot.name}
              isInSeason={inSeasonIds.has(species.id)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
