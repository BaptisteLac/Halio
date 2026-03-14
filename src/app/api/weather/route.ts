import { NextResponse } from 'next/server';
import type { OpenMeteoForecastResponse } from '@/types';

const ARCACHON_LAT = 44.66;
const ARCACHON_LNG = -1.17;

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'precipitation',
  'precipitation_probability',
  'cloud_cover',
  'weather_code',
].join(',');

const DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'precipitation_sum',
  'weather_code',
].join(',');

const CURRENT_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'precipitation',
  'precipitation_probability',
  'cloud_cover',
  'weather_code',
].join(',');

// Revalidation ISR toutes les heures
export const revalidate = 3600;

export async function GET(): Promise<NextResponse> {
  const params = new URLSearchParams({
    latitude: String(ARCACHON_LAT),
    longitude: String(ARCACHON_LNG),
    timezone: 'Europe/Paris',
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    current: CURRENT_VARS,
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });

  const url = `${OPEN_METEO_URL}?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Impossible de récupérer les données météo' },
      { status: 502 }
    );
  }

  const data: OpenMeteoForecastResponse = await res.json();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
