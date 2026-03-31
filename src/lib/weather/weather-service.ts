import type {
  WeatherData,
  WeatherCurrent,
  WeatherHourly,
  WeatherDaily,
  OpenMeteoForecastResponse,
  OpenMeteoMarineResponse,
  PressureTrend,
} from '@/types';

const ARCACHON_LAT = 44.66;
const ARCACHON_LNG = -1.17;

// Cache module-level — partagé entre tous les composants pour la durée de la session
let _weatherCache: { data: WeatherData; expiresAt: number } | null = null;

/**
 * Détermine la tendance de la pression à partir des données horaires
 */
function getPressureTrend(hourlyPressures: number[], currentIndex: number): PressureTrend {
  if (currentIndex < 3) return 'stable';
  const prev = hourlyPressures[currentIndex - 3]; // 3h avant
  const current = hourlyPressures[currentIndex];
  const diff = current - prev;
  if (diff > 1) return 'hausse';
  if (diff < -1) return 'baisse';
  return 'stable';
}

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const ARCACHON_LAT = 44.66;
const ARCACHON_LNG = -1.17;

/**
 * Récupère les données météo directement depuis Open-Meteo (usage serveur uniquement).
 * Contourne le proxy HTTP /api/weather pour éviter les appels self-référentiels.
 */
export async function fetchWeatherDataDirect(): Promise<WeatherData> {
  const forecastParams = new URLSearchParams({
    latitude: String(ARCACHON_LAT),
    longitude: String(ARCACHON_LNG),
    timezone: 'Europe/Paris',
    hourly: 'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,precipitation,precipitation_probability,cloud_cover,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_speed_10m_max,wind_gusts_10m_max,winddirection_10m_dominant,precipitation_sum,weather_code',
    current: 'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,precipitation,precipitation_probability,cloud_cover,weather_code',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });

  const marineParams = new URLSearchParams({
    latitude: String(ARCACHON_LAT),
    longitude: String(ARCACHON_LNG),
    timezone: 'Europe/Paris',
    hourly: 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period',
    forecast_days: '7',
  });

  const [forecastRes, marineRes] = await Promise.all([
    fetch(`${OPEN_METEO_FORECAST_URL}?${forecastParams}`),
    fetch(`${OPEN_METEO_MARINE_URL}?${marineParams}`),
  ]);

  if (!forecastRes.ok) throw new Error(`Open-Meteo forecast indisponible: ${forecastRes.status}`);

  const forecast: OpenMeteoForecastResponse = await forecastRes.json();
  const marine: OpenMeteoMarineResponse | null = marineRes.ok ? await marineRes.json() : null;

  return parseWeatherData(forecast, marine);
}

/**
 * Récupère les données météo depuis l'API route Next.js (avec cache ISR).
 * Cache in-mémoire côté client de 1h pour éviter un round-trip HTTP à chaque composant.
 */
export async function fetchWeatherData(baseUrl = ''): Promise<WeatherData> {
  if (_weatherCache && Date.now() < _weatherCache.expiresAt) {
    return _weatherCache.data;
  }

  const [forecastRes, marineRes] = await Promise.all([
    fetch(`${baseUrl}/api/weather`),
    fetch(`${baseUrl}/api/marine`),
  ]);

  if (!forecastRes.ok) throw new Error(`Météo indisponible: ${forecastRes.status}`);

  const forecast: OpenMeteoForecastResponse = await forecastRes.json();
  const marine: OpenMeteoMarineResponse | null = marineRes.ok ? await marineRes.json() : null;

  const data = parseWeatherData(forecast, marine);
  _weatherCache = { data, expiresAt: Date.now() + 60 * 60 * 1000 };
  return data;
}

/**
 * Parse les réponses Open-Meteo en WeatherData
 */
