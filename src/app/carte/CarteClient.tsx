'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { TideData, WeatherData, SolunarData, Spot, SpotScoreMap, ZoneType } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getTopSpeciesForSpot, getFishingScoreLabel, getFishingScoreColor } from '@/lib/scoring/fishing-score';
import { SPOTS } from '@/data/spots';
import { SPECIES } from '@/data/species';
import { T } from '@/design/tokens';

import { useAnalytics } from '@/hooks/useAnalytics';
import BottomNav from '@/components/layout/BottomNav';
import WeatherErrorBanner from '@/components/layout/WeatherErrorBanner';
import CoefficientBadge from '@/components/dashboard/CoefficientBadge';
import SpotDetail from '@/components/map/SpotDetail';

const SpotMap = dynamic(() => import('@/components/map/SpotMap'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: T.l1 }} />,
});

type ZoneFilter = ZoneType | 'tous';
type ScoreFilter = 0 | 40 | 60 | 80;

const ZONE_META: Record<ZoneType, { label: string; color: string }> = {
  passes:       { label: 'Passes',      color: '#22d3ee' },
  bancs:        { label: 'Bancs',       color: '#4ade80' },
  fosses:       { label: 'Fosses',      color: '#a78bfa' },
  parcs:        { label: 'Parcs',       color: '#fbbf24' },
  chenaux:      { label: 'Chenaux',     color: '#fb923c' },
  'cap-ferret': { label: 'Cap Ferret',  color: '#f472b6' },
  plages:       { label: 'Plages',      color: '#94a3b8' },
};

const SCORE_STEPS: ScoreFilter[] = [0, 40, 60, 80];

function Chip({
  label,
  active,
  activeColor,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        fontSize: '0.75rem',
        padding: '6px 12px',
        borderRadius: 9999,
        fontWeight: 500,
        border: `1px solid ${active ? (activeColor ?? T.accent) : 'rgba(255,255,255,.15)'}`,
        background: active
          ? (activeColor ?? T.accent)
          : 'rgba(7,7,15,.7)',
        color: active ? (activeColor ? '#0f172a' : '#0f172a') : T.t2,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'background 0.12s ease, border-color 0.12s ease',
        minHeight: 34,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export default function CarteClient() {
  const [now] = useState(() => new Date());

  const [tideData, setTideData]       = useState<TideData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [solunarData, setSolunarData] = useState<SolunarData | null>(null);
  const [dataReady, setDataReady]     = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const { trackSpotSelected } = useAnalytics();

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
        const top3 = getTopSpeciesForSpot(SPECIES, spot, weatherData, tideData, solunarData, now, 3);
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

  function handleSelectSpot(spot: Spot | null) {
    setSelectedSpot(spot);
    if (spot) trackSpotSelected(spot.id, spot.name, spot.zone);
  }

  const coefficient = tideData?.coefficient ?? null;
  const selectedEntry = selectedSpot ? (scoreMap.get(selectedSpot.id) ?? null) : null;

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
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0 }}>Spots</h1>
            <p style={{ fontSize: '0.6875rem', color: T.t3, marginTop: 1 }}>
              {filteredSpots.length} / {SPOTS.length} spots
            </p>
          </div>
          {coefficient !== null && <CoefficientBadge coefficient={coefficient} size="sm" />}
        </div>
      </header>

      {weatherError && <WeatherErrorBanner />}

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <SpotMap
          spots={filteredSpots}
          scoreMap={scoreMap}
          selectedSpotId={selectedSpot?.id ?? null}
          onSelect={handleSelectSpot}
        />

        {/* Filtres — scroll horizontal, score en premier */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 0,
          right: 52,
          zIndex: 10,
          padding: '0 12px',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            pointerEvents: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            {/* Score — premier, cycle 0→40→60→80 */}
            <Chip
              label={scoreFilter > 0 ? `Score ≥ ${scoreFilter}` : 'Score'}
              active={scoreFilter > 0}
              activeColor={T.accent}
              onClick={() => {
                const idx = SCORE_STEPS.indexOf(scoreFilter);
                setScoreFilter(SCORE_STEPS[(idx + 1) % SCORE_STEPS.length]!);
              }}
            />

            {/* Zone : Tous */}
            <Chip
              label="Tous"
              active={zoneFilter === 'tous'}
              onClick={() => setZoneFilter('tous')}
            />

            {/* Zones */}
            {(Object.entries(ZONE_META) as [ZoneType, { label: string; color: string }][]).map(
              ([zone, { label, color }]) => (
                <Chip
                  key={zone}
                  label={label}
                  active={zoneFilter === zone}
                  activeColor={color}
                  onClick={() => setZoneFilter(zoneFilter === zone ? 'tous' : zone)}
                />
              )
            )}
          </div>
        </div>

        {/* Barre de chargement */}
        {!dataReady && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: T.l3, zIndex: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '33%', background: T.accent, animation: 'loading-bar 1.4s ease-in-out infinite' }} />
          </div>
        )}
      </div>

      <SpotDetail spot={selectedSpot} entry={selectedEntry} onClose={() => setSelectedSpot(null)} />

      <BottomNav />
    </div>
  );
}
