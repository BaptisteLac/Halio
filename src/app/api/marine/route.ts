import { NextResponse } from 'next/server';
import type { OpenMeteoMarineResponse } from '@/types';

const ARCACHON_LAT = 44.66;
const ARCACHON_LNG = -1.17;

const OPEN_METEO_MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const HOURLY_VARS = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'swell_wave_height',
  'swell_wave_direction',
  'swell_wave_period',
].join(',');

// Revalidation ISR toutes les heures
export const revalidate = 3600;

export async function GET(): Promise<NextResponse> {
  const params = new URLSearchParams({
    latitude: String(ARCACHON_LAT),
    longitude: String(ARCACHON_LNG),
    timezone: 'Europe/Paris',
    hourly: HOURLY_VARS,
    forecast_days: '7',
  });

  const url = `${OPEN_METEO_MARINE_URL}?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Impossible de récupérer les données marines' },
      { status: 502 }
    );
  }

  const data: OpenMeteoMarineResponse = await res.json();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
