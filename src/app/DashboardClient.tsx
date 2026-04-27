'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import type { TideData, TideCurvePoint, WeatherData, SolunarData } from '@/types';
import { getTideData, getTideCurve } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { calculateFishingScore, getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { getBestWindow } from '@/lib/scoring/fishing-windows';
import { mslToZH, formatTideHour } from '@/lib/tides/tide-utils';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';
import { T } from '@/design/tokens';
import { IArrowUp, IArrowDown } from '@/design/icons';

import { useAnalytics } from '@/hooks/useAnalytics';
import BottomNav from '@/components/layout/BottomNav';
import WeatherErrorBanner from '@/components/layout/WeatherErrorBanner';
import TideCurve from '@/components/dashboard/TideCurve';
import WeatherCard from '@/components/dashboard/WeatherCard';
import CoefficientBadge from '@/components/dashboard/CoefficientBadge';
import SolunarIndicator from '@/components/dashboard/SolunarIndicator';
import SpeciesRecommendation from '@/components/dashboard/SpeciesRecommendation';
import FishingWindows from '@/components/dashboard/FishingWindows';
import DayHeroGo from '@/components/dashboard/DayHeroGo';
import { ChevronUp } from 'lucide-react';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: 16, maxWidth: 512, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[140, 120, 200, 140].map((h, i) => (
        <div key={i} style={{ height: h, background: T.l2, borderRadius: 14, animation: 'pulse 2s ease infinite' }} />
      ))}
    </div>
  );
}

