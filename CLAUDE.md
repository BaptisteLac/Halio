# CLAUDE.md — PêcheBoard (MVP Bassin d'Arcachon)

## Identité du projet

**PêcheBoard** est une PWA de pêche loisir pour le Bassin d'Arcachon. Elle aide les pêcheurs en bateau à décider **quand partir, où aller, quoi utiliser** en croisant données météo, marées, coefficients, tables solunaires et savoir halieutique local.

MVP = usage personnel + cercle de beta-testeurs (10-50 personnes). Pas de monétisation pour l'instant.

---

## Stack technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Framework | **Next.js** (App Router) | 15+ |
| Langage | **TypeScript** (strict mode) | 5.x |
| Styling | **Tailwind CSS** | 4.x |
| UI Components | **shadcn/ui** | latest |
| Cartographie | **MapLibre GL JS** + **react-map-gl** | latest |
| Tuiles carte | **OpenFreeMap** (vectorielles) + **IGN Géoportail** (ortho) | — |
| Marées | **@neaps/tide-predictor** + **@neaps/tide-database** (calcul local) | latest |
| Solunaire/Lune | **suncalc** (calcul local) | latest |
| Charts | **recharts** | latest |
| Base de données | **Supabase** (PostgreSQL + Auth + RLS) | — |
| PWA | **@ducanh2912/next-pwa** ou **serwist** | latest |
| State management | **zustand** | latest |
| Déploiement | **Vercel** (tier gratuit) | — |
| Icons | **lucide-react** | latest |

### Commandes d'initialisation

```bash
npx create-next-app@latest pecheboard --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd pecheboard
npm install @neaps/tide-predictor @neaps/tide-database suncalc recharts zustand maplibre-gl react-map-gl lucide-react
npm install -D @types/suncalc
npx shadcn@latest init
```

---

## Architecture des dossiers

```
src/
├── app/
│   ├── layout.tsx              # Root layout (dark theme, PWA meta)
│   ├── page.tsx                # Dashboard principal
│   ├── carte/
│   │   └── page.tsx            # Carte des spots
│   ├── especes/
│   │   ├── page.tsx            # Liste des espèces
│   │   └── [slug]/page.tsx     # Fiche espèce détaillée
│   ├── journal/
│   │   └── page.tsx            # Journal de pêche
│   └── api/
│       ├── weather/route.ts    # Proxy Open-Meteo Forecast (cache ISR)
│       └── marine/route.ts     # Proxy Open-Meteo Marine (cache ISR)
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx       # Navigation mobile bottom tab
│   │   ├── Header.tsx
│   │   └── PWAInstallPrompt.tsx
│   ├── dashboard/
│   │   ├── FishingScore.tsx    # Score 0-100 avec jauge circulaire
│   │   ├── TideCurve.tsx       # Courbe de marée interactive (recharts)
│   │   ├── WeatherCard.tsx     # Conditions actuelles (vent, pression, etc.)
│   │   ├── CoefficientBadge.tsx
│   │   ├── SolunarIndicator.tsx
│   │   ├── SpeciesRecommendation.tsx  # "Aujourd'hui = dorade royale"
│   │   └── WeekForecast.tsx    # Prévisions 7 jours avec mini-scores
│   ├── map/
│   │   ├── SpotMap.tsx         # Carte MapLibre avec markers spots
│   │   ├── SpotMarker.tsx
│   │   └── SpotDetail.tsx      # Bottom sheet avec infos du spot
│   ├── species/
│   │   ├── SpeciesCard.tsx
│   │   └── SpeciesConditionMatrix.tsx
│   └── journal/
│       ├── CatchForm.tsx       # Formulaire rapide de log
│       └── CatchList.tsx
├── lib/
│   ├── tides/
│   │   ├── tide-service.ts     # Wrapper Neaps — calcul marées Arcachon
│   │   ├── coefficient.ts      # Calcul coefficient de marée (formule SHOM)
│   │   └── tide-utils.ts       # Heure de marée, montant/descendant, etc.
│   ├── solunar/
│   │   └── solunar-service.ts  # Wrapper SunCalc — périodes solunaires
│   ├── weather/
│   │   └── weather-service.ts  # Client Open-Meteo (fetch + cache)
│   ├── scoring/
│   │   ├── fishing-score.ts    # Algorithme du score composite
│   │   └── species-weights.ts  # Pondérations par espèce
│   ├── supabase/
│   │   ├── client.ts           # Client Supabase
│   │   └── types.ts            # Types générés
│   └── utils/
│       ├── date.ts
│       └── geo.ts
├── data/
│   ├── spots.ts                # Base de données des spots (statique)
│   ├── species.ts              # Base de données des espèces (statique)
│   └── regulations.ts          # Réglementations (tailles, quotas)
├── stores/
│   └── app-store.ts            # Zustand store (settings, favoris)
└── types/
    └── index.ts                # Types globaux
```

