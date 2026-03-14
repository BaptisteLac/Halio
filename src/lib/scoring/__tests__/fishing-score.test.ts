import { describe, it, expect } from 'vitest';
import {
  getFishingScoreLabel,
  getFishingScoreColor,
  getFishingScoreBg,
  calculateFishingScore,
  getTopSpeciesForConditions,
} from '../fishing-score';
import type { WeatherData, TideData, SolunarData, Species, Spot } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockWeather: WeatherData = {
  current: {
    temperature: 15,
    apparentTemperature: 13,
    windSpeed: 20,        // ~11 nœuds → optimal pour le bar
    windDirection: 225,   // SW → optimal pour les spots Bassin
    windGusts: 30,
    pressure: 1010,
    pressureTrend: 'baisse', // favorable
    precipitation: 0,
    precipitationProbability: 10,
    cloudCover: 30,
    weatherCode: 2,
    waveHeight: 0.3,
    waveDirection: 225,
    wavePeriod: 6,
    swellHeight: 0.2,
  },
  hourly: [],
  daily: [],
  fetchedAt: new Date(),
};

const mockTide: TideData = {
  extremes: [],
  currentHeight: 1.5,
  currentPhase: 'montant',
  currentHour: 3,   // heure optimale pour le bar
  coefficient: 75,  // vive-eau → optimal bar
  nextExtreme: { time: new Date(), height: 2, type: 'high' },
  timeToNextExtreme: 120,
};

const mockSolunar: SolunarData = {
  sunrise: new Date('2026-03-14T07:30:00'),
  sunset: new Date('2026-03-14T19:30:00'),
  dawn: new Date('2026-03-14T07:00:00'),
  dusk: new Date('2026-03-14T20:00:00'),
  moonrise: null,
  moonset: null,
  moonPhase: 0.25,
  moonFraction: 0.5,
  moonPhaseName: 'Premier quartier',
  periods: [],
  currentPeriod: null,
};

const mockSpot: Spot = {
  id: 'passe-nord',
  name: 'Passe Nord',
  slug: 'passe-nord',
  latitude: 44.66,
  longitude: -1.25,
  zone: 'passes',
  depth: { min: 3, max: 15 },
  bottom: 'sable',
  species: ['bar'],
  techniques: ['leurre-souple', 'leurre-surface'],
  optimalWindDir: [225, 247, 270],
  optimalCoeffRange: [60, 100],
  optimalTidePhase: 'montant',
  optimalTideHours: [2, 3, 4],
  danger: null,
  description: 'Spot de test',
  tips: 'Test',
  boatAccess: true,
};

const barSpecies: Species = {
  id: 'bar',
  name: 'Bar franc',
  scientificName: 'Dicentrarchus labrax',
  slug: 'bar-franc',
  localNames: ['loup'],
  season: { start: 4, end: 10 },
  peakMonths: [5, 6, 9, 10],
  minSize: 42,
  dailyQuota: null,
  markingRequired: false,
  closedPeriod: null,
  optimalCoeffRange: [60, 90],
  optimalTidePhase: 'montant',
  optimalTideHours: [2, 3, 4],
  optimalWaterTemp: { min: 14, max: 22 },
  minWaterTemp: 10,
  techniques: ['leurre-souple', 'leurre-surface'],
  lures: [],
  baits: ['vif', 'crevette'],
  colors: ['kaki', 'blanc'],
  scoreWeights: {
    coeff:    { weight: 0.25, optimal: 75, sigma: 20 },
    tideHour: { weight: 0.20, optimal: [2, 3, 4] },
    wind:     { weight: 0.15, optimalMin: 8, optimalMax: 18, maxSafe: 25 },
    windDir:  { weight: 0.10 },
    pressure: { weight: 0.10 },
    solunar:  { weight: 0.10 },
    dawnDusk: { weight: 0.05 },
    temp:     { weight: 0.05, optimalMin: 14, optimalMax: 22, absoluteMin: 8 },
  },
  description: 'Bar franc',
  tips: 'Test',
};

// ── getFishingScoreLabel ──────────────────────────────────────────────────────

describe('getFishingScoreLabel', () => {
  const cases: [number, string][] = [
    [100, 'Exceptionnel'],
    [85,  'Exceptionnel'],
    [84,  'Excellent'],
    [70,  'Excellent'],
    [69,  'Bon'],
    [55,  'Bon'],
    [54,  'Moyen'],
    [40,  'Moyen'],
    [39,  'Faible'],
    [25,  'Faible'],
    [24,  'Déconseillé'],
    [0,   'Déconseillé'],
  ];

  cases.forEach(([score, expected]) => {
    it(`score ${score} → "${expected}"`, () => {
      expect(getFishingScoreLabel(score)).toBe(expected);
    });
  });
});

// ── getFishingScoreColor ──────────────────────────────────────────────────────

