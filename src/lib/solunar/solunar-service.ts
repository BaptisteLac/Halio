import SunCalc from 'suncalc';
import type { SolunarData, SolunarPeriod } from '@/types';

const ARCACHON_LAT = 44.66;
const ARCACHON_LNG = -1.17;

// Durée des périodes (en ms)
const MAJOR_PERIOD_HALF_DURATION = 60 * 60 * 1000; // ±1h autour du transit lunaire
const MINOR_PERIOD_HALF_DURATION = 30 * 60 * 1000; // ±30min autour du lever/coucher

/**
 * Calcule le transit lunaire (passage au méridien) pour une date donnée.
 * SunCalc ne fournit pas directement le transit, on l'estime comme le milieu
 * entre le lever et le coucher de lune.
 */
function getMoonTransit(date: Date, lat: number, lng: number): Date | null {
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
  if (!moonTimes.rise || !moonTimes.set) return null;
  // Transit = milieu entre lever et coucher (approximation)
  const transitMs = (moonTimes.rise.getTime() + moonTimes.set.getTime()) / 2;
  return new Date(transitMs);
}

/**
 * Calcule les périodes solunaires pour une date
 */
function calculateSolunarPeriods(date: Date): SolunarPeriod[] {
  const periods: SolunarPeriod[] = [];
  const moonTimes = SunCalc.getMoonTimes(date, ARCACHON_LAT, ARCACHON_LNG);

  // Période majeure — transit lunaire (lune au zénith)
  const transit = getMoonTransit(date, ARCACHON_LAT, ARCACHON_LNG);
  if (transit) {
    periods.push({
      type: 'majeure',
      start: new Date(transit.getTime() - MAJOR_PERIOD_HALF_DURATION),
      end: new Date(transit.getTime() + MAJOR_PERIOD_HALF_DURATION),
    });
  }

  // Période majeure — transit lunaire inverse (lune au nadir, 12h après)
  if (transit) {
    const nadir = new Date(transit.getTime() + 12 * 60 * 60 * 1000);
    periods.push({
      type: 'majeure',
      start: new Date(nadir.getTime() - MAJOR_PERIOD_HALF_DURATION),
      end: new Date(nadir.getTime() + MAJOR_PERIOD_HALF_DURATION),
    });
  }

  // Période mineure — lever de lune
  if (moonTimes.rise) {
    periods.push({
      type: 'mineure',
      start: new Date(moonTimes.rise.getTime() - MINOR_PERIOD_HALF_DURATION),
      end: new Date(moonTimes.rise.getTime() + MINOR_PERIOD_HALF_DURATION),
    });
  }

  // Période mineure — coucher de lune
  if (moonTimes.set) {
    periods.push({
      type: 'mineure',
      start: new Date(moonTimes.set.getTime() - MINOR_PERIOD_HALF_DURATION),
      end: new Date(moonTimes.set.getTime() + MINOR_PERIOD_HALF_DURATION),
    });
  }

  return periods.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Retourne le nom de la phase lunaire
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return 'Nouvelle lune';
  if (phase < 0.1875) return 'Premier croissant';
  if (phase < 0.3125) return 'Premier quartier';
  if (phase < 0.4375) return 'Gibbeuse croissante';
  if (phase < 0.5625) return 'Pleine lune';
  if (phase < 0.6875) return 'Gibbeuse décroissante';
  if (phase < 0.8125) return 'Dernier quartier';
  return 'Dernier croissant';
}

/**
 * Calcule toutes les données solunaires pour une date et un instant donné
 */
export function getSolunarData(date: Date): SolunarData {
  const sunTimes = SunCalc.getTimes(date, ARCACHON_LAT, ARCACHON_LNG);
  const moonTimes = SunCalc.getMoonTimes(date, ARCACHON_LAT, ARCACHON_LNG);
  const moonIllum = SunCalc.getMoonIllumination(date);

  const periods = calculateSolunarPeriods(date);

  // Période courante
  const currentPeriod = periods.find(
    (p) => date >= p.start && date <= p.end
  );

  return {
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    dawn: sunTimes.dawn,
    dusk: sunTimes.dusk,
    moonrise: moonTimes.rise ?? null,
    moonset: moonTimes.set ?? null,
    moonPhase: moonIllum.phase,
    moonFraction: moonIllum.fraction,
    moonPhaseName: getMoonPhaseName(moonIllum.phase),
    periods,
    currentPeriod: currentPeriod ? currentPeriod.type : null,
  };
}

/**
 * Vérifie si un instant donné est dans une période solunaire
 */
export function isInSolunarPeriod(
  date: Date,
  periods: SolunarPeriod[]
): SolunarPeriod | null {
  return periods.find((p) => date >= p.start && date <= p.end) ?? null;
}

/**
 * Calcule le score solunaire (0-100) pour un instant donné
 * 100 = en plein milieu d'une période majeure
 * 70  = en plein milieu d'une période mineure
 * décroissance gaussienne en dehors des périodes
 */
export function getSolunarScore(date: Date, periods: SolunarPeriod[]): number {
  let maxScore = 0;

  for (const period of periods) {
    const center = (period.start.getTime() + period.end.getTime()) / 2;
    const halfDuration = (period.end.getTime() - period.start.getTime()) / 2;
    const distance = Math.abs(date.getTime() - center);
    const peakScore = period.type === 'majeure' ? 100 : 70;

    if (distance <= halfDuration) {
      const score = peakScore * (1 - distance / halfDuration);
      maxScore = Math.max(maxScore, score);
    }
  }

  return Math.round(maxScore);
}
