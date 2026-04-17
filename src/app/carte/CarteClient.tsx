'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { TideData, WeatherData, SolunarData, Spot, SpotScoreMap, ZoneType } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getTopSpeciesForConditions, getFishingScoreLabel, getFishingScoreColor } from '@/lib/scoring/fishing-score';
import { SPOTS } from '@/data/spots';
import { SPECIES } from '@/data/species';

import BottomNav from '@/components/layout/BottomNav';
import WeatherErrorBanner from '@/components/layout/WeatherErrorBanner';
import CoefficientBadge from '@/components/dashboard/CoefficientBadge';
import SpotDetail from '@/components/map/SpotDetail';

const SpotMap = dynamic(() => import('@/components/map/SpotMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 animate-pulse" />,
});

type ZoneFilter = ZoneType | 'tous';
type ScoreFilter = 0 | 40 | 60 | 80;

const ZONE_META: Record<ZoneType, { label: string; color: string }> = {
  passes:       { label: 'Passes',     color: '#22d3ee' },
  bancs:        { label: 'Bancs',      color: '#4ade80' },
  fosses:       { label: 'Fosses',     color: '#a78bfa' },
  parcs:        { label: 'Parcs',      color: '#fbbf24' },
  chenaux:      { label: 'Chenaux',    color: '#fb923c' },
  'cap-ferret': { label: 'Cap Ferret', color: '#f472b6' },
  plages:       { label: 'Plages',     color: '#94a3b8' },
};

const SCORE_FILTERS: { label: string; value: ScoreFilter }[] = [
  { label: 'Tous', value: 0 },
  { label: '40+',  value: 40 },
  { label: '60+',  value: 60 },
  { label: '80+',  value: 80 },
];

export default function CarteClient() {
  const [now] = useState(() => new Date());

  const [tideData, setTideData]       = useState<TideData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [solunarData, setSolunarData] = useState<SolunarData | null>(null);
  const [dataReady, setDataReady]     = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [zoneFilter, setZoneFilter]     = useState<ZoneFilter>('tous');
  const [scoreFilter, setScoreFilter]   = useState<ScoreFilter>(0);

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
        setDataReady(true);
      });
  }, [now]);

  const scoreMap = useMemo<SpotScoreMap>(() => {
    if (!tideData || !weatherData || !solunarData) return new Map();

    return new Map(
      SPOTS.map((spot) => {
        const top3 = getTopSpeciesForConditions(SPECIES, spot, weatherData, tideData, solunarData, now, 3);
        const best = top3[0]?.score ?? {
          total: 0,
          factors: { coeffScore: 0, tideHourScore: 0, windScore: 0, windDirScore: 0, pressureScore: 0, solunarScore: 0, dawnDuskScore: 0, tempScore: 0 },
          label: getFishingScoreLabel(0),
          color: getFishingScoreColor(0),
        };
        return [spot.id, { best, top3 }];
      })
    );
  }, [tideData, weatherData, solunarData, now]);

  const filteredSpots = useMemo(() => {
    return SPOTS.filter((spot) => {
      if (zoneFilter !== 'tous' && spot.zone !== zoneFilter) return false;
      if (dataReady && scoreFilter > 0) {
        const entry = scoreMap.get(spot.id);
        if (!entry || entry.best.total < scoreFilter) return false;
      }
      return true;
    });
  }, [zoneFilter, scoreFilter, scoreMap, dataReady]);

  const coefficient = tideData?.coefficient ?? null;
  const selectedEntry = selectedSpot ? (scoreMap.get(selectedSpot.id) ?? null) : null;

  return (
    <div className="h-dvh flex flex-col bg-slate-950 overflow-hidden">
      <header className="shrink-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-40">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-base font-bold text-white">Spots</h1>
            <p className="text-xs text-slate-400">{filteredSpots.length} / {SPOTS.length} spots</p>
          </div>
          {coefficient !== null && <CoefficientBadge coefficient={coefficient} size="sm" />}
        </div>
      </header>

      {weatherError && <WeatherErrorBanner />}

      <div className="shrink-0 bg-slate-900/80 border-b border-slate-800/60 z-30">
        <div className="flex gap-1.5 px-3 pt-2 pb-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setZoneFilter('tous')}
            className={`shrink-0 text-xs px-3 min-h-[44px] rounded-full border font-medium transition-colors ${
              zoneFilter === 'tous'
                ? 'bg-slate-100 text-slate-900 border-slate-100'
                : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            Tous
          </button>
          {(Object.entries(ZONE_META) as [ZoneType, { label: string; color: string }][]).map(
            ([zone, { label, color }]) => (
              <button
                key={zone}
                onClick={() => setZoneFilter(zoneFilter === zone ? 'tous' : zone)}
                className={`shrink-0 text-xs px-3 min-h-[44px] rounded-full border font-medium transition-colors ${
                  zoneFilter === zone
                    ? 'border-transparent text-slate-900'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
                style={zoneFilter === zone ? { background: color, borderColor: color } : {}}
              >
                {label}
              </button>
            )
          )}
        </div>

        <div className="flex gap-1.5 px-3 pb-2 pt-1">
          {SCORE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setScoreFilter(scoreFilter === value ? 0 : value)}
              className={`text-xs px-3 min-h-[44px] rounded-full border font-medium transition-colors ${
                scoreFilter === value
                  ? 'bg-cyan-400 text-slate-900 border-cyan-400'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-xs text-slate-400 self-center ml-auto">
            {scoreFilter > 0 ? `Score min : ${scoreFilter}` : 'Score min'}
          </span>
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        <SpotMap
          spots={filteredSpots}
          scoreMap={scoreMap}
          selectedSpotId={selectedSpot?.id ?? null}
          onSelect={setSelectedSpot}
        />
        {!dataReady && (
          <div className="absolute top-0 inset-x-0 h-0.5 bg-slate-700 z-10 overflow-hidden">
            <div className="h-full w-1/3 bg-cyan-400 animate-[loading-bar_1.4s_ease-in-out_infinite]" />
          </div>
        )}
      </div>

      <div className="shrink-0 h-14" />

      <SpotDetail spot={selectedSpot} entry={selectedEntry} onClose={() => setSelectedSpot(null)} />

      <BottomNav />
    </div>
  );
}