---

## Règles de code

- **TypeScript strict** : `"strict": true` dans tsconfig. Pas de `any` sauf cas exceptionnel documenté.
- **Composants** : functional components uniquement, avec React Server Components par défaut. `"use client"` uniquement quand nécessaire (interactivité, hooks).
- **Imports** : utiliser l'alias `@/` pour tous les imports internes.
- **Pas de `console.log`** en production : utiliser un logger si nécessaire.
- **Responsive mobile-first** : le design DOIT être optimisé pour mobile. Touch targets minimum 44px. Zone du pouce accessible.
- **Dark theme** : thème sombre par défaut (pêcheurs = aube/crépuscule). Utiliser les variables CSS Tailwind dark.
- **Français** : toute l'interface est en français. Les noms de variables/fonctions restent en anglais.
- **Nommage** : PascalCase pour les composants, camelCase pour les fonctions/variables, SCREAMING_SNAKE pour les constantes.
- **Pas de bibliothèques inutiles** : rester léger. Chaque dépendance doit être justifiée.

---

## APIs externes — Configuration

### Open-Meteo Forecast (météo)
- **URL** : `https://api.open-meteo.com/v1/forecast`
- **Auth** : aucune (pas de clé API)
- **Limite** : 10 000 appels/jour (usage non-commercial)
- **Cache** : ISR 1 heure via API route Next.js
- **Paramètres Arcachon** : `latitude=44.66&longitude=-1.17&timezone=Europe/Paris`
- **Variables horaires** : `temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,precipitation,precipitation_probability,cloud_cover,weather_code`
- **Variables quotidiennes** : `temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_speed_10m_max,wind_gusts_10m_max,precipitation_sum,weather_code`

### Open-Meteo Marine (houle)
- **URL** : `https://marine-api.open-meteo.com/v1/marine`
- **Auth** : aucune
- **Variables** : `wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period`
- **Note** : PAS de température de l'eau (SST) disponible.

### Cartographie
- **MapLibre GL JS** : moteur de rendu open-source
- **Tuiles** : OpenFreeMap `https://tiles.openfreemap.org/styles/liberty` (style vectoriel, gratuit, pas de clé)
- **IGN Géoportail** (overlay optionnel) : `https://data.geopf.fr/wmts` (gratuit depuis 2023, pas de clé requise pour les couches standards)

---

## Données calculées côté client (ZERO API)

### Marées — @neaps/tide-predictor + @neaps/tide-database

```typescript
import TidePredictor from '@neaps/tide-predictor';
import { nearest } from '@neaps/tide-database';

// Trouver la station la plus proche d'Arcachon
const [station, distance] = nearest({ latitude: 44.66, longitude: -1.17 });

// Calculer les marées
const tides = TidePredictor(station.harmonic_constituents)
  .getExtremesPrediction({
    start: new Date('2026-03-11T00:00:00+01:00'),
    end: new Date('2026-03-12T00:00:00+01:00'),
  });
```

### Coefficients de marée — Formule SHOM

```typescript
// Amplitude moyenne de vive-eau à Brest = 3.11 m
const BREST_MEAN_SPRING_AMPLITUDE = 3.11;

function calculateCoefficient(highTide: number, lowTide: number): number {
  const amplitude = highTide - lowTide;
  // Le coefficient est calculé pour BREST (port de référence)
  // Il faut utiliser les hauteurs de marée de Brest
  return Math.round((amplitude / BREST_MEAN_SPRING_AMPLITUDE) * 100);
}
// Note : les coefficients doivent être calculés sur la station de Brest
// puis affichés pour Arcachon (ils sont identiques partout en France)
```

### Solunaire — suncalc

```typescript
import SunCalc from 'suncalc';

const date = new Date();
const lat = 44.66, lng = -1.17;

// Soleil
const sunTimes = SunCalc.getTimes(date, lat, lng);
// sunTimes.sunrise, sunTimes.sunset, sunTimes.dawn, sunTimes.dusk

// Lune
const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
// moonTimes.rise, moonTimes.set (transit = quand lune au plus haut)

const moonIllum = SunCalc.getMoonIllumination(date);
// moonIllum.phase (0=nouvelle, 0.5=pleine), moonIllum.fraction (% illuminé)

// Périodes solunaires :
// MAJEURE = transit lunaire ± 1h (lune au zénith ou nadir)
// MINEURE = lever/coucher de lune ± 30 min
```

---

## Algorithme du score de pêche

Le score va de 0 à 100 et est calculé pour chaque espèce × spot × créneau horaire.

### Facteurs et pondérations (exemple bar)