export default function DashboardClient() {
  const [fetchDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [tideData, setTideData] = useState<TideData | null>(null);
  const [tideCurve, setTideCurve] = useState<TideCurvePoint[] | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [solunarData, setSolunarData] = useState<SolunarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  const { trackFishingScoreViewed } = useAnalytics();

  const topSpecies = useMemo(
    () => weatherData && tideData && solunarData
      ? getTopSpeciesForConditions(SPECIES, DASHBOARD_SPOT, weatherData, tideData, solunarData, now, 3)
      : [],
    [weatherData, tideData, solunarData, now],
  );

  const currentScore = useMemo(
    () => weatherData && tideData && solunarData
      ? (topSpecies.length > 0
          ? topSpecies[0].score
          : calculateFishingScore(SPECIES[0]!, DASHBOARD_SPOT, weatherData, tideData, solunarData, now))
      : null,
    [weatherData, tideData, solunarData, topSpecies, now],
  );

  useEffect(() => {
    const update = () => { if (!document.hidden) setNow(new Date()); };
    const timer = setInterval(() => setNow(new Date()), 60_000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    Promise.allSettled([getTideData(fetchDate), getTideCurve(fetchDate), fetchWeatherData()])
      .then(([tideResult, curveResult, weatherResult]) => {
        if (tideResult.status === 'rejected') {
          setError(tideResult.reason instanceof Error ? tideResult.reason.message : 'Erreur marées');
          setLoading(false);
          return;
        }
        if (curveResult.status === 'rejected') {
          setError(curveResult.reason instanceof Error ? curveResult.reason.message : 'Erreur courbe de marée');
          setLoading(false);
          return;
        }

        const solunar = getSolunarData(fetchDate);
        setTideData(tideResult.value);
        setTideCurve(curveResult.value);
        setSolunarData(solunar);

        if (weatherResult.status === 'fulfilled') {
          setWeatherData(weatherResult.value);
        } else {
          setWeatherError(true);
        }

        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDate]);

  useEffect(() => {
    if (!loading && currentScore !== null && tideData) {
      trackFishingScoreViewed(currentScore.total, DASHBOARD_SPOT.name, tideData.currentPhase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
        <div style={{ background: T.l1, borderBottom: `1px solid ${T.border}`, padding: '12px 16px' }}>
          <div style={{ height: 24, background: T.l2, borderRadius: 8, width: 128 }} />
        </div>
        <LoadingSkeleton />
        <BottomNav />
      </div>
    );
  }

  if (error || !tideData || !solunarData || !tideCurve) {
    return (
      <div style={{ minHeight: '100dvh', background: T.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, paddingBottom: 80 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: T.danger, fontWeight: 500 }}>Erreur de chargement</p>
          <p style={{ color: T.t3, fontSize: '0.875rem', marginTop: 4 }}>{error ?? 'Données indisponibles'}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const bestWindow =
    weatherData !== null && topSpecies.length > 0
      ? getBestWindow(topSpecies, tideData, weatherData, solunarData, startOfToday)
      : null;

  const todayStr = now.toDateString();
  const todayExtremes = tideData.extremes.filter((e) => e.time.toDateString() === todayStr);
  const { nextExtreme, timeToNextExtreme, currentHeight, currentPhase, currentHour, coefficient } =
    tideData;

  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  });

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
      <header style={{
        background: T.l1,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 40,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 512, margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em' }}>Halio</h1>
            <p style={{ fontSize: '0.6875rem', color: T.t3, textTransform: 'capitalize', marginTop: 1 }}>{dateLabel}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CoefficientBadge coefficient={coefficient} size="md" />
            <Link
              href="/reglages"
              style={{ color: T.t3, padding: 4, display: 'flex' }}
              aria-label="Réglages"
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </header>

      {weatherError && <WeatherErrorBanner />}

      <main style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 512, margin: '0 auto' }}>
        {currentScore && (
          <DayHeroGo
            bestWindow={bestWindow}
            topSpecies={topSpecies}
            currentScore={currentScore}
          />
        )}

        {weatherData && topSpecies.length > 0 && (
          <FishingWindows
            topSpecies={topSpecies}
            tideData={tideData}
            weatherData={weatherData}
            solunarData={solunarData}
            now={now}
          />
        )}

        <div style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t2, margin: 0 }}>Marées aujourd&apos;hui</h3>
            <span style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: 9999,
              border: `1px solid ${currentPhase === 'montant' ? 'rgba(34,211,238,.3)' : 'rgba(251,146,60,.3)'}`,
              background: currentPhase === 'montant' ? 'rgba(34,211,238,.1)' : 'rgba(251,146,60,.1)',
              color: currentPhase === 'montant' ? T.accent : T.warn,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {currentPhase === 'montant'
                ? <IArrowUp size={11} color={T.accent} />
                : <IArrowDown size={11} color={T.warn} />
              }
              {formatTideHour(currentHour, currentPhase)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: T.t1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {mslToZH(currentHeight).toFixed(2)}
            </span>
            <span style={{ fontSize: '0.875rem', color: T.t3 }}>m (ZH)</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: T.t3, display: 'flex', alignItems: 'center', gap: 6 }}>
            {nextExtreme.type === 'high'
              ? <IArrowUp size={12} color={T.accent} />
              : <IArrowDown size={12} color={T.t3} />
            }
            {nextExtreme.type === 'high' ? 'PM' : 'BM'}{' '}
            <span style={{ color: T.t1, fontWeight: 500 }}>{fmt(nextExtreme.time)}</span>
            {' — '}
            <span style={{ color: T.t2 }}>{mslToZH(nextExtreme.height).toFixed(2)} m</span>
            <span style={{ color: T.t3 }}>({formatDuration(timeToNextExtreme)})</span>
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {todayExtremes.map((e, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', background: T.l3, borderRadius: 8, padding: '4px 8px' }}
              >
                <span style={{ color: e.type === 'high' ? T.accent : T.t3 }}>{e.type === 'high' ? 'PM' : 'BM'}</span>
                <span style={{ color: T.t2 }}>{fmt(e.time)}</span>
                <span style={{ color: T.t3 }}>{mslToZH(e.height).toFixed(2)} m</span>
              </div>
            ))}
          </div>

          <TideCurve curve={tideCurve} extremes={tideData.extremes} now={now} />
        </div>

        {topSpecies.length > 0 && <SpeciesRecommendation topSpecies={topSpecies} />}

        {weatherData && weatherExpanded && (
          <div style={{ position: 'relative' }}>
            <WeatherCard weather={weatherData} />
            <button
              onClick={() => setWeatherExpanded(false)}
              style={{ position: 'absolute', top: 12, right: 12, color: T.t3, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
              aria-label="Réduire la météo"
            >
              <ChevronUp size={16} />
            </button>
          </div>
        )}
        {weatherData && !weatherExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <WeatherCard weather={weatherData} compact onClick={() => setWeatherExpanded(true)} />
            <SolunarIndicator solunar={solunarData} now={now} compact />
          </div>
        )}
        {!weatherData && <SolunarIndicator solunar={solunarData} now={now} />}
      </main>

      <BottomNav />
    </div>
  );
}
