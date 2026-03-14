import { describe, it, expect } from 'vitest';
import {
  calculateCoefficient,
  getCoefficientLabel,
  getCoefficientColor,
} from '../coefficient';

// ── calculateCoefficient ──────────────────────────────────────────────────────

describe('calculateCoefficient', () => {
  it('calcule un coefficient de morte-eau typique (données du 12/03/2026)', () => {
    // PM ~0.73, BM ~-0.90 → semiAmplitude = 0.815 → coeff ≈ 26
    expect(calculateCoefficient(0.73, -0.90)).toBe(26);
  });

  it('calcule un coefficient de vive-eau moyenne (coeff ~70)', () => {
    // On cherche PM et BM tels que semiAmplitude = 2.177 (70% de 3.11)
    // semiAmplitude = (PM - BM) / 2 = 2.177 → PM - BM = 4.354
    expect(calculateCoefficient(2.177, -2.177)).toBe(70);
  });

  it('calcule un coefficient de vive-eau exceptionnelle (coeff ~95)', () => {
    // semiAmplitude = 3.11 * 0.95 = 2.9545
    const pm = 2.9545;
    const bm = -2.9545;
    expect(calculateCoefficient(pm, bm)).toBe(95);
  });

  it('clamp le coefficient minimum à 20', () => {
    // Très petite amplitude → coeff calculé < 20
    expect(calculateCoefficient(0.1, -0.1)).toBe(20);
  });

  it('clamp le coefficient maximum à 120', () => {
    // Amplitude très grande → coeff calculé > 120
    expect(calculateCoefficient(5, -5)).toBe(120);
  });

  it('PM et BM symétriques autour du MSL donnent le même résultat', () => {
    const coeff1 = calculateCoefficient(1.5, -1.5);
    const coeff2 = calculateCoefficient(2.0, -1.0); // même amplitude totale
    expect(coeff1).toBe(coeff2);
  });
});

// ── getCoefficientLabel ───────────────────────────────────────────────────────

describe('getCoefficientLabel', () => {
  it('95+ → Vive-eau exceptionnelle', () => {
    expect(getCoefficientLabel(95)).toBe('Vive-eau exceptionnelle');
    expect(getCoefficientLabel(120)).toBe('Vive-eau exceptionnelle');
  });

  it('80-94 → Grande vive-eau', () => {
    expect(getCoefficientLabel(80)).toBe('Grande vive-eau');
    expect(getCoefficientLabel(90)).toBe('Grande vive-eau');
  });

  it('70-79 → Vive-eau', () => {
    expect(getCoefficientLabel(70)).toBe('Vive-eau');
    expect(getCoefficientLabel(75)).toBe('Vive-eau');
  });

  it('55-69 → Vive-eau moyenne', () => {
    expect(getCoefficientLabel(55)).toBe('Vive-eau moyenne');
  });

  it('45-54 → Morte-eau moyenne', () => {
    expect(getCoefficientLabel(45)).toBe('Morte-eau moyenne');
  });

  it('30-44 → Morte-eau', () => {
    expect(getCoefficientLabel(35)).toBe('Morte-eau');
  });

  it('< 30 → Petite morte-eau', () => {
    expect(getCoefficientLabel(20)).toBe('Petite morte-eau');
    expect(getCoefficientLabel(26)).toBe('Petite morte-eau');
  });
});

// ── getCoefficientColor ───────────────────────────────────────────────────────

describe('getCoefficientColor', () => {
  it('80+ → cyan', () => {
    expect(getCoefficientColor(80)).toBe('text-cyan-400');
    expect(getCoefficientColor(95)).toBe('text-cyan-400');
  });

  it('60-79 → vert', () => {
    expect(getCoefficientColor(60)).toBe('text-green-400');
    expect(getCoefficientColor(70)).toBe('text-green-400');
  });

  it('45-59 → jaune', () => {
    expect(getCoefficientColor(45)).toBe('text-yellow-400');
    expect(getCoefficientColor(50)).toBe('text-yellow-400');
  });

  it('< 45 → gris', () => {
    expect(getCoefficientColor(30)).toBe('text-slate-400');
    expect(getCoefficientColor(20)).toBe('text-slate-400');
  });
});
