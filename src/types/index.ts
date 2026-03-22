// ============================================================
// Types globaux — PêcheBoard
// ============================================================

// ---------- Géographie ----------

export type TidePhase = 'montant' | 'descendant' | 'etale' | 'tous';
export type BottomType = 'sable' | 'vase' | 'roche' | 'epave' | 'mixte';
export type ZoneType =
  | 'passes'
  | 'bancs'
  | 'fosses'
  | 'parcs'
  | 'chenaux'
  | 'cap-ferret'
  | 'plages';

export interface Spot {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  zone: ZoneType;
  depth: { min: number; max: number };
  bottom: BottomType;
  species: string[];
  techniques: string[];
  optimalWindDir: number[];
  optimalCoeffRange: [number, number];
  optimalTidePhase: TidePhase;
  optimalTideHours: number[];
  danger: string | null;
  description: string;
  tips: string;
  boatAccess: true;
}

// ---------- Espèces ----------

export interface Lure {
  name: string;
  brand: string;
  type: string;
  weight: string;
  priority: number;
}

export interface SpeciesWeights {
  coeff: { weight: number; optimal: number; sigma: number };
  tideHour: { weight: number; optimal: number[] };
  wind: { weight: number; optimalMin: number; optimalMax: number; maxSafe: number };
  windDir: { weight: number };
  pressure: { weight: number };
  solunar: { weight: number };
  dawnDusk: { weight: number };
  temp: { weight: number; optimalMin: number; optimalMax: number; absoluteMin: number };
}

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  slug: string;
  localNames: string[];
  season: { start: number; end: number };
  peakMonths: number[];
  minSize: number | null;
  dailyQuota: number | null;
  markingRequired: boolean;
  closedPeriod: string | null;
  optimalCoeffRange: [number, number];
  optimalTidePhase: TidePhase;
  optimalTideHours: number[];
  optimalWaterTemp: { min: number; max: number };
  minWaterTemp: number;
  techniques: string[];
  lures: Lure[];
  baits: string[];
  colors: string[];
  scoreWeights: SpeciesWeights;
  description: string;
  tips: string;
}

// ---------- Marées ----------

export type TideExtremeType = 'high' | 'low';

export interface TideExtreme {
  time: Date;
  height: number;
  type: TideExtremeType;
}

export interface TideData {
  extremes: TideExtreme[];
  currentHeight: number;
  currentPhase: 'montant' | 'descendant';
  currentHour: number; // 1-6 (heure de marée)
  coefficient: number;
  nextExtreme: TideExtreme;
  timeToNextExtreme: number; // minutes
}

export interface TideCurvePoint {
  time: Date;
  height: number;
}

// ---------- Solunaire ----------

export type SolunarPeriodType = 'majeure' | 'mineure' | null;

export interface SolunarPeriod {
  type: 'majeure' | 'mineure';
  start: Date;
  end: Date;
}

export interface SolunarData {
  sunrise: Date;
  sunset: Date;
  dawn: Date;
  dusk: Date;
  moonrise: Date | null;
  moonset: Date | null;
  moonPhase: number; // 0=nouvelle lune, 0.5=pleine lune
  moonFraction: number; // % illuminé
  moonPhaseName: string;
  periods: SolunarPeriod[];
  currentPeriod: SolunarPeriodType;
}

// ---------- Météo ----------

export type PressureTrend = 'hausse' | 'stable' | 'baisse';

export interface WeatherCurrent {
  temperature: number;
  apparentTemperature: number;
  windSpeed: number; // km/h
  windDirection: number; // degrés
  windGusts: number;
  pressure: number; // hPa
  pressureTrend: PressureTrend;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  weatherCode: number;
  // Houle (marine)
  waveHeight: number | null;
  waveDirection: number | null;
  wavePeriod: number | null;
  swellHeight: number | null;
}

export interface WeatherHourly {
  time: Date;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  precipitation: number;
  precipitationProbability: number;
  cloudCover: number;
  weatherCode: number;
  waveHeight: number | null;
}

export interface WeatherDaily {
  date: Date;
  temperatureMax: number;
  temperatureMin: number;
  sunrise: Date;
  sunset: Date;
  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;
  precipitationSum: number;
  weatherCode: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  fetchedAt: Date;
}

// ---------- Score de pêche ----------

export interface ScoreFactors {
  coeffScore: number;
  tideHourScore: number;
  windScore: number;
  windDirScore: number;
  pressureScore: number;
  solunarScore: number;
  dawnDuskScore: number;
  tempScore: number;
}

export interface FishingScore {
  total: number; // 0-100
  factors: ScoreFactors;
  label: string; // "Excellent", "Bon", etc.
  color: string; // classe Tailwind
}

export interface SpotScore {
  spot: Spot;
  score: FishingScore;
  topSpecies: Species[];
}

export interface SpotScoreEntry {
  best: FishingScore;
  top3: Array<{ species: Species; score: FishingScore }>;
}

export type SpotScoreMap = Map<string, SpotScoreEntry>;

// ---------- Journal de pêche ----------

export interface Catch {
  id: string;
  userId: string;
  speciesId: string;
  spotId: string;
  caughtAt: Date;
  sizeCm: number | null;
  weightKg: number | null;
  technique: string | null;
  lureOrBait: string | null;
  photoUrl: string | null;
  // Conditions
  coefficient: number | null;
  tidePhase: TidePhase | null;
  tideHour: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  pressure: number | null;
  waterTemp: number | null;
  moonPhase: number | null;
  fishingScore: number | null;
  notes: string | null;
  released: boolean;
  createdAt: Date;
}

// ---------- Paramètres utilisateur ----------

export interface UserSettings {
  userId: string;
  favoriteSpecies: string[];
  favoriteSpots: string[];
  homePort: string;
  notificationsEnabled: boolean;
  createdAt: Date;
}

// ---------- Réglementations ----------

export interface Regulation {
  speciesId: string;
  minSize: number | null; // cm
  dailyQuota: number | null;
  markingRequired: boolean;
  closedPeriod: string | null;
  notes: string | null;
}

// ---------- Prévisions semaine ----------

export interface DayForecast {
  date: Date;
  daily: WeatherDaily;
  coefficient: number;
  score: number;
}

export interface BestWindow {
  start: Date;
  end: Date;
  score: number; // average score of species over this window (0-100)
}

export interface WeekDay {
  date: Date;
  daily: WeatherDaily;
  coefficient: number;
  score: number;
  topSpeciesId: string;
  topSpeciesName: string;
  topLure: string | null;
  bestWindowStart: Date | null;
  bestWindowEnd: Date | null;
  windKnots: number;
  windDir: string;
  isHighWind: boolean; // true if windKnots > 25
}

// ---------- Open-Meteo API response types ----------

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: Record<string, string>;
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    pressure_msl: number;
    precipitation: number;
    precipitation_probability: number;
    cloud_cover: number;
    weather_code: number;
  };
  hourly_units: Record<string, string>;
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    pressure_msl: number[];
    precipitation: number[];
    precipitation_probability: number[];
    cloud_cover: number[];
    weather_code: number[];
  };
  daily_units: Record<string, string>;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    winddirection_10m_dominant: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  hourly_units: Record<string, string>;
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    swell_wave_height: number[];
    swell_wave_direction: number[];
    swell_wave_period: number[];
  };
}
