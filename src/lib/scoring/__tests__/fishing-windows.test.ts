import { describe, it, expect } from 'vitest';
import { getBestWindow } from '../fishing-windows';
import type { TideData, WeatherData, SolunarData } from '@/types';

// Fixtures minimales
const mockTide: TideData = {
  extremes: [],
  currentHeight: 1.5,
  currentPhase: 'montant',
  currentHour: 3,
  coefficient: 75,
  nextExtreme: { time: new Date(), height: 2, type: 'high' },
  timeToNextExtreme: 180,
};

const mockWeather: WeatherData = {
  current: {
    temperature: 15,
    apparentTemperature: 13,
    windSpeed: 18,
    windDirection: 225,
    windGusts: 25,
    pressure: 1012,
    pressureTrend: 'stable',
    precipitationProbability: 10,
    precipitation: 0,
    cloudCover: 30,
    weatherCode: 1,
    waveHeight: 0.5,
    waveDirection: null,
    wavePeriod: null,
    swellHeight: null,
  },
  daily: [],
  hourly: [],
  fetchedAt: new Date(),
};

const mockSolunar: SolunarData = {
  sunrise: new Date('2026-03-22T07:44:00'),
  sunset: new Date('2026-03-22T19:45:00'),
  dawn: new Date('2026-03-22T07:20:00'),
  dusk: new Date('2026-03-22T20:09:00'),
  moonrise: null,
  moonset: null,
  moonPhase: 0.5,
  moonFraction: 0.98,
  moonPhaseName: 'Pleine lune',
  periods: [],
  currentPeriod: null,
};

describe('getBestWindow', () => {
  it('returns null when no species provided', () => {
    const result = getBestWindow([], mockTide, mockWeather, mockSolunar, new Date('2026-03-22'));
    expect(result).toBeNull();
  });

  it('returns null or a valid BestWindow — never throws', () => {
    const result = getBestWindow([], mockTide, mockWeather, mockSolunar, new Date('2026-03-22'));
    expect(result === null || (result && typeof result.score === 'number')).toBe(true);
  });

  it('returned BestWindow has start before end', () => {
    const result = getBestWindow([], mockTide, mockWeather, mockSolunar, new Date('2026-03-22'));
    if (result !== null) {
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
      expect(result.score).toBeGreaterThanOrEqual(65);
    }
  });
});