describe('getFishingScoreColor', () => {
  it('85+ → cyan', () => expect(getFishingScoreColor(90)).toBe('text-cyan-400'));
  it('70-84 → vert', () => expect(getFishingScoreColor(75)).toBe('text-green-400'));
  it('55-69 → jaune', () => expect(getFishingScoreColor(60)).toBe('text-yellow-400'));
  it('40-54 → orange', () => expect(getFishingScoreColor(45)).toBe('text-orange-400'));
  it('< 40 → rouge', () => expect(getFishingScoreColor(20)).toBe('text-red-400'));
});

// ── getFishingScoreBg ─────────────────────────────────────────────────────────

describe('getFishingScoreBg', () => {
  it('retourne des classes Tailwind pour chaque plage', () => {
    expect(getFishingScoreBg(90)).toContain('cyan');
    expect(getFishingScoreBg(75)).toContain('green');
    expect(getFishingScoreBg(60)).toContain('yellow');
    expect(getFishingScoreBg(45)).toContain('orange');
    expect(getFishingScoreBg(20)).toContain('red');
  });
});

// ── calculateFishingScore ─────────────────────────────────────────────────────

describe('calculateFishingScore', () => {
  const date = new Date('2026-05-15T09:00:00'); // mai → bar en saison

  it('retourne un score borné entre 0 et 100', () => {
    const result = calculateFishingScore(barSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('conditions idéales → score élevé (≥ 60)', () => {
    const result = calculateFishingScore(barSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date);
    expect(result.total).toBeGreaterThanOrEqual(60);
  });

  it('conditions défavorables → score faible (< 40)', () => {
    const badWeather: WeatherData = {
      ...mockWeather,
      current: {
        ...mockWeather.current,
        windSpeed: 70,      // 38 nœuds → dangereux
        windDirection: 90,  // Est → défavorable
        pressureTrend: 'hausse',
      },
    };
    const badTide: TideData = {
      ...mockTide,
      coefficient: 20,  // morte-eau minimale
      currentHour: 6,   // étale
    };
    const result = calculateFishingScore(barSpecies, mockSpot, badWeather, badTide, mockSolunar, date);
    expect(result.total).toBeLessThan(40);
  });

  it('inclut les facteurs détaillés dans le résultat', () => {
    const result = calculateFishingScore(barSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date);
    expect(result.factors).toBeDefined();
    expect(typeof result.factors.coeffScore).toBe('number');
    expect(typeof result.factors.windScore).toBe('number');
    expect(typeof result.factors.tideHourScore).toBe('number');
  });

  it('retourne label et color cohérents avec le total', () => {
    const result = calculateFishingScore(barSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date);
    expect(result.label).toBe(getFishingScoreLabel(result.total));
    expect(result.color).toBe(getFishingScoreColor(result.total));
  });

  it('deux espèces aux conditions optimales différentes donnent des scores différents', () => {
    // Dorade : optimal morte-eau (coeff bas), étale
    const doradeSpecies: Species = {
      ...barSpecies,
      id: 'dorade',
      scoreWeights: {
        ...barSpecies.scoreWeights,
        coeff:    { weight: 0.25, optimal: 40, sigma: 15 }, // préfère morte-eau
        tideHour: { weight: 0.20, optimal: [5, 6] },        // préfère étale
      },
    };
    const scoreBar = calculateFishingScore(barSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date);
    const scoreDorade = calculateFishingScore(doradeSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date);
    // mockTide: coeff=75, heure=3 → bien pour le bar, mal pour la dorade
    expect(scoreBar.total).toBeGreaterThan(scoreDorade.total);
  });
});

// ── getTopSpeciesForConditions ────────────────────────────────────────────────

describe('getTopSpeciesForConditions', () => {
  const date = new Date('2026-05-15T09:00:00');

  const outOfSeasonSpecies: Species = {
    ...barSpecies,
    id: 'hors-saison',
    season: { start: 11, end: 2 }, // novembre-février → pas en saison en mai
  };

  const inSeasonSpecies1: Species = { ...barSpecies, id: 'sp1' };
  const inSeasonSpecies2: Species = { ...barSpecies, id: 'sp2' };
  const inSeasonSpecies3: Species = { ...barSpecies, id: 'sp3' };
  const allSpecies = [outOfSeasonSpecies, inSeasonSpecies1, inSeasonSpecies2, inSeasonSpecies3];

  it('exclut les espèces hors saison', () => {
    const results = getTopSpeciesForConditions(allSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date, 10);
    const ids = results.map((r) => r.species.id);
    expect(ids).not.toContain('hors-saison');
  });

  it('respecte la limite demandée', () => {
    const results = getTopSpeciesForConditions(allSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date, 2);
    expect(results).toHaveLength(2);
  });

  it('trie par score décroissant', () => {
    const results = getTopSpeciesForConditions(allSpecies, mockSpot, mockWeather, mockTide, mockSolunar, date, 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score.total).toBeLessThanOrEqual(results[i - 1].score.total);
    }
  });

  it('retourne un tableau vide si aucune espèce en saison', () => {
    const results = getTopSpeciesForConditions([outOfSeasonSpecies], mockSpot, mockWeather, mockTide, mockSolunar, date);
    expect(results).toHaveLength(0);
  });
});
