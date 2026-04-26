'use client';

import { useEffect, useState, useMemo } from 'react';
import type { TideData, WeatherData, SolunarData, FishingScore, Spot } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getBestScoreForSpecies } from '@/lib/scoring/fishing-score';
import { SPECIES, getSpeciesInSeason as filterSeason } from '@/data/species';
import { SPOTS } from '@/data/spots';
import { T } from '@/design/tokens';

import BottomNav from '@/components/layout/BottomNav';
import WeatherErrorBanner from '@/components/layout/WeatherErrorBanner';
import SpeciesCard from '@/components/species/SpeciesCard';
import InfoTooltip from '@/components/ui/InfoTooltip';

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
    if (seasonFilter === 'saison') return SPECIES.filter((s) => inSeasonIds.has(s.id));
    return SPECIES;
  }, [seasonFilter, inSeasonIds]);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page, overflow: 'hidden' }}>
      <header style={{
        flexShrink: 0,
        background: T.l1,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
        zIndex: 40,
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 512, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0 }}>Espèces</h1>
              <p style={{ fontSize: '0.6875rem', color: T.t3, marginTop: 1 }}>
                {displayed.length} espèce{displayed.length > 1 ? 's' : ''}
              </p>
            </div>
            <InfoTooltip content="Le score (0–100) indique les conditions actuelles pour chaque espèce, en tenant compte des marées, du vent, de la pression et du solunaire au meilleur spot disponible." />
          </div>

          <div style={{ display: 'flex', background: T.l3, borderRadius: 9999, padding: 3, gap: 2 }}>
            {(['saison', 'toutes'] as SeasonFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSeasonFilter(f)}
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 14px',
                  minHeight: 36,
                  borderRadius: 9999,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  background: seasonFilter === f ? T.accent : 'transparent',
                  color: seasonFilter === f ? '#0f172a' : T.t3,
                }}
              >
                {f === 'saison' ? 'En saison' : 'Toutes'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {weatherError && <WeatherErrorBanner />}

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: '12px 16px 80px',
          maxWidth: 512,
          margin: '0 auto',
        }}>
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