| Facteur | Poids | Calcul |
|---------|-------|--------|
| Coefficient de marée | 25% | Gaussienne centrée sur 75, σ=20 |
| Heure de marée | 20% | Max à 3e-4e heure, min à l'étale |
| Vent force | 15% | Optimal 10-18 nœuds, pénalité > 25 |
| Vent direction | 10% | Bonus SW/W, malus E fort (par spot) |
| Pression atmosphérique | 10% | Bonus si tendance baissière |
| Période solunaire | 10% | Bonus si dans une période majeure/mineure |
| Heure du jour (aube/crépuscule) | 5% | Bonus ±1h autour du lever/coucher |
| Température eau | 5% | Optimal 14-20°C, 0 si < 10°C |

### Pondérations par espèce (fichier species-weights.ts)

Les pondérations changent RADICALEMENT selon l'espèce :
- **Dorade royale** : coefficient INVERSÉ (optimal < 60), marée montante (25%), appât > leurre
- **Maigre** : coefficient FORT (optimal > 80), ÉTALE (pas courant), température eau haute
- **Seiche** : coefficient faible (< 60), eau calme et claire, fin de montant
- **Sole** : surfcasting nuit, forts coefficients (> 70), hiver

### Formule

```typescript
function calculateFishingScore(
  species: Species,
  spot: Spot,
  weather: WeatherData,
  tide: TideData,
  coefficient: number,
  solunar: SolunarData,
  date: Date
): number {
  const weights = getSpeciesWeights(species.id);

  const coeffScore = gaussianScore(coefficient, weights.coeff.optimal, weights.coeff.sigma);
  const tideHourScore = tideHourScore(tide.currentHour, weights.tideHour.optimal);
  const windScore = windForceScore(weather.windSpeed, weights.wind.optimal, weights.wind.max);
  const windDirScore = windDirectionScore(weather.windDirection, spot.optimalWindDir);
  const pressureScore = pressureTrendScore(weather.pressureTrend);
  const solunarScore = solunarPeriodScore(date, solunar);
  const dawnDuskScore = dawnDuskProximityScore(date, solunar.sunrise, solunar.sunset);
  const tempScore = waterTempScore(weather.waterTemp, weights.temp.optimal, weights.temp.min);

  return Math.round(
    coeffScore * weights.coeff.weight +
    tideHourScore * weights.tideHour.weight +
    windScore * weights.wind.weight +
    windDirScore * weights.windDir.weight +
    pressureScore * weights.pressure.weight +
    solunarScore * weights.solunar.weight +
    dawnDuskScore * weights.dawnDusk.weight +
    tempScore * weights.temp.weight
  );
}
```

---

## Base de données des spots (data/spots.ts)

Voir le fichier `data/spots.json` joint. Chaque spot contient :
- `id`, `name`, `slug`
- `latitude`, `longitude` (centre approximatif)
- `zone` : "passes" | "bancs" | "fosses" | "parcs" | "chenaux" | "cap-ferret" | "plages"
- `depth`: { min, max } en mètres
- `bottom`: "sable" | "vase" | "roche" | "epave" | "mixte"
- `species`: string[] (IDs des espèces ciblées)
- `techniques`: string[] (IDs des techniques)
- `optimalWindDir`: number[] (directions en degrés)
- `optimalCoeffRange`: [min, max]
- `optimalTidePhase`: "montant" | "descendant" | "etale" | "tous"
- `optimalTideHours`: number[] (1-6, heures de marée)
- `danger`: string | null
- `description`: string
- `tips`: string (conseil du local)
- `boatAccess`: true (tous les spots sont accessibles en bateau)

## Base de données des espèces (data/species.ts)

