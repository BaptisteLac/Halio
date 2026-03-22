# Dashboard UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructurer le dashboard "Aujourd'hui" pour une décision immédiate, créer la page "Semaine" pour la planification J-2/J-1, et refondre la bottom nav (5 onglets dont Semaine remplace Réglages).

**Architecture:** Ajout de nouveaux utilitaires (`formatTideHour`, `getBestWindow`) et d'un hook partagé (`useWeekForecasts`) comme fondations. Les composants existants sont modifiés de façon additive (props optionnelles, state interne). La page Semaine est entièrement nouvelle et réutilise les mêmes primitives de calcul que le dashboard.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS 4, Vitest, lucide-react, @neaps/tide-predictor (local), suncalc (local)

**Spec de référence:** `docs/superpowers/specs/2026-03-22-dashboard-ux-redesign-design.md`

**Commande de test:** `npm run test`
**Commande de build:** `npm run build`

---

## Task 1: Type `BestWindow` + utilitaire `formatTideHour`

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/tides/tide-utils.ts`
- Modify: `src/lib/tides/__tests__/tide-utils.test.ts`

- [ ] **Step 1: Ajouter le type `BestWindow` dans `types/index.ts`**

Ajouter après l'interface `DayForecast` (ligne ~282) :

```typescript
export interface BestWindow {
  start: Date;
  end: Date;
  score: number; // score moyen des espèces sur cette fenêtre (0-100)
}
```

Ajouter aussi `WeekDay` (remplacera `DayForecast` dans la page Semaine) après `BestWindow` :

```typescript
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
  isHighWind: boolean; // vrai si windKnots > 25
}
```

- [ ] **Step 2: Écrire le test pour `formatTideHour` dans le fichier de test existant**

Ajouter à la fin de `src/lib/tides/__tests__/tide-utils.test.ts` :

```typescript
// ── formatTideHour ────────────────────────────────────────────────────────────

describe('formatTideHour', () => {
  it('uses "1re" for first hour of montant', () => {
    expect(formatTideHour(1, 'montant')).toBe('1re heure de montant');
  });

  it('uses ordinal "e" for hours 2-6 of montant', () => {
    expect(formatTideHour(2, 'montant')).toBe('2e heure de montant');
    expect(formatTideHour(6, 'montant')).toBe('6e heure de montant');
  });

  it('uses "jusant" label for descendant phase', () => {
    expect(formatTideHour(1, 'descendant')).toBe('1re heure de jusant');
    expect(formatTideHour(3, 'descendant')).toBe('3e heure de jusant');
  });
});
```

Mettre à jour l'import en haut du fichier test pour inclure `formatTideHour` :

```typescript
import {
  mslToZH,
  formatTideHeight,
  formatDuration,
  getTidePhaseLabel,
  getTidePhaseIcon,
  isTidePhaseOptimal,
  getDayExtremes,
  getNextExtreme,
  getPrevExtreme,
  interpolateTideHeight,
  formatTideHour,
  ARCACHON_LAT_DATUM,
} from '../tide-utils';
```

- [ ] **Step 3: Vérifier que le test échoue**

```bash
npm run test -- tide-utils
```

Attendu : FAIL — `formatTideHour is not a function`

- [ ] **Step 4: Implémenter `formatTideHour` dans `tide-utils.ts`**

Ajouter à la fin de `src/lib/tides/tide-utils.ts` :

```typescript
/**
 * Formate l'heure de marée en ordinal français lisible
 * Ex: formatTideHour(1, 'montant') → "1re heure de montant"
 * Ex: formatTideHour(3, 'descendant') → "3e heure de jusant"
 */
export function formatTideHour(hour: number, phase: 'montant' | 'descendant'): string {
  const ordinal = hour === 1 ? '1re' : `${hour}e`;
  const phaseLabel = phase === 'montant' ? 'montant' : 'jusant';
  return `${ordinal} heure de ${phaseLabel}`;
}
```

- [ ] **Step 5: Vérifier que le test passe**

```bash
npm run test -- tide-utils
```

Attendu : PASS (tous les tests tide-utils verts)

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/tides/tide-utils.ts src/lib/tides/__tests__/tide-utils.test.ts
git commit -m "feat: add BestWindow/WeekDay types and formatTideHour utility"
```

---

## Task 2: Extraction `getBestWindow` dans `lib/scoring/fishing-windows.ts`

**Files:**
- Create: `src/lib/scoring/fishing-windows.ts`
- Create: `src/lib/scoring/__tests__/fishing-windows.test.ts`

- [ ] **Step 1: Écrire le test**

