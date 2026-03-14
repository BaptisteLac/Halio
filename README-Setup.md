# 🎣 PêcheBoard — Setup Guide

## Quick Start (3 minutes)

### 1. Créer le projet et y copier les fichiers

```bash
# Créer un dossier vide
mkdir pecheboard && cd pecheboard

# Copier les fichiers de ce package :
# - CLAUDE.md        → à la racine (CRUCIAL — c'est le cerveau de Claude Code)
# - data/spots.json  → dans data/
# - data/species.json → dans data/

# Initialiser git (Claude Code fonctionne mieux avec git)
git init
```

### 2. Lancer Claude Code

```bash
claude
```

### 3. Premier prompt à donner à Claude Code

Copie-colle ce prompt pour lancer le scaffolding complet :

```
Lis le CLAUDE.md à la racine du projet. C'est la spec complète de l'application PêcheBoard.

Lance le Sprint 1 complet :
1. Initialise le projet Next.js avec toutes les dépendances listées dans le CLAUDE.md
2. Crée la structure de dossiers complète (src/app, src/lib, src/components, etc.)
3. Implémente les services dans lib/ :
   - lib/tides/tide-service.ts (wrapper Neaps pour Arcachon)
   - lib/tides/coefficient.ts (calcul des coefficients via formule SHOM/Brest)
   - lib/solunar/solunar-service.ts (wrapper SunCalc)
   - lib/weather/weather-service.ts (client Open-Meteo)
4. Crée les API routes avec cache ISR (app/api/weather et app/api/marine)
5. Convertis les fichiers data/spots.json et data/species.json en modules TypeScript typés dans src/data/
6. Crée tous les types dans src/types/index.ts

Suis exactement les spécifications du CLAUDE.md pour le stack, les URLs d'API, les paramètres, et la structure.
```

### 4. Prompts suivants (un sprint à la fois)

**Sprint 2 — Score + Dashboard :**
```
Sprint 2 : Implémente l'algorithme de score de pêche (lib/scoring/) et tous les composants du dashboard :
- FishingScore (jauge circulaire 0-100)
- TideCurve (courbe de marée interactive avec recharts)
- WeatherCard, CoefficientBadge, SolunarIndicator
- SpeciesRecommendation ("Aujourd'hui = dorade royale")
- WeekForecast (7 jours avec mini-scores)
- BottomNav (4 tabs)
- Page dashboard (app/page.tsx)

Design dark theme mobile-first comme spécifié dans le CLAUDE.md.
```

**Sprint 3 — Carte :**
```
Sprint 3 : Intègre MapLibre GL JS + OpenFreeMap pour la carte des spots.
- SpotMap avec markers interactifs (couleur par score du jour)
- SpotDetail en bottom sheet avec toutes les infos du spot
- Filtrage par technique et espèce
- Page carte (app/carte/page.tsx)

Utilise OpenFreeMap pour les tuiles (gratuit, pas de clé). Pas de Mapbox.
```

**Sprint 4 — Espèces + Journal :**
```
Sprint 4 : Crée les pages espèces et le journal de pêche.
- Fiches espèces avec matrice conditions optimales
- Pages app/especes/page.tsx et [slug]/page.tsx
- Setup Supabase (schema SQL dans le CLAUDE.md)
- CatchForm avec conditions auto-remplies
- CatchList avec historique
```

**Sprint 5 — PWA + Polish :**
```
Sprint 5 : Finalise la PWA.
- Service worker avec cache offline (marées/coefficients/solunaire fonctionnent sans réseau)
- Manifest PWA (dark theme, standalone)
- Polish design, responsive, animations
- Test complet de tous les écrans
- Prépare le déploiement Vercel
```

## Tips pour Claude Code

- **Si le context window se remplit** : lance `/compact` pour résumer et libérer de l'espace
- **Pour les fichiers longs** : demande à Claude Code de les créer un par un plutôt que tout d'un coup
- **Si un sprint est trop gros** : découpe-le en sous-tâches
- **Toujours vérifier** : `npm run dev` après chaque sprint pour voir le résultat
- **Git** : fais un commit après chaque sprint fonctionnel

## Structure des données

Les fichiers `data/spots.json` et `data/species.json` contiennent respectivement 16 spots et 10 espèces avec toutes les conditions optimales, leurres, techniques, et pondérations pour l'algorithme de score. Claude Code va les convertir en modules TypeScript typés.

## Coût total

- APIs : 0€/mois (Open-Meteo gratuit, calculs locaux, OpenFreeMap)
- Hébergement : 0€/mois (Vercel gratuit)
- Base de données : 0€/mois (Supabase tier gratuit)
- **Total : 0€/mois** 🎉
