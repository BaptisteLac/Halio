'use client';

import { useEffect, useState } from 'react';
import type { TideData, TideCurvePoint, WeatherData, SolunarData, DayForecast } from '@/types';
import { getTideData, getTideCurve } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { calculateCoefficientForDate } from '@/lib/tides/coefficient';
import { calculateFishingScore, getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { mslToZH } from '@/lib/tides/tide-utils';
import { SPECIES } from '@/data/species';
import { SPOTS, DASHBOARD_SPOT } from '@/data/spots';

import BottomNav from '@/components/layout/BottomNav';
import WeatherErrorBanner from '@/components/layout/WeatherErrorBanner';
import TideCurve from '@/components/dashboard/TideCurve';
import WeatherCard from '@/components/dashboard/WeatherCard';
import CoefficientBadge from '@/components/dashboard/CoefficientBadge';
import SolunarIndicator from '@/components/dashboard/SolunarIndicator';
import FishingScoreCard from '@/components/dashboard/FishingScoreCard';
import SpeciesRecommendation from '@/components/dashboard/SpeciesRecommendation';
import WeekForecast from '@/components/dashboard/WeekForecast';
import FishingWindows from '@/components/dashboard/FishingWindows';

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

export default function DashboardPage() {
  const [now] = useState(() => new Date());
  const [tideData, setTideData] = useState<TideData | null>(null);
  const [tideCurve, setTideCurve] = useState<TideCurvePoint[] | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [solunarData, setSolunarData] = useState<SolunarData | null>(null);
  const [weekForecasts, setWeekForecasts] = useState<DayForecast[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    Promise.allSettled([getTideData(now), getTideCurve(now), fetchWeatherData()])
      .then(async ([tideResult, curveResult, weatherResult]) => {
        // Marées = critiques → erreur bloquante si elles échouent
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

        const solunar = getSolunarData(now);
        setTideData(tideResult.value);
        setTideCurve(curveResult.value);
        setSolunarData(solunar);

        // Météo = optionnelle → bandeau si indisponible, marées toujours affichées
        if (weatherResult.status === 'fulfilled') {
          const weather = weatherResult.value;
          setWeatherData(weather);

          // Coefficients + scores pour les 7 prochains jours
          const forecasts = await Promise.all(
            weather.daily.slice(0, 7).map(async (daily) => {
              const coefficient = await calculateCoefficientForDate(daily.date);
              const syntheticTide: TideData = {
                extremes: [],
                currentHeight: 1.5,
                currentPhase: 'montant',
                currentHour: 3, // heure optimale
                coefficient,
                nextExtreme: { time: daily.date, height: 2, type: 'high' },
                timeToNextExtreme: 180,
              };
              const syntheticWeather: WeatherData = {
                ...weather,
                current: { ...weather.current, windSpeed: daily.windSpeedMax },
              };
              const daySolunar = getSolunarData(daily.date);
              const top = getTopSpeciesForConditions(
                SPECIES, DASHBOARD_SPOT, syntheticWeather, syntheticTide, daySolunar, daily.date, 1
              );
              const score = top[0]?.score.total ?? 0;
              return { date: daily.date, daily, coefficient, score };
            })
          );
          setWeekForecasts(forecasts);
        } else {
          setWeatherError(true);
        }

        setLoading(false);
      });
  }, [now]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pb-20">
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 pb-20">
        <div className="text-center">
          <p className="text-red-400 font-medium">Erreur de chargement</p>
          <p className="text-slate-500 text-sm mt-1">{error ?? 'Données indisponibles'}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const topSpecies = weatherData
    ? getTopSpeciesForConditions(SPECIES, DASHBOARD_SPOT, weatherData, tideData, solunarData, now, 3)
    : [];

  const overallScore = weatherData
    ? (topSpecies.length > 0
        ? topSpecies[0].score
        : calculateFishingScore(SPECIES[0]!, DASHBOARD_SPOT, weatherData, tideData, solunarData, now))
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
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800/80">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-base font-bold text-white">PêcheBoard</h1>
            <p className="text-xs text-slate-400 capitalize">{dateLabel}</p>
          </div>
          <CoefficientBadge coefficient={coefficient} size="md" />
        </div>
      </header>

      {weatherError && <WeatherErrorBanner />}

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Score + espèces — masqués si météo indisponible */}
        {overallScore && <FishingScoreCard score={overallScore} />}
        {topSpecies.length > 0 && <SpeciesRecommendation topSpecies={topSpecies} />}

        {/* Marées */}
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
              {currentPhase === 'montant' ? '↑ Montant' : '↓ Descendant'}
            </span>
          </div>

          {/* Hauteur courante */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums">
              {mslToZH(currentHeight).toFixed(2)}
            </span>
            <span className="text-slate-400 text-sm">m (ZH)</span>
            <span className="text-slate-500 text-xs ml-1">Heure {currentHour}/6</span>
          </div>

          {/* Prochain extrême */}
          <p className="text-xs text-slate-400">
            {nextExtreme.type === 'high' ? '⬆️ PM' : '⬇️ BM'}{' '}
            <span className="text-slate-200 font-medium">{fmt(nextExtreme.time)}</span>
            {' — '}
            <span className="text-slate-300">{mslToZH(nextExtreme.height).toFixed(2)} m</span>
            <span className="text-slate-500"> ({formatDuration(timeToNextExtreme)})</span>
          </p>

          {/* Extrêmes du jour */}
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
                <span className="text-slate-500">{mslToZH(e.height).toFixed(2)} m</span>
              </div>
            ))}
          </div>

          {/* Courbe */}
          <TideCurve curve={tideCurve} extremes={tideData.extremes} now={now} />
        </div>

        {/* Fenêtres de pêche — liées à la courbe de marée */}
        {weatherData && topSpecies.length > 0 && (
          <FishingWindows
            topSpecies={topSpecies}
            tideData={tideData}
            weatherData={weatherData}
            solunarData={solunarData}
            now={now}
          />
        )}

        {/* Météo — masquée si indisponible */}
        {weatherData && <WeatherCard weather={weatherData} />}

        {/* Solunaire */}
        <SolunarIndicator solunar={solunarData} now={now} />

        {/* Prévisions 7 jours */}
        {weekForecasts && weekForecasts.length > 0 && (
          <WeekForecast forecasts={weekForecasts} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