export function parseWeatherData(
  forecast: OpenMeteoForecastResponse,
  marine: OpenMeteoMarineResponse | null
): WeatherData {
  const now = new Date(forecast.current.time);

  // Index horaire le plus proche de maintenant
  const hourlyTimes = forecast.hourly.time.map((t) => new Date(t));
  const foundIndex = hourlyTimes.findIndex((t) => t >= now);
  const currentHourIndex = foundIndex === -1 ? hourlyTimes.length - 1 : foundIndex;

  const pressureTrend = getPressureTrend(
    forecast.hourly.pressure_msl,
    currentHourIndex
  );

  // Données houle courante (marine)
  const foundMarineIndex = marine
    ? marine.hourly.time.findIndex((t) => new Date(t) >= now)
    : -1;
  const marineCurrentIndex = foundMarineIndex === -1 ? -1 : foundMarineIndex;

  const current: WeatherCurrent = {
    temperature: forecast.current.temperature_2m,
    apparentTemperature: forecast.current.apparent_temperature,
    windSpeed: forecast.current.wind_speed_10m,
    windDirection: forecast.current.wind_direction_10m,
    windGusts: forecast.current.wind_gusts_10m,
    pressure: forecast.current.pressure_msl,
    pressureTrend,
    precipitation: forecast.current.precipitation,
    precipitationProbability: forecast.current.precipitation_probability,
    cloudCover: forecast.current.cloud_cover,
    weatherCode: forecast.current.weather_code,
    waveHeight:
      marine && marineCurrentIndex >= 0
        ? (marine.hourly.wave_height[marineCurrentIndex] ?? null)
        : null,
    waveDirection:
      marine && marineCurrentIndex >= 0
        ? (marine.hourly.wave_direction[marineCurrentIndex] ?? null)
        : null,
    wavePeriod:
      marine && marineCurrentIndex >= 0
        ? (marine.hourly.wave_period[marineCurrentIndex] ?? null)
        : null,
    swellHeight:
      marine && marineCurrentIndex >= 0
        ? (marine.hourly.swell_wave_height[marineCurrentIndex] ?? null)
        : null,
  };

  // Données horaires (48h)
  const hourly: WeatherHourly[] = forecast.hourly.time.map((t, i) => ({
    time: new Date(t),
    temperature: forecast.hourly.temperature_2m[i] ?? 0,
    windSpeed: forecast.hourly.wind_speed_10m[i] ?? 0,
    windDirection: forecast.hourly.wind_direction_10m[i] ?? 0,
    windGusts: forecast.hourly.wind_gusts_10m[i] ?? 0,
    pressure: forecast.hourly.pressure_msl[i] ?? 1013,
    precipitation: forecast.hourly.precipitation[i] ?? 0,
    precipitationProbability: forecast.hourly.precipitation_probability[i] ?? 0,
    cloudCover: forecast.hourly.cloud_cover[i] ?? 0,
    weatherCode: forecast.hourly.weather_code[i] ?? 0,
    waveHeight: marine
      ? (marine.hourly.wave_height[i] ?? null)
      : null,
  }));

  // Données quotidiennes (7j)
  const daily: WeatherDaily[] = forecast.daily.time.map((t, i) => ({
    date: new Date(t),
    temperatureMax: forecast.daily.temperature_2m_max[i] ?? 0,
    temperatureMin: forecast.daily.temperature_2m_min[i] ?? 0,
    sunrise: new Date(forecast.daily.sunrise[i] ?? t),
    sunset: new Date(forecast.daily.sunset[i] ?? t),
    windSpeedMax: forecast.daily.wind_speed_10m_max[i] ?? 0,
    windGustsMax: forecast.daily.wind_gusts_10m_max[i] ?? 0,
    windDirectionDominant: forecast.daily.winddirection_10m_dominant[i] ?? 0,
    precipitationSum: forecast.daily.precipitation_sum[i] ?? 0,
    weatherCode: forecast.daily.weather_code[i] ?? 0,
  }));

  return {
    current,
    hourly,
    daily,
    fetchedAt: new Date(),
  };
}

/**
 * Retourne le label WMO d'un code météo
 */
export function getWeatherCodeLabel(code: number): string {
  const WMO_CODES: Record<number, string> = {
    0: 'Ciel dégagé',
    1: 'Peu nuageux',
    2: 'Partiellement nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    48: 'Brouillard givrant',
    51: 'Bruine légère',
    53: 'Bruine modérée',
    55: 'Bruine forte',
    61: 'Pluie légère',
    63: 'Pluie modérée',
    65: 'Pluie forte',
    71: 'Neige légère',
    73: 'Neige modérée',
    75: 'Neige forte',
    77: 'Grains de neige',
    80: 'Averses légères',
    81: 'Averses modérées',
    82: 'Averses violentes',
    85: 'Averses de neige légères',
    86: 'Averses de neige fortes',
    95: 'Orage',
    96: 'Orage avec grêle légère',
    99: 'Orage avec grêle forte',
  };
  return WMO_CODES[code] ?? 'Inconnu';
}

/**
 * Retourne la direction du vent en texte
 */
export function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] ?? 'N';
}

/**
 * Convertit km/h en nœuds
 */
export function kmhToKnots(kmh: number): number {
  return Math.round(kmh / 1.852 * 10) / 10;
}

/**
 * Retourne la force Beaufort
 */
export function getBeaufortScale(kmh: number): number {
  if (kmh < 1) return 0;
  if (kmh < 6) return 1;
  if (kmh < 12) return 2;
  if (kmh < 20) return 3;
  if (kmh < 29) return 4;
  if (kmh < 39) return 5;
  if (kmh < 50) return 6;
  if (kmh < 62) return 7;
  if (kmh < 75) return 8;
  if (kmh < 89) return 9;
  if (kmh < 103) return 10;
  if (kmh < 117) return 11;
  return 12;
}
