import type { TideExtreme, TidePhase } from '@/types';

// Zéro hydrographique (LAT) pour la station Arcachon Eyrac
// station.datums['LAT'] = -2.428m (relatif au MSL)
// Conversion : zh = msl - LAT = msl - (-2.428) = msl + 2.428
export const ARCACHON_LAT_DATUM = -2.428;

/**
 * Convertit une hauteur MSL en hauteur ZH (zéro hydrographique)
 */
export function mslToZH(mslHeight: number): number {
  return Math.round((mslHeight - ARCACHON_LAT_DATUM) * 100) / 100;
}

/**
 * Formate une hauteur de marée en string affichable
 */
export function formatTideHeight(height: number): string {
  return `${height.toFixed(2)} m`;
}

/**
 * Formate une durée en minutes en "Xh Ymin"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Retourne le label français d'une phase de marée
 */
export function getTidePhaseLabel(phase: 'montant' | 'descendant'): string {
  return phase === 'montant' ? 'Montant' : 'Descendant';
}

/**
 * Retourne l'icône d'une phase de marée
 */
export function getTidePhaseIcon(phase: 'montant' | 'descendant'): string {
  return phase === 'montant' ? '↑' : '↓';
}

/**
 * Vérifie si la phase actuelle correspond à la phase optimale d'un spot/espèce
 */
export function isTidePhaseOptimal(
  currentPhase: 'montant' | 'descendant',
  optimalPhase: TidePhase
): boolean {
  if (optimalPhase === 'tous') return true;
  if (optimalPhase === 'etale') return false; // géré séparément
  return currentPhase === optimalPhase;
}

/**
 * Retourne les extrêmes d'une journée donnée
 */
export function getDayExtremes(extremes: TideExtreme[], date: Date): TideExtreme[] {
  const dayStr = date.toDateString();
  return extremes.filter((e) => e.time.toDateString() === dayStr);
}

/**
 * Retourne le prochain extrême après un instant donné
 */
export function getNextExtreme(extremes: TideExtreme[], now: Date): TideExtreme | null {
  const sorted = [...extremes].sort((a, b) => a.time.getTime() - b.time.getTime());
  return sorted.find((e) => e.time > now) ?? null;
}

/**
 * Retourne l'extrême précédent avant un instant donné
 */
export function getPrevExtreme(extremes: TideExtreme[], now: Date): TideExtreme | null {
  const sorted = [...extremes].sort((a, b) => b.time.getTime() - a.time.getTime());
  return sorted.find((e) => e.time <= now) ?? null;
}

/**
 * Calcule la hauteur par interpolation sinusoïdale entre deux extrêmes
 */
export function interpolateTideHeight(
  prevExtreme: TideExtreme,
  nextExtreme: TideExtreme,
  now: Date
): number {
  const totalDuration = nextExtreme.time.getTime() - prevExtreme.time.getTime();
  const elapsed = now.getTime() - prevExtreme.time.getTime();
  const fraction = Math.max(0, Math.min(1, elapsed / totalDuration));
  const cosAngle = Math.PI * fraction;
  const height =
    prevExtreme.height +
    ((nextExtreme.height - prevExtreme.height) * (1 - Math.cos(cosAngle))) / 2;
  return Math.round(height * 100) / 100;
}
