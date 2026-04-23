'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronUp, Settings } from 'lucide-react';
import type { TideData, TideCurvePoint, WeatherData, SolunarData } from '@/types';
import { getTideData, getTideCurve } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { calculateFishingScore, getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { getBestWindow } from '@/lib/scoring/fishing-windows';
import { mslToZH, formatTideHour } from '@/lib/tides/tide-utils';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';

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
    <div className="animate-pulse space-y-4 p-4 max-w-lg mx-auto">
      <div className="h-8 bg-slate-800 rounded-lg w-3/4" />
      <div className="h-40 bg-slate-800 rounded-xl" />
      <div className="h-32 bg-slate-800 rounded-xl" />
      <div className="h-52 bg-slate-800 rounded-xl" />
      <div className="h-36 bg-slate-800 rounded-xl" />
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
      <div className="min-h-dvh bg-slate-950 pb-20">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
          <div className="h-6 bg-slate-800 rounded w-32 animate-pulse" />
        </div>
        <LoadingSkeleton />
        <BottomNav />
      </div>
    );
  }

  if (error || !tideData || !solunarData || !tideCurve) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-4 pb-20">
        <div className="text-center">
          <p className="text-red-400 font-medium">Erreur de chargement</p>
          <p className="text-slate-400 text-sm mt-1">{error ?? 'Données indisponibles'}</p>
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
    <div className="min-h-dvh bg-slate-950 pb-20">
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800/80">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-base font-bold text-white">Halio</h1>
            <p className="text-xs text-slate-400 capitalize">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <CoefficientBadge coefficient={coefficient} size="md" />
            <Link
              href="/reglages"
              className="text-slate-400 hover:text-slate-300 transition-colors p-1"
              aria-label="Réglages"
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </header>

      {weatherError && <WeatherErrorBanner />}

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
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

        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-300 font-medium text-sm">Marées aujourd&apos;hui</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                currentPhase === 'montant'
                  ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/30'
                  : 'bg-orange-400/15 text-orange-400 border-orange-400/30'
              }`}
            >
              {currentPhase === 'montant' ? '↑' : '↓'} {formatTideHour(currentHour, currentPhase)}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums">
              {mslToZH(currentHeight).toFixed(2)}
            </span>
            <span className="text-slate-400 text-sm">m (ZH)</span>
          </div>

          <p className="text-xs text-slate-400">
            {nextExtreme.type === 'high' ? '⬆️ PM' : '⬇️ BM'}{' '}
            <span className="text-slate-200 font-medium">{fmt(nextExtreme.time)}</span>
            {' — '}
            <span className="text-slate-300">{mslToZH(nextExtreme.height).toFixed(2)} m</span>
            <span className="text-slate-400"> ({formatDuration(timeToNextExtreme)})</span>
          </p>

          <div className="flex gap-2 flex-wrap">
            {todayExtremes.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-xs bg-slate-700/50 rounded-lg px-2 py-1"
              >
                <span className={e.type === 'high' ? 'text-cyan-400' : 'text-slate-400'}>
                  {e.type === 'high' ? 'PM' : 'BM'}
                </span>
                <span className="text-slate-300">{fmt(e.time)}</span>
                <span className="text-slate-400">{mslToZH(e.height).toFixed(2)} m</span>
              </div>
            ))}
          </div>

          <TideCurve curve={tideCurve} extremes={tideData.extremes} now={now} />
        </div>

        {topSpecies.length > 0 && <SpeciesRecommendation topSpecies={topSpecies} />}

        {weatherData && weatherExpanded && (
          <div className="relative">
            <WeatherCard weather={weatherData} />
            <button
              onClick={() => setWeatherExpanded(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Réduire la météo"
            >
              <ChevronUp size={16} />
            </button>
          </div>
        )}
        {weatherData && !weatherExpanded && (
          <div className="grid grid-cols-2 gap-3">
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
