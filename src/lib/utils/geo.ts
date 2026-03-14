/**
 * Utilitaires géographiques — PêcheBoard
 */

/**
 * Calcule la distance en km entre deux points GPS (formule Haversine)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calcule l'angle entre deux directions (en degrés)
 * Retourne la différence angulaire la plus courte (0-180°)
 */
export function angleDiff(a: number, b: number): number {
  const diff = Math.abs(((a - b + 540) % 360) - 180);
  return diff;
}

/**
 * Vérifie si une direction de vent est dans la liste des directions optimales
 * (tolérance de ±22.5°)
 */
export function isWindDirOptimal(
  windDir: number,
  optimalDirs: number[],
  tolerance = 22.5
): boolean {
  return optimalDirs.some((dir) => angleDiff(windDir, dir) <= tolerance);
}

/**
 * Formate une distance en km/nm
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Coordonnées du port d'Arcachon (référence)
export const ARCACHON_PORT = { latitude: 44.657, longitude: -1.167 };
