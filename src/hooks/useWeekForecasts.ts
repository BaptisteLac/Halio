'use client';

import { useState, useEffect } from 'react';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getTideData } from '@/lib/tides/tide-service';
import { calculateCoefficientForDate } from '@/lib/tides/coefficient';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { getBestWindow } from '@/lib/scoring/fishing-windows';
import { kmhToKnots, getWindDirectionLabel } from '@/lib/weather/weather-service';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';
import type { WeekDay, DaySpecies } from '@/types';

export function useWeekForecasts(): {
  days: WeekDay[] | null;
  loading: boolean;
  error: boolean;
} {
  const [days, setDays] = useState<WeekDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeatherData()
      .then(async (weather) => {
        const results = await Promise.all(
          weather.daily.slice(0, 7).map(async (daily) => {
            const [tideData, coefficient] = await Promise.all([
              getTideData(daily.date),
              calculateCoefficientForDate(daily.date),
            ]);

            const noonHour = daily.date.getDate();
            const noonEntry = weather.hourly.find(
              (h) => h.time.getDate() === noonHour && h.time.getHours() === 12
            );
            const noonWindSpeed = noonEntry?.windSpeed ?? daily.windSpeedMax;
            const noonWindDir = noonEntry?.windDirection ?? daily.windDirectionDominant;
            const noonPressure = noonEntry?.pressure ?? weather.current.pressure;
            const prev3Entry = noonEntry
              ? weather.hourly.find(
                  (h) => h.time.getDate() === noonHour && h.time.getHours() === 9
                )
              : undefined;
            const pressureDiff = prev3Entry ? noonPressure - prev3Entry.pressure : 0;
            const noonPressureTrend = pressureDiff > 1 ? 'hausse' : pressureDiff < -1 ? 'baisse' : 'stable';

            const syntheticWeather = {
              ...weather,
              current: {
                ...weather.current,
                windSpeed: noonWindSpeed,
                windDirection: noonWindDir,
                windGusts: noonEntry?.windGusts ?? weather.current.windGusts,
                pressure: noonPressure,
                pressureTrend: noonPressureTrend,
              },
            };

            const noon = new Date(daily.date);
            noon.setHours(12, 0, 0, 0);
            const daySolunar = getSolunarData(noon);
            const top3 = getTopSpeciesForConditions(
              SPECIES, DASHBOARD_SPOT, syntheticWeather, tideData, daySolunar, noon, 3
            );
            const top = top3[0];
            const bestWindow = getBestWindow(
              top3, tideData, syntheticWeather, daySolunar, daily.date
            );
            const windKnots = kmhToKnots(noonWindSpeed);

            // Fenêtres individuelles par espèce
            const topSpecies: DaySpecies[] = top3.map((s) => {
              const win = getBestWindow([s], tideData, syntheticWeather, daySolunar, daily.date);
              return {
                id: s.species.id,
                name: s.species.name,
                score: win?.score ?? s.score.total,
                lure: s.species.lures[0]?.name ?? null,
                windowStart: win?.start ?? null,
                windowEnd: win?.end ?? null,
              };
            });

            return {
              date: daily.date,
              daily,
              coefficient,
              score: bestWindow?.score ?? top?.score.total ?? 0,
              topSpeciesId: top?.species.id ?? '',
              topSpeciesName: top?.species.name ?? '—',
              topLure: top?.species.lures[0]?.name ?? null,
              bestWindowStart: bestWindow?.start ?? null,
              bestWindowEnd: bestWindow?.end ?? null,
              windKnots,
              windDir: getWindDirectionLabel(noonWindDir),
              isHighWind: windKnots > 25,
              topSpecies,
            } satisfies WeekDay;
          })
        );
        setDays(results);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { days, loading, error };
}