Voir le fichier `data/species.json` joint. Chaque espèce contient :
- `id`, `name`, `scientificName`, `slug`
- `localNames`: string[] (noms locaux, ex: "loup" pour le bar)
- `season`: { start: number, end: number } (mois, 1-12)
- `minSize`: number (cm, taille légale)
- `dailyQuota`: number | null
- `markingRequired`: boolean
- `closedPeriod`: string | null
- `optimalCoeffRange`: [min, max]
- `optimalTidePhase`, `optimalTideHours`
- `optimalWaterTemp`: { min, max }
- `techniques`: Technique[]
- `lures`: Lure[]
- `baits`: string[]
- `scoreWeights`: SpeciesWeights (pondérations pour l'algo)
- `description`, `tips`

---

## Design system

- **Palette sombre** : fond `slate-900`/`slate-950`, surfaces `slate-800`, texte `slate-100`/`slate-300`
- **Accent** : `cyan-400`/`cyan-500` (rappel océan)
- **Score couleurs** : rouge (0-30) → orange (30-50) → jaune (50-70) → vert (70-85) → cyan brillant (85-100)
- **Typographie** : Inter (via next/font/google)
- **Coins arrondis** : `rounded-xl` par défaut sur les cartes
- **Shadows** : subtiles, `shadow-lg shadow-black/20`
- **Bottom nav** : 4 tabs — Dashboard, Carte, Espèces, Journal
- **Touch targets** : minimum 44×44px, espacement 8px minimum entre éléments cliquables
- **Animations** : transitions Tailwind (`transition-all duration-200`), frugales
- **Pas de scroll horizontal** : tout doit tenir dans la largeur mobile

---

## Supabase — Schema

### Table `catches` (journal de pêche)
```sql
create table catches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  species_id text not null,
  spot_id text not null,
  caught_at timestamptz not null default now(),
  size_cm numeric,
  weight_kg numeric,
  technique text,
  lure_or_bait text,
  photo_url text,
  -- Conditions auto-remplies au moment de la prise
  coefficient integer,
  tide_phase text,
  tide_hour integer,
  wind_speed numeric,
  wind_direction integer,
  pressure numeric,
  water_temp numeric,
  moon_phase numeric,
  fishing_score integer,
  notes text,
  released boolean default false,
  created_at timestamptz default now()
);

-- RLS : chaque utilisateur ne voit que ses propres prises
alter table catches enable row level security;
create policy "Users can CRUD own catches"
  on catches for all using (auth.uid() = user_id);
```

### Table `user_settings`
```sql
create table user_settings (
  user_id uuid references auth.users primary key,
  favorite_species text[] default '{}',
  favorite_spots text[] default '{}',
  home_port text default 'arcachon',
  notifications_enabled boolean default false,
  created_at timestamptz default now()
);
```

---

## PWA Configuration

- **Service Worker** : cacher les assets statiques, les données marées/coefficients/espèces/spots
- **Offline** : les calculs marées + coefficients + solunaire fonctionnent SANS réseau
- **Cache météo** : garder les dernières données météo en cache pour consultation hors-ligne
- **Manifest** :
  - `name`: "PêcheBoard"
  - `short_name`: "PêcheBoard"
  - `theme_color`: "#0f172a" (slate-900)
  - `background_color`: "#0f172a"
  - `display`: "standalone"
  - `orientation`: "portrait"
  - `start_url`: "/"

---

## Priorité de développement (sprints)

### Sprint 1 — Fondations (lib/ + API routes)
1. Setup projet Next.js + toutes dépendances
2. `lib/tides/tide-service.ts` — wrapper Neaps, calcul marées Arcachon
3. `lib/tides/coefficient.ts` — calcul coefficients via station Brest
4. `lib/solunar/solunar-service.ts` — wrapper SunCalc
5. `lib/weather/weather-service.ts` — client Open-Meteo
6. `app/api/weather/route.ts` et `app/api/marine/route.ts` — proxy avec cache ISR
7. `data/spots.ts`, `data/species.ts`, `data/regulations.ts` — données statiques
8. Types TypeScript complets dans `types/index.ts`

### Sprint 2 — Score + Dashboard
1. `lib/scoring/fishing-score.ts` — algorithme complet
2. `lib/scoring/species-weights.ts` — matrices de pondérations
3. Composants dashboard : FishingScore, TideCurve, WeatherCard, CoefficientBadge, SolunarIndicator, SpeciesRecommendation, WeekForecast
4. Page dashboard (`app/page.tsx`)
5. BottomNav

### Sprint 3 — Carte + Spots
1. Intégration MapLibre + OpenFreeMap
2. SpotMap avec markers interactifs
3. SpotDetail bottom sheet
4. Filtrage par technique / espèce / score
5. Page carte (`app/carte/page.tsx`)

### Sprint 4 — Espèces + Journal
1. Fiches espèces avec matrice conditions
2. Page espèces (`app/especes/page.tsx` + `[slug]/page.tsx`)
3. Setup Supabase (auth + tables)
4. CatchForm + CatchList
5. Page journal (`app/journal/page.tsx`)

### Sprint 5 — PWA + Polish
1. Service worker + manifest
2. Cache offline
3. Dark theme finalisé
4. Tests manuels
5. Déploiement Vercel

---

## Rappels importants

- **NE PAS** dépenser d'argent en API. Tout doit être gratuit (Open-Meteo gratuit, calculs locaux, OpenFreeMap).
- **NE PAS** utiliser Mapbox (payant). Utiliser MapLibre + OpenFreeMap.
- **NE PAS** scraper de forums ou de sites tiers.
- Le Bassin d'Arcachon est le SEUL périmètre du MVP. Pas d'extension géographique.
- L'interface est 100% en **français**.
- Priorité absolue au **mobile**. Desktop = bonus, pas une priorité.
- Les données de spots et d'espèces sont **statiques** (pas d'API, compilées dans le code).
