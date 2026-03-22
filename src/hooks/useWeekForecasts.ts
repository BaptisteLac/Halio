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
import type { WeekDay } from '@/types';

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

            const syntheticWeather = {
              ...weather,
              current: {
                ...weather.current,
                windSpeed: daily.windSpeedMax,
                windDirection: daily.windDirectionDominant,
              },
            };

            const daySolunar = getSolunarData(daily.date);
            const topSpecies = getTopSpeciesForConditions(
              SPECIES, DASHBOARD_SPOT, syntheticWeather, tideData, daySolunar, daily.date, 1
            );
            const top = topSpecies[0];
            const bestWindow = getBestWindow(
              topSpecies, tideData, syntheticWeather, daySolunar, daily.date
            );
            const windKnots = kmhToKnots(daily.windSpeedMax);

            return {
              date: daily.date,
              daily,
              coefficient,
              score: top?.score.total ?? 0,
              topSpeciesId: top?.species.id ?? '',
              topSpeciesName: top?.species.name ?? '—',
              topLure: top?.species.lures[0]?.name ?? null,
              bestWindowStart: bestWindow?.start ?? null,
              bestWindowEnd: bestWindow?.end ?? null,
              windKnots,
              windDir: getWindDirectionLabel(daily.windDirectionDominant),
              isHighWind: windKnots > 25,
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