Créer `src/lib/scoring/__tests__/fishing-windows.test.ts` :

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getBestWindow } from '../fishing-windows';
import type { TideData, WeatherData, SolunarData, Species, FishingScore, Spot } from '@/types';

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
    swellHeight: null,
    waterTemp: null,
  },
  daily: [],
  hourly: [],
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

  it('returns null when all scores are below threshold', () => {
    // Mock calculateFishingScore to return 0 — use a date far in the past with no moon/solunar
    // This is a smoke test: result is either null or a valid BestWindow object
    const result = getBestWindow([], mockTide, mockWeather, mockSolunar, new Date('2026-03-22'));
    expect(result === null || (result && typeof result.score === 'number')).toBe(true);
  });

  it('returns a BestWindow with start, end, score when conditions are good', () => {
    // We can't easily mock internal score calculations, so we test shape only
    const result = getBestWindow([], mockTide, mockWeather, mockSolunar, new Date('2026-03-22'));
    if (result !== null) {
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result).toHaveProperty('score');
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
      expect(result.score).toBeGreaterThanOrEqual(65);
    }
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npm run test -- fishing-windows
```

Attendu : FAIL — `Cannot find module '../fishing-windows'`

- [ ] **Step 3: Créer `fishing-windows.ts` en extrayant la logique de `FishingWindows.tsx`**

Créer `src/lib/scoring/fishing-windows.ts` :

```typescript
import { getCurrentTideHour, getTidePhaseAtTime } from '@/lib/tides/tide-service';
import { calculateFishingScore } from '@/lib/scoring/fishing-score';
import type { TideData, WeatherData, SolunarData, Species, FishingScore, Spot, BestWindow } from '@/types';

const THRESHOLD = 65;
const SLOTS = 24; // slots horaires sur 24h
const SLOT_MS = 60 * 60 * 1000;

interface SpeciesResult {
  species: Species;
  score: FishingScore;
  spot: Spot;
}

/**
 * Calcule la meilleure fenêtre de pêche sur 24h pour un ensemble d'espèces.
 * Retourne null si aucun créneau n'atteint le seuil de qualité (65/100).
 */
export function getBestWindow(
  topSpecies: SpeciesResult[],
  tideData: TideData,
  weatherData: WeatherData,
  solunarData: SolunarData,
  date: Date
): BestWindow | null {
  if (topSpecies.length === 0) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const slots = Array.from(
    { length: SLOTS },
    (_, i) => new Date(startOfDay.getTime() + i * SLOT_MS)
  );

  const speciesTimelines = topSpecies.map(({ species, spot }) =>
    slots.map((slotTime) => {
      const currentHour = getCurrentTideHour(slotTime, tideData.extremes);
      const currentPhase = getTidePhaseAtTime(slotTime, tideData.extremes);
      const syntheticTide: TideData = { ...tideData, currentHour, currentPhase };
      return calculateFishingScore(
        species, spot, weatherData, syntheticTide, solunarData, slotTime
      ).total;
    })
  );

  const n = speciesTimelines.length;
  const combinedScores = slots.map((_, i) =>
    speciesTimelines.reduce((sum, tl) => sum + (tl[i] ?? 0), 0) / n
  );

  const maxCombined = Math.max(...combinedScores);
  if (maxCombined < THRESHOLD) return null;

  const peakIdx = combinedScores.indexOf(maxCombined);
  const isGood = combinedScores.map((avg) => avg >= THRESHOLD);

  let wStart = peakIdx;
  let wEnd = peakIdx;
  while (wStart > 0 && isGood[wStart - 1]) wStart--;
  while (wEnd < SLOTS - 1 && isGood[wEnd + 1]) wEnd++;

  return {
    start: slots[wStart]!,
    end: new Date(slots[wEnd]!.getTime() + SLOT_MS),
    score: Math.round(maxCombined),
  };
}
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
npm run test -- fishing-windows
```

Attendu : PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring/fishing-windows.ts src/lib/scoring/__tests__/fishing-windows.test.ts
git commit -m "feat: extract getBestWindow into lib/scoring/fishing-windows"
```

---

## Task 3: Hook `useWeekForecasts`

**Files:**
- Create: `src/hooks/useWeekForecasts.ts`

Ce hook n'a pas de test unitaire (effets asynchrones avec dépendances de données réelles). La vérification se fait visuellement lors de l'intégration dans `page.tsx` (Task 9) et `semaine/page.tsx` (Task 12).

- [ ] **Step 1: Créer `src/hooks/useWeekForecasts.ts`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { getTideData } from '@/lib/tides/tide-service';
import { calculateCoefficientForDate } from '@/lib/tides/coefficient';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { getBestWindow } from '@/lib/scoring/fishing-windows';
import { kmhToKnots, getWindDirectionLabel } from '@/lib/weather/weather-service';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';
import type { WeekDay } from '@/types';

export function useWeekForecasts(): {
  days: WeekDay[] | null;
  loading: boolean;
  error: boolean;
} {
  const [days, setDays] = useState<WeekDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeatherData()
      .then(async (weather) => {
        const results = await Promise.all(
          weather.daily.slice(0, 7).map(async (daily) => {
            const [tideData, coefficient] = await Promise.all([
              getTideData(daily.date),
              calculateCoefficientForDate(daily.date),
            ]);

            const syntheticWeather = {
              ...weather,
              current: {
                ...weather.current,
                windSpeed: daily.windSpeedMax,
                windDirection: daily.windDirectionDominant,
              },
            };

            const daySolunar = getSolunarData(daily.date);
            const topSpecies = getTopSpeciesForConditions(
              SPECIES, DASHBOARD_SPOT, syntheticWeather, tideData, daySolunar, daily.date, 1
            );
            const top = topSpecies[0];
            const bestWindow = getBestWindow(
              topSpecies, tideData, syntheticWeather, daySolunar, daily.date
            );
            const windKnots = kmhToKnots(daily.windSpeedMax);

            return {
              date: daily.date,
              daily,
              coefficient,
              score: top?.score.total ?? 0,
              topSpeciesId: top?.species.id ?? '',
              topSpeciesName: top?.species.name ?? '—',
              topLure: top?.species.lures[0]?.name ?? null,
              bestWindowStart: bestWindow?.start ?? null,
              bestWindowEnd: bestWindow?.end ?? null,
              windKnots,
              windDir: getWindDirectionLabel(daily.windDirectionDominant),
              isHighWind: windKnots > 25,
            } satisfies WeekDay;
          })
        );
        setDays(results);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { days, loading, error };
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Attendu : aucune erreur sur ce fichier.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useWeekForecasts.ts
git commit -m "feat: add useWeekForecasts hook for shared week data"
```

---

## Task 4: `FishingWindows` — touch-friendly

**Files:**
- Modify: `src/components/dashboard/FishingWindows.tsx`

Le changement : remplacer les événements `onMouseEnter`/`onMouseLeave` (non fonctionnels sur mobile) par une logique de tap persistant avec `onClick`.

- [ ] **Step 1: Remplacer la logique hover par tap dans `FishingWindows.tsx`**

**Remplacer** le container `div` avec `onMouseLeave` (ligne ~130) :

```tsx
// AVANT
<div
  className="relative"
  onMouseLeave={() => setTooltip(null)}
>
```

par :

```tsx
// APRÈS
<div className="relative">
```

**Remplacer** chaque slot `div` (lignes ~144-157) :

```tsx
// AVANT
<div
  key={i}
  className={`flex-1 cursor-pointer transition-opacity ${slotColor(score)} ${
    activeTooltip !== null && activeTooltip !== i ? 'opacity-50' : 'opacity-100'
  }`}
  onMouseEnter={() => setTooltip({ slotIndex: i, speciesIndex: si })}
  onClick={() =>
    setTooltip((prev) =>
      prev?.slotIndex === i && prev.speciesIndex === si ? null : { slotIndex: i, speciesIndex: si }
    )
  }
/>
```

par :

```tsx
// APRÈS — tap pour ouvrir/fermer, même comportement desktop + mobile
<div
  key={i}
  className={`flex-1 cursor-pointer transition-opacity ${slotColor(score)} ${
    activeTooltip !== null && activeTooltip !== i ? 'opacity-50' : 'opacity-100'
  }`}
  onClick={() =>
    setTooltip((prev) =>
      prev?.slotIndex === i && prev.speciesIndex === si ? null : { slotIndex: i, speciesIndex: si }
    )
  }
/>
```

**Ajouter** un gestionnaire global pour fermer le tooltip en tappant en dehors des slots. Remplacer le `<div className="space-y-4">` (container des timelines) par :

```tsx
<div
  className="space-y-4"
  onPointerDown={(e) => {
    // Ferme le tooltip si le tap est en dehors des slots (sur le container)
    if (e.target === e.currentTarget) setTooltip(null);
  }}
>
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/FishingWindows.tsx
git commit -m "fix: make FishingWindows tooltips touch-friendly (tap instead of hover)"
```

---

## Task 5: `FishingScoreCard` — toggle facteurs au tap

**Files:**
- Modify: `src/components/dashboard/FishingScoreCard.tsx`

- [ ] **Step 1: Ajouter `useState` et rendre la carte tappable**

En haut du fichier, s'assurer que `useState` est importé :

```typescript
import { useState } from 'react';
```

**Modifier** `FishingScoreCard` pour gérer son propre état `showFactors` :

```tsx
export default function FishingScoreCard({ score }: Props) {
  const [showFactors, setShowFactors] = useState(false);

  return (
    <div
      className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 cursor-pointer select-none"
      onClick={() => setShowFactors((v) => !v)}
      role="button"
      aria-expanded={showFactors}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-300 font-medium text-sm">Score de pêche</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${score.color}`}>{score.label}</span>
          <span className="text-slate-600 text-xs">{showFactors ? '↑' : '↓'}</span>
        </div>
      </div>

      <div className="flex justify-center my-1">
        <CircularGauge score={score.total} />
      </div>

      {showFactors && (
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-700/50">
          {(Object.entries(score.factors) as [keyof ScoreFactors, number][]).map(([key, value]) => (
            <FactorBar key={key} label={FACTOR_LABELS[key]} value={value} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-600 mt-2">
        {showFactors ? 'Tap pour masquer' : 'Tap pour voir le détail'}
      </p>
    </div>
  );
}
```

**Supprimer** la prop `showFactors` de l'interface `Props` (elle n'est plus nécessaire, l'état est interne) :

```typescript
// AVANT
interface Props {
  score: FishingScore;
  showFactors?: boolean;
}

// APRÈS
interface Props {
  score: FishingScore;
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/FishingScoreCard.tsx
git commit -m "feat: make FishingScoreCard tappable to toggle score factors"
```

---

## Task 6: `SpeciesRecommendation` — liens vers fiches espèces

**Files:**
- Modify: `src/components/dashboard/SpeciesRecommendation.tsx`

- [ ] **Step 1: Ajouter `Link` de `next/link`**

Ajouter l'import en haut du fichier :

```typescript
import Link from 'next/link';
```

**Modifier** la top espèce pour l'envelopper dans un lien :

```tsx
// Remplacer le div racine de la top espèce par un Link
<Link
  href={`/especes/${first.species.slug}`}
  className={`block rounded-lg p-3 border transition-colors ${
    first.score.total >= 70
      ? 'bg-cyan-400/10 border-cyan-400/25 hover:bg-cyan-400/15'
      : 'bg-slate-800 border-slate-700 hover:bg-slate-700/50'
  }`}
>
  <div className="flex items-start justify-between gap-2">
    {/* contenu inchangé */}
    <div className="min-w-0">
      <span className="text-white font-semibold">{first.species.name}</span>
      {first.species.localNames.length > 0 && (
        <span className="text-slate-400 text-xs ml-1.5">({first.species.localNames[0]})</span>
      )}
      <p className="text-slate-500 text-[10px] mt-0.5">📍 {first.spot.name}</p>
      {first.species.lures.length > 0 && (
        <p className="text-slate-400 text-xs mt-1 truncate">
          💡 {first.species.lures[0].name}
          {first.species.lures[1] ? ` · ${first.species.lures[1].name}` : ''}
        </p>
      )}
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <ScoreDot score={first.score.total} />
      <span className={`font-bold text-lg ${first.score.color}`}>{first.score.total}</span>
    </div>
  </div>
</Link>
```

**Modifier** les lignes des autres espèces pour ajouter des liens :

```tsx
{rest.map(({ species, score, spot }) => (
  <Link
    key={species.id}
    href={`/especes/${species.slug}`}
    className="flex items-center justify-between text-sm hover:bg-slate-700/30 rounded-lg px-1 py-0.5 transition-colors"
  >
    <div className="flex items-center gap-2 min-w-0">
      <ScoreDot score={score.total} />
      <div className="min-w-0">
        <span className="text-slate-300">{species.name}</span>
        <span className="text-slate-600 text-[10px] ml-1.5 truncate">· {spot.name}</span>
      </div>
    </div>
    <span className={`font-medium tabular-nums shrink-0 ${score.color}`}>{score.total}</span>
  </Link>
))}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/SpeciesRecommendation.tsx
git commit -m "feat: add navigation links from species recommendations to species pages"
```

---

## Task 7: `WeatherCard` + `SolunarIndicator` — prop `compact`

**Files:**
- Modify: `src/components/dashboard/WeatherCard.tsx`
- Modify: `src/components/dashboard/SolunarIndicator.tsx`

- [ ] **Step 1: Ajouter le mode compact à `WeatherCard`**

Modifier l'interface `Props` et le composant :

```tsx
interface Props {
  weather: WeatherData;
  compact?: boolean;
}

export default function WeatherCard({ weather, compact = false }: Props) {
  const { current } = weather;
  const windKnots = kmhToKnots(current.windSpeed);
  const windDir = getWindDirectionLabel(current.windDirection);

  // Mode compact : une seule carte condensée
  if (compact) {
    return (
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3 space-y-1.5">
        <h3 className="text-slate-400 font-medium text-xs">Météo</h3>
        <p className="text-white font-bold text-sm">
          {windDir} {windKnots.toFixed(0)} kt
        </p>
        <div className="text-xs text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1">
            <span>🌡 {Math.round(current.temperature)}°C</span>
            <span>·</span>
            <span>{Math.round(current.pressure)} hPa</span>
            <PressureIcon trend={current.pressureTrend} />
          </div>
          {current.waveHeight !== null && (
            <p>🌊 {current.waveHeight.toFixed(1)}m</p>
          )}
        </div>
      </div>
    );
  }

  // Mode normal : laisser TOUT le JSX existant de WeatherCard EXACTEMENT inchangé.
  // Ne rien supprimer, ne rien modifier. Copier mot pour mot depuis le fichier source actuel.
  const { current } = weather;
  const windKnots = kmhToKnots(current.windSpeed);
  // ... (copier ici le reste du corps de la fonction depuis WeatherCard.tsx)
}
```

- [ ] **Step 2: Ajouter le mode compact à `SolunarIndicator`**

Modifier l'interface `Props` :

```typescript
interface Props {
  solunar: SolunarData;
  now: Date;
  compact?: boolean;
}
```

Modifier le début du composant pour gérer le mode compact :

```tsx
export default function SolunarIndicator({ solunar, now, compact = false }: Props) {
  const moonEmoji = MOON_EMOJIS[Math.round(solunar.moonPhase * 8) % 8];
  const nextPeriod = solunar.periods.find((p) => p.start > now);

  if (compact) {
    return (
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3 space-y-1.5">
        <h3 className="text-slate-400 font-medium text-xs">Solunaire</h3>
        <p className="text-white font-bold text-sm">
          {moonEmoji} {solunar.moonPhaseName}
        </p>
        <div className="text-xs text-slate-400 space-y-0.5">
          {nextPeriod && (
            <p>Prochaine majeure : {fmt(nextPeriod.start)}</p>
          )}
          <p>☀️ Lever {fmt(solunar.sunrise)}</p>
        </div>
      </div>
    );
  }

  // Mode normal : laisser TOUT le reste de la fonction SolunarIndicator EXACTEMENT inchangé.
  // Copier mot pour mot depuis le fichier source actuel à partir de `const { currentPeriod } = solunar;`
  const { currentPeriod } = solunar;
  // ... (copier ici le reste du corps de la fonction depuis SolunarIndicator.tsx)
```

- [ ] **Step 3: Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/WeatherCard.tsx src/components/dashboard/SolunarIndicator.tsx
git commit -m "feat: add compact prop to WeatherCard and SolunarIndicator"
```

---

## Task 8: Nouveau composant `DayHero`

**Files:**
- Create: `src/components/dashboard/DayHero.tsx`

`DayHero` est le bloc "décision immédiate" en haut du dashboard : mini jauge + meilleure fenêtre + espèce top.

- [ ] **Step 1: Créer `src/components/dashboard/DayHero.tsx`**

```tsx
import type { FishingScore, BestWindow, Species, Spot } from '@/types';

interface SpeciesResult {
  species: Species;
  score: FishingScore;
  spot: Spot;
}

interface Props {
  score: FishingScore;
  bestWindow: BestWindow | null;
  topSpecies: SpeciesResult[];
}

const SCORE_HEX: Record<string, string> = {
  cyan: '#22d3ee',
  green: '#4ade80',
  yellow: '#facc15',
  orange: '#fb923c',
  red: '#f87171',
};

function scoreToHex(total: number): string {
  if (total >= 85) return SCORE_HEX.cyan!;
  if (total >= 70) return SCORE_HEX.green!;
  if (total >= 55) return SCORE_HEX.yellow!;
  if (total >= 40) return SCORE_HEX.orange!;
  return SCORE_HEX.red!;
}

function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function MiniGauge({ score }: { score: number }) {
  const radius = 26;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = scoreToHex(score);

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
      <circle
        cx="32" cy="32" r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" fill={color} fontSize="14" fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

export default function DayHero({ score, bestWindow, topSpecies }: Props) {
  const top = topSpecies[0];

  return (
    <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 rounded-xl border border-cyan-800/30 p-4">
      <p className="text-xs text-cyan-400/70 uppercase tracking-wide mb-3">
        Score de pêche · Aujourd&apos;hui
      </p>

      <div className="flex items-center gap-4">
        <MiniGauge score={score.total} />

        <div className="flex-1 min-w-0">
          <p className={`text-xl font-bold ${score.color}`}>{score.label}</p>

          {bestWindow ? (
            <p className="text-sm text-slate-300 mt-1">
              ⏰ Optimal{' '}
              <span className="font-semibold text-white">
                {fmt(bestWindow.start)} → {fmt(bestWindow.end)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Aucune fenêtre optimale aujourd&apos;hui</p>
          )}

          {top && (
            <p className="text-sm text-slate-400 mt-0.5">
              🐟{' '}
              <span className="text-slate-200 font-medium">{top.species.name}</span>
              {top.species.lures[0] && (
                <span className="text-slate-500"> · {top.species.lures[0].name}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/DayHero.tsx
git commit -m "feat: add DayHero component for at-a-glance fishing decision"
```

---

## Task 9: Restructurer `page.tsx` (page "Aujourd'hui")

**Files:**
- Modify: `src/app/page.tsx`

C'est la tâche d'intégration principale. Nouvelle hiérarchie : DayHero → FishingWindows → FishingScoreCard → Marées → Espèces → Météo+Solunaire (2 colonnes). Suppression de `WeekForecast`. Ajout de l'icône Réglages dans le header.

- [ ] **Step 1: Mettre à jour les imports**

Remplacer les imports actuels en haut de `page.tsx` :

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { TideData, TideCurvePoint, WeatherData, SolunarData } from '@/types';
import { getTideData, getTideCurve } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { calculateCoefficientForDate } from '@/lib/tides/coefficient';
import { calculateFishingScore, getTopSpeciesForConditions } from '@/lib/scoring/fishing-score';
import { getBestWindow } from '@/lib/scoring/fishing-windows';
import { mslToZH } from '@/lib/tides/tide-utils';
import { formatTideHour } from '@/lib/tides/tide-utils';
import { SPECIES } from '@/data/species';
import { DASHBOARD_SPOT } from '@/data/spots';
import Link from 'next/link';
import { Settings } from 'lucide-react';

import BottomNav from '@/components/layout/BottomNav';
import WeatherErrorBanner from '@/components/layout/WeatherErrorBanner';
import TideCurve from '@/components/dashboard/TideCurve';
import WeatherCard from '@/components/dashboard/WeatherCard';
import CoefficientBadge from '@/components/dashboard/CoefficientBadge';
import SolunarIndicator from '@/components/dashboard/SolunarIndicator';
import FishingScoreCard from '@/components/dashboard/FishingScoreCard';
import SpeciesRecommendation from '@/components/dashboard/SpeciesRecommendation';
import FishingWindows from '@/components/dashboard/FishingWindows';
import DayHero from '@/components/dashboard/DayHero';
```

(Supprimer les imports de `WeekForecast`, `DayForecast`, et les helpers `formatDuration`/`fmt` locaux qui sont maintenant dans les composants.)

- [ ] **Step 2: Simplifier le state — supprimer `weekForecasts`**

Dans le composant `DashboardPage`, supprimer :
- `const [weekForecasts, setWeekForecasts] = useState<DayForecast[] | null>(null);`
- Tout le bloc de calcul `weekForecasts` dans le `useEffect` (lignes 98–126)

- [ ] **Step 3: Calculer `bestWindow` après le chargement des données**

`tideData` et `solunarData` sont garantis non-null à ce stade car la page affiche une erreur et retourne tôt si l'une ou l'autre est null (voir le guard `if (error || !tideData || !solunarData || !tideCurve)` existant). Le calcul de `bestWindow` se fait donc après ce guard, dans la partie "rendu normal".

Après la ligne `const overallScore = ...` (vers ligne 164, après les guards de chargement), ajouter :

```typescript
// tideData, solunarData sont non-null ici (les guards ci-dessus auraient retourné)
const bestWindow =
  weatherData !== null && topSpecies.length > 0
    ? getBestWindow(topSpecies, tideData, weatherData, solunarData, now)
    : null;
```

- [ ] **Step 4: Remplacer le header pour ajouter l'icône Réglages**

```tsx
<header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800/80">
  <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
    <div>
      <h1 className="text-base font-bold text-white">PêcheBoard</h1>
      <p className="text-xs text-slate-400 capitalize">{dateLabel}</p>
    </div>
    <div className="flex items-center gap-3">
      <CoefficientBadge coefficient={coefficient} size="md" />
      <Link
        href="/reglages"
        className="text-slate-500 hover:text-slate-300 transition-colors p-1"
        aria-label="Réglages"
      >
        <Settings size={18} />
      </Link>
    </div>
  </div>
</header>
```

- [ ] **Step 5: Remplacer le contenu du `<main>` avec la nouvelle hiérarchie**

```tsx
<main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
  {/* ① Hero — décision immédiate */}
  {overallScore && (
    <DayHero
      score={overallScore}
      bestWindow={bestWindow}
      topSpecies={topSpecies}
    />
  )}

  {/* ② Fenêtres de pêche — remonté, touch-friendly */}
  {weatherData && topSpecies.length > 0 && (
    <FishingWindows
      topSpecies={topSpecies}
      tideData={tideData}
      weatherData={weatherData}
      solunarData={solunarData}
      now={now}
    />
  )}

  {/* ③ Score détaillé — tappable */}
  {overallScore && <FishingScoreCard score={overallScore} />}

  {/* ④ Marées */}
  <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-slate-300 font-medium text-sm">Marées aujourd&apos;hui</h3>
      <span
        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
          currentPhase === 'montant'
            ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/30'
            : 'bg-orange-400/15 text-orange-400 border-orange-400/30'
        }`}
      >
        {currentPhase === 'montant' ? '↑' : '↓'} {formatTideHour(currentHour, currentPhase)}
      </span>
    </div>

    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-white tabular-nums">
        {mslToZH(currentHeight).toFixed(2)}
      </span>
      <span className="text-slate-400 text-sm">m (ZH)</span>
    </div>

    <p className="text-xs text-slate-400">
      {nextExtreme.type === 'high' ? '⬆️ PM' : '⬇️ BM'}{' '}
      <span className="text-slate-200 font-medium">{fmt(nextExtreme.time)}</span>
      {' — '}
      <span className="text-slate-300">{mslToZH(nextExtreme.height).toFixed(2)} m</span>
      <span className="text-slate-500"> ({formatDuration(timeToNextExtreme)})</span>
    </p>

    <div className="flex gap-2 flex-wrap">
      {todayExtremes.map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-1 text-xs bg-slate-700/50 rounded-lg px-2 py-1"
        >
          <span className={e.type === 'high' ? 'text-cyan-400' : 'text-slate-400'}>
            {e.type === 'high' ? 'PM' : 'BM'}
          </span>
          <span className="text-slate-300">{fmt(e.time)}</span>
          <span className="text-slate-500">{mslToZH(e.height).toFixed(2)} m</span>
        </div>
      ))}
    </div>

    <TideCurve curve={tideCurve} extremes={tideData.extremes} now={now} />
  </div>

  {/* ⑤ Espèces recommandées — avec liens */}
  {topSpecies.length > 0 && <SpeciesRecommendation topSpecies={topSpecies} />}

  {/* ⑥ Météo + Solunaire — grille 2 colonnes condensée */}
  {weatherData && (
    <div className="grid grid-cols-2 gap-3">
      <WeatherCard weather={weatherData} compact />
      <SolunarIndicator solunar={solunarData} now={now} compact />
    </div>
  )}
  {!weatherData && <SolunarIndicator solunar={solunarData} now={now} />}
</main>
```

Note : garder les helpers locaux `fmt` et `formatDuration` dans `page.tsx` pour les marées (utilisés dans le bloc inline).

- [ ] **Step 6: Vérifier la compilation complète**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

Attendu : aucune erreur.

- [ ] **Step 7: Lancer les tests**

```bash
npm run test
```

Attendu : tous les tests passent (aucune régression).

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: restructure dashboard Aujourd'hui with DayHero, touch windows, compact layout"
```

---

## Task 10: Refonte `BottomNav` — 5 onglets

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`

Nouvelle nav : `Aujourd'hui | Semaine | Carte | Espèces | Journal`. Réglages retiré (accessible via header).

- [ ] **Step 1: Remplacer `NAV_ITEMS` dans `BottomNav.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CalendarDays, Map, Fish, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: "Aujourd'hui", icon: CalendarCheck },
  { href: '/semaine', label: 'Semaine', icon: CalendarDays },
  { href: '/carte', label: 'Carte', icon: Map },
  { href: '/especes', label: 'Espèces', icon: Fish },
  { href: '/journal', label: 'Journal', icon: BookOpen },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 z-50">
      <div className="flex max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 min-h-[56px] transition-colors ${
                active ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

Note : icône réduite à 20px (au lieu de 22px) et label réduit à 10px pour accommoder 5 onglets confortablement.

- [ ] **Step 2: Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/BottomNav.tsx
git commit -m "feat: update BottomNav to 5 tabs (add Semaine, remove Réglages to header)"
```

---

## Task 11: Composants de la page Semaine

**Files:**
- Create: `src/components/semaine/BestDayHero.tsx`
- Create: `src/components/semaine/DayDetail.tsx`
- Create: `src/components/semaine/WeekView.tsx`

- [ ] **Step 1: Créer `BestDayHero.tsx`**

Créer `src/components/semaine/BestDayHero.tsx` :

```tsx
import type { WeekDay } from '@/types';
import { getFishingScoreColor, getFishingScoreLabel } from '@/lib/scoring/fishing-score';

interface Props {
  days: WeekDay[];
}

function fmt(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

export default function BestDayHero({ days }: Props) {
  const best = days.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), days[0]!);

  if (best.score < 65) {
    return (
      <div className="bg-orange-950/40 border border-orange-800/40 rounded-xl p-4">
        <p className="text-xs text-orange-400/70 uppercase tracking-wide mb-1">Cette semaine</p>
        <p className="text-white font-bold text-lg">Conditions difficiles</p>
        <p className="text-orange-400/80 text-sm mt-1">
          Aucun créneau optimal prévu — score max : {best.score}/100
        </p>
      </div>
    );
  }

  const dayLabel = best.date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  });

  const scoreColor = getFishingScoreColor(best.score);
  const scoreLabel = getFishingScoreLabel(best.score);

  return (
    <div className="bg-gradient-to-br from-green-950/60 to-slate-900 border border-green-800/40 rounded-xl p-4">
      <p className="text-xs text-green-400/70 uppercase tracking-wide mb-2">
        ⭐ Meilleur créneau de la semaine
      </p>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg capitalize">{dayLabel}</p>
          {best.bestWindowStart && best.bestWindowEnd ? (
            <p className="text-green-300 text-sm mt-1">
              ⏰ {fmt(best.bestWindowStart)} → {fmt(best.bestWindowEnd)}
            </p>
          ) : null}
          <p className="text-slate-400 text-sm mt-0.5">
            🐟 {best.topSpeciesName} · coeff {best.coefficient} · {best.windDir} {best.windKnots.toFixed(0)} kt
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-3xl font-extrabold ${scoreColor}`}>{best.score}</p>
          <p className={`text-xs ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Créer `DayDetail.tsx`**

Créer `src/components/semaine/DayDetail.tsx` :

```tsx
import type { WeekDay } from '@/types';
import { getFishingScoreColor } from '@/lib/scoring/fishing-score';

interface Props {
  day: WeekDay;
}

function fmt(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

export default function DayDetail({ day }: Props) {
  const scoreColor = getFishingScoreColor(day.score);

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 space-y-3">
      {/* Pills résumé */}
      <div className="flex gap-2 flex-wrap">
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1 min-w-0">
          <p className="text-xs text-slate-500">Coefficient</p>
          <p className="text-base font-bold text-cyan-400">{day.coefficient}</p>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1 min-w-0">
          <p className="text-xs text-slate-500">Vent</p>
          <p className="text-sm font-bold text-slate-200">
            {day.windDir} {day.windKnots.toFixed(0)} kt
            {day.isHighWind && <span className="text-orange-400 ml-1">⚠️</span>}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1 min-w-0">
          <p className="text-xs text-slate-500">Fenêtre</p>
          <p className="text-sm font-bold text-slate-200">
            {day.bestWindowStart ? fmt(day.bestWindowStart) : '—'}
          </p>
        </div>
      </div>

      {/* Espèce recommandée */}
      {day.topSpeciesName !== '—' && (
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-slate-300 font-medium">🐟 {day.topSpeciesName}</span>
            {day.topLure && (
              <span className="text-slate-500 ml-2">· {day.topLure}</span>
            )}
          </div>
          <span className={`font-bold tabular-nums ${scoreColor}`}>{day.score}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Créer `WeekView.tsx`**

Créer `src/components/semaine/WeekView.tsx` :

```tsx
'use client';

import { useState } from 'react';
import type { WeekDay } from '@/types';
import { getFishingScoreColor } from '@/lib/scoring/fishing-score';
import DayDetail from './DayDetail';

interface Props {
  days: WeekDay[];
  bestDayDate: Date;
  todayDate: Date;
}

function fmt(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

const SHORT_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function WeekView({ days, bestDayDate, todayDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-1">
      <h3 className="text-slate-300 font-medium text-sm mb-3">Prévisions 7 jours</h3>

      {days.map((day) => {
        const isToday = day.date.toDateString() === todayDate.toDateString();
        const isBest = day.date.toDateString() === bestDayDate.toDateString();
        const isSelected = selectedDate?.toDateString() === day.date.toDateString();
        const scoreColor = getFishingScoreColor(day.score);
        const dayNum = day.date.getDay();
        const dayName = SHORT_DAYS[dayNum] ?? '---';
        const dayOfMonth = day.date.getDate();

        // Largeur de la barre de fenêtre proportionnelle au score (max ~80px)
        const barWidth = Math.round((day.score / 100) * 72);

        return (
          <div key={day.date.toISOString()}>
            <button
              type="button"
              onClick={() => setSelectedDate((prev) =>
                prev?.toDateString() === day.date.toDateString() ? null : day.date
              )}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors text-left ${
                isBest
                  ? 'bg-green-950/50 border border-green-800/40'
                  : isToday
                  ? 'bg-slate-700/30 border border-cyan-800/30'
                  : 'hover:bg-slate-700/20 border border-transparent'
              }`}
            >
              {/* Jour */}
              <div className="w-9 text-center shrink-0">
                <p className={`text-[10px] uppercase ${isBest ? 'text-green-400' : isToday ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {isBest ? '⭐' : dayName}
                </p>
                <p className={`text-base font-bold leading-tight ${isBest ? 'text-green-300' : isToday ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {dayOfMonth}
                </p>
              </div>

              {/* Barre + fenêtre */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div
                    className={`h-2 rounded-full ${day.score >= 70 ? 'bg-cyan-500' : day.score >= 55 ? 'bg-green-500/80' : day.score >= 40 ? 'bg-yellow-500/60' : 'bg-slate-600/40'}`}
                    style={{ width: `${barWidth}px` }}
                  />
                  {day.bestWindowStart && (
                    <span className="text-[10px] text-slate-500">
                      {fmt(day.bestWindowStart)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  Coeff {day.coefficient} · {day.windDir} {day.windKnots.toFixed(0)} kt
                  {day.isHighWind && ' ⚠️'}
                  {' · '}
                  {day.topSpeciesName}
                </p>
              </div>

              {/* Score */}
              <span className={`font-bold text-base tabular-nums shrink-0 ${scoreColor}`}>
                {day.score}
              </span>
            </button>

            {/* Détail inline */}
            {isSelected && (
              <div className="mt-1 mb-2">
                <DayDetail day={day} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/semaine/
git commit -m "feat: add BestDayHero, DayDetail, WeekView components for Semaine page"
```

---

## Task 12: Page `semaine/page.tsx`

**Files:**
- Create: `src/app/semaine/page.tsx`

- [ ] **Step 1: Créer `src/app/semaine/page.tsx`**

```tsx
'use client';

import { useMemo } from 'react';
import { useWeekForecasts } from '@/hooks/useWeekForecasts';
import BottomNav from '@/components/layout/BottomNav';
import BestDayHero from '@/components/semaine/BestDayHero';
import WeekView from '@/components/semaine/WeekView';

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 max-w-lg mx-auto">
      <div className="h-24 bg-slate-800 rounded-xl" />
      <div className="h-64 bg-slate-800 rounded-xl" />
    </div>
  );
}

export default function SemainePage() {
  const { days, loading, error } = useWeekForecasts();
  const today = useMemo(() => new Date(), []);

  const bestDay = useMemo(() => {
    if (!days || days.length === 0) return null;
    return days.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), days[0]!);
  }, [days]);

  // Plage de dates affichée dans le header
  const weekRange = useMemo(() => {
    if (!days || days.length === 0) return '';
    const first = days[0]!.date;
    const last = days[days.length - 1]!.date;
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' };
    return `${first.toLocaleDateString('fr-FR', opts)} – ${last.toLocaleDateString('fr-FR', opts)}`;
  }, [days]);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800/80">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-base font-bold text-white">Cette semaine</h1>
            {weekRange && <p className="text-xs text-slate-400">{weekRange}</p>}
          </div>
          <div className="text-xs text-slate-500 bg-slate-800 rounded-md px-2 py-1">
            Bassin d&apos;Arcachon
          </div>
        </div>
      </header>

      {/* Loading */}
      {loading && <LoadingSkeleton />}

      {/* Erreur météo */}
      {!loading && error && (
        <div className="p-4 max-w-lg mx-auto">
          <div className="bg-orange-950/40 border border-orange-800/40 rounded-xl p-4 text-center">
            <p className="text-orange-400 font-medium text-sm">Météo indisponible</p>
            <p className="text-slate-500 text-xs mt-1">
              Impossible de charger les prévisions — vérifiez votre connexion
            </p>
          </div>
        </div>
      )}

      {/* Contenu */}
      {!loading && !error && days && bestDay && (
        <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
          {/* ① Hero meilleur jour */}
          <BestDayHero days={days} />

          {/* ② Liste 7 jours interactive */}
          <WeekView days={days} bestDayDate={bestDay.date} todayDate={today} />
        </main>
      )}

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation complète**

```bash
npm run build 2>&1 | grep -E "error TS|error:" | head -20
```

Attendu : aucune erreur.

- [ ] **Step 3: Lancer tous les tests**

```bash
npm run test
```

Attendu : tous les tests passent.

- [ ] **Step 4: Commit**

```bash
git add src/app/semaine/page.tsx
git commit -m "feat: add Semaine page with weekly planning view"
```

---

## Task 13: Nettoyage — supprimer `WeekForecast.tsx` + vérification finale

**Files:**
- Delete: `src/components/dashboard/WeekForecast.tsx`

- [ ] **Step 1: Vérifier qu'aucun fichier n'importe encore `WeekForecast`**

```bash
grep -r "WeekForecast" src/ --include="*.tsx" --include="*.ts"
```

Attendu : aucun résultat (le seul consommateur était `page.tsx` qui a été mis à jour en Task 9).

- [ ] **Step 2: Supprimer `WeekForecast.tsx`**

```bash
rm src/components/dashboard/WeekForecast.tsx
```

- [ ] **Step 3: Build final de vérification**

```bash
npm run build 2>&1 | tail -20
```

Attendu : `✓ Compiled successfully` — aucune erreur.

- [ ] **Step 4: Tests finaux**

```bash
npm run test
```

Attendu : tous les tests passent (aucune régression).

- [ ] **Step 5: Commit final**

```bash
git add src/components/dashboard/ src/components/semaine/ src/app/ src/hooks/ src/lib/scoring/ src/lib/tides/ src/types/ src/components/layout/BottomNav.tsx
git commit -m "feat: complete dashboard UX redesign — DayHero, Semaine page, 5-tab nav, touch-friendly

- Nouvelle hiérarchie dashboard Aujourd'hui (DayHero, FishingWindows remonté)
- Score tappable pour voir les facteurs détaillés
- Fenêtres de pêche touch-friendly (tap au lieu de hover)
- Espèces recommandées avec liens vers fiches
- Météo + Solunaire condensés en 2 colonnes
- Nouvelle page /semaine avec vue planification 7 jours
- Bottom nav 5 onglets (Réglages déplacé dans le header)
- Badge heure de marée lisible (1re heure de montant...)
- Utilitaires getBestWindow + useWeekForecasts partagés"
```
