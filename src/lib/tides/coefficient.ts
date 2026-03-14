/**
 * Calcul des coefficients de marée — formule SHOM
 *
 * Les coefficients sont calculés à partir des hauteurs de la station de
 * référence nationale : BREST (id: ticon/brest-822-fra-uhslc_fd).
 *
 * Amplitude de référence à Brest (vive-eau moyenne) = 3.11 m
 * Coefficient 120 = vive-eau exceptionnelle (amplitude ~3.73 m à Brest)
 * Coefficient 20  = morte-eau exceptionnelle
 *
 * Important : utiliser les hauteurs de Brest, PAS celles d'Arcachon.
 * Les amplitudes locales d'Arcachon (~1-3.5 m) sont différentes de Brest (~1-4 m).
 * Les pêcheurs français utilisent les coefficients de Brest comme référence universelle.
 */

import type { HarmonicConstituent } from '@neaps/tide-predictor';

// Amplitude de vive-eau moyenne à Brest (port de référence SHOM)
const BREST_MEAN_SPRING_AMPLITUDE = 3.11;

// ID de la station Brest dans @neaps/tide-database
const BREST_STATION_ID = 'ticon/brest-822-fra-uhslc_fd';

// Cache de la station Brest
let brestStationCache: { harmonic_constituents: HarmonicConstituent[] } | null = null;

/**
 * Charge et met en cache la station de Brest depuis @neaps/tide-database
 */
async function getBrestStation(): Promise<{ harmonic_constituents: HarmonicConstituent[] }> {
  if (brestStationCache) return brestStationCache;
  const { stations } = await import('@neaps/tide-database');
  const brest = stations.find((s) => s.id === BREST_STATION_ID);
  if (!brest) throw new Error('Station Brest introuvable dans @neaps/tide-database');
  brestStationCache = brest as { harmonic_constituents: HarmonicConstituent[] };
  return brestStationCache;
}

/**
 * Calcule le coefficient de marée à partir des hauteurs PM et BM de Brest.
 *
 * Les hauteurs fournies par @neaps/tide-predictor sont relatives au niveau
 * moyen (MSL = 0). La formule SHOM utilise la SEMI-amplitude :
 *   semi_amplitude = (PM - BM) / 2
 *   coefficient    = semi_amplitude / 3.11 × 100
 *
 * (3.11 m = semi-amplitude de vive-eau moyenne à Brest, soit la moitié
 *  du marnage VE moyen ~6.22 m)
 *
 * @param highTide - Hauteur PM à Brest depuis MSL (m), ex: +0.73
 * @param lowTide  - Hauteur BM à Brest depuis MSL (m), ex: −0.90
 * @returns Coefficient arrondi à l'unité (20-120)
 */
export function calculateCoefficient(highTide: number, lowTide: number): number {
  const semiAmplitude = (highTide - lowTide) / 2;
  const coeff = Math.round((semiAmplitude / BREST_MEAN_SPRING_AMPLITUDE) * 100);
  return Math.min(120, Math.max(20, coeff));
}

/**
 * Calcule le coefficient pour une date donnée en utilisant la station de Brest.
 * C'est la fonction canonique à appeler depuis getTideData().
 */
export async function calculateCoefficientForDate(date: Date): Promise<number> {
  const brest = await getBrestStation();
  const createTidePredictor = (await import('@neaps/tide-predictor')).default;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const extremes = createTidePredictor(brest.harmonic_constituents)
    .getExtremesPrediction({ start, end });

  const highs = extremes.filter((e) => e.high);
  const lows = extremes.filter((e) => e.low);

  if (highs.length === 0 || lows.length === 0) return 70; // fallback

  return calculateCoefficient(highs[0].level, lows[0].level);
}

/**
 * Retourne le label qualitatif d'un coefficient
 */
export function getCoefficientLabel(coeff: number): string {
  if (coeff >= 95) return 'Vive-eau exceptionnelle';
  if (coeff >= 80) return 'Grande vive-eau';
  if (coeff >= 70) return 'Vive-eau';
  if (coeff >= 55) return 'Vive-eau moyenne';
  if (coeff >= 45) return 'Morte-eau moyenne';
  if (coeff >= 30) return 'Morte-eau';
  return 'Petite morte-eau';
}

/**
 * Retourne la couleur Tailwind pour un coefficient
 */
export function getCoefficientColor(coeff: number): string {
  if (coeff >= 80) return 'text-cyan-400';
  if (coeff >= 60) return 'text-green-400';
  if (coeff >= 45) return 'text-yellow-400';
  return 'text-slate-400';
}
