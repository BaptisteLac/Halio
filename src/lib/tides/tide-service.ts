'use client';

import type { TideExtreme, TideData, TideCurvePoint } from '@/types';
import type { HarmonicConstituent, Extreme, TimelinePoint } from '@neaps/tide-predictor';
import type { Station } from '@neaps/tide-database';

// Arcachon coordinates
const ARCACHON_LAT = 44.66;
const ARCACHON_LNG = -1.17;

// Lazy-loaded station cache
let stationCache: Station | null = null;

async function getStation(): Promise<Station> {
  if (stationCache) return stationCache;

  const { nearest } = await import('@neaps/tide-database');
  const result = nearest({ latitude: ARCACHON_LAT, longitude: ARCACHON_LNG });
  if (!result) throw new Error('Aucune station de marée trouvée près d\'Arcachon');
  const [station] = result;
  stationCache = station;
  return stationCache;
}

/**
 * Calcule les extrêmes de marée pour une plage de dates
 */
export async function getTideExtremes(start: Date, end: Date): Promise<TideExtreme[]> {
  const station = await getStation();
  const createTidePredictor = (await import('@neaps/tide-predictor')).default;

  const predictor = createTidePredictor(station.harmonic_constituents as HarmonicConstituent[]);
  const extremes: Extreme[] = predictor.getExtremesPrediction({ start, end });

  return extremes.map((e) => ({
    time: new Date(e.time),
    height: Math.round(e.level * 100) / 100,
    type: e.high ? 'high' : 'low',
  })) as TideExtreme[];
}

/**
 * Calcule la courbe de marée (points toutes les 15 min) sur une journée
 */
export async function getTideCurve(date: Date): Promise<TideCurvePoint[]> {
  const station = await getStation();
  const createTidePredictor = (await import('@neaps/tide-predictor')).default;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  // Un seul appel batch à 900 s de résolution (15 min)
  const timeline: TimelinePoint[] = createTidePredictor(
    station.harmonic_constituents as HarmonicConstituent[]
  ).getTimelinePrediction({ start, end, timeFidelity: 900 });

  return timeline.map((p) => ({
    time: new Date(p.time),
    height: Math.round(p.level * 100) / 100,
  }));
}

/**
 * Détermine l'heure de marée courante (1-6) à partir des extrêmes
 * 1 = juste après l'étale, 6 = juste avant l'étale suivante
 */
export function getCurrentTideHour(now: Date, extremes: TideExtreme[]): number {
  const sortedExtremes = [...extremes].sort((a, b) => a.time.getTime() - b.time.getTime());

  let prevExtreme: TideExtreme | null = null;
  let nextExtreme: TideExtreme | null = null;

  for (const extreme of sortedExtremes) {
    if (extreme.time <= now) {
      prevExtreme = extreme;
    } else if (!nextExtreme) {
      nextExtreme = extreme;
    }
  }

  if (!prevExtreme || !nextExtreme) return 3; // fallback milieu de marée

  const totalDuration = nextExtreme.time.getTime() - prevExtreme.time.getTime();
  const elapsed = now.getTime() - prevExtreme.time.getTime();
  const fraction = elapsed / totalDuration;

  // Heure de marée 1-6 (1 = début, 6 = fin)
  return Math.min(6, Math.max(1, Math.ceil(fraction * 6)));
}

/**
 * Détermine si la marée est montante ou descendante
 */
export function getTidePhaseAtTime(
  now: Date,
  extremes: TideExtreme[]
): 'montant' | 'descendant' {
  const sortedExtremes = [...extremes].sort((a, b) => a.time.getTime() - b.time.getTime());

  let prevExtreme: TideExtreme | null = null;
  for (const extreme of sortedExtremes) {
    if (extreme.time <= now) {
      prevExtreme = extreme;
    }
  }

  if (!prevExtreme) return 'montant';
  return prevExtreme.type === 'low' ? 'montant' : 'descendant';
}

/**
 * Calcule les données complètes de marée pour un instant donné
 */
export async function getTideData(now: Date): Promise<TideData> {
  // Fenêtre ±2 jours pour avoir assez d'extrêmes
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  const end = new Date(now);
  end.setDate(end.getDate() + 2);

  const extremes = await getTideExtremes(start, end);
  const sortedExtremes = [...extremes].sort((a, b) => a.time.getTime() - b.time.getTime());

  const currentPhase = getTidePhaseAtTime(now, sortedExtremes);
  const currentHour = getCurrentTideHour(now, sortedExtremes);

  // Prochain extrême
  const nextExtreme =
    sortedExtremes.find((e) => e.time > now) ?? sortedExtremes[sortedExtremes.length - 1];
  const timeToNextExtreme = Math.round(
    (nextExtreme.time.getTime() - now.getTime()) / 60000
  );

  // Hauteur courante (interpolation sinusoïdale entre deux extrêmes)
  const prevExtreme = [...sortedExtremes].filter((e) => e.time <= now).pop();
  let currentHeight = 0;
  if (prevExtreme && nextExtreme) {
    const totalDuration = nextExtreme.time.getTime() - prevExtreme.time.getTime();
    const elapsed = now.getTime() - prevExtreme.time.getTime();
    const fraction = elapsed / totalDuration;
    const cosAngle = Math.PI * fraction;
    currentHeight =
      prevExtreme.height +
      ((nextExtreme.height - prevExtreme.height) * (1 - Math.cos(cosAngle))) / 2;
    currentHeight = Math.round(currentHeight * 100) / 100;
  }

  // Coefficient calculé via la station de Brest (référence SHOM)
  const { calculateCoefficientForDate } = await import('./coefficient');
  const coefficient = await calculateCoefficientForDate(now);

  return {
    extremes: sortedExtremes,
    currentHeight,
    currentPhase,
    currentHour,
    coefficient,
    nextExtreme,
    timeToNextExtreme,
  };
}
