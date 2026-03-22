# Design Spec — Dashboard UX Redesign + Page Semaine

**Date :** 2026-03-22
**Statut :** Approuvé
**Scope :** Refonte UX du dashboard Aujourd'hui + création page Semaine + refonte bottom nav

---

## Contexte & Problème

### Profil utilisateur cible
Marin dans l'âme, pêcheur novice en technique. Connaît le vocabulaire marin (coefficients, phases de marée, nœuds) mais a besoin d'accompagnement sur quand sortir, où aller, quelle espèce cibler, quel matériel utiliser.

### Deux modes d'usage distincts
1. **Planification (J-2 / J-1)** — "Quel jour de la semaine offre le meilleur créneau ?" → vue hebdomadaire
2. **Jour J** — "Quelle est la fenêtre exacte aujourd'hui, quelle espèce, quel leurre ?" → vue temps réel

### Problèmes du dashboard actuel
- La question clé "est-ce que je pars ?" nécessite de lire 4 blocs séparés avant d'avoir une réponse
- La `WeekForecast` (mode planification) est enterrée en bas de page après 6 blocs
- Les tooltips de `FishingWindows` utilisent `onMouseEnter`/`onMouseLeave` — inutilisables sur mobile (touch)
- `FishingScoreCard` a `showFactors=false` sans aucune interaction pour voir le détail
- Aucune navigation contextuelle depuis les espèces recommandées vers leurs fiches
- `"Heure {currentHour}/6"` peu lisible pour un non-initié
- `WeatherCard` et `SolunarIndicator` occupent deux blocs séparés → scroll excessif

---

## Architecture cible

### Navigation — Bottom nav (5 onglets, remodelée)

**Avant :** `Dashboard | Carte | Espèces | Journal | Réglages`
**Après :** `Aujourd'hui | Semaine | Carte | Espèces | Journal`

Changements explicites :
| Onglet | Action | Détail |
|--------|--------|--------|
| `Dashboard` → `Aujourd'hui` | Renommé + icône changée | `LayoutDashboard` → `CalendarCheck` (lucide-react) |
| `Semaine` | Ajouté (position 2) | Nouvel onglet → `/semaine`, icône `CalendarDays` |
| `Réglages` | **Retiré de la nav** | Accessible via icône ⚙️ dans le header du dashboard |

**Page `/reglages` conservée intacte.** Elle devient accessible via un bouton `<Settings size={18}>` en haut à droite du header de la page "Aujourd'hui". Aucun contenu ni logique de cette page n'est modifié.

### Fichiers impactés

| Fichier | Action | Détail |
|---------|--------|--------|
| `src/components/layout/BottomNav.tsx` | Modifié | Remplacer les 5 items : Dashboard→Aujourd'hui, supprimer Réglages, ajouter Semaine |
| `src/app/page.tsx` | Modifié | Restructurer ordre des blocs, ajouter lien Réglages dans header, supprimer `<WeekForecast>` |
| `src/app/semaine/page.tsx` | **Créé** | Nouvelle page Semaine |
| `src/components/dashboard/DayHero.tsx` | **Créé** | Bloc hero "décision immédiate" (score + fenêtre + espèce) |
| `src/components/dashboard/FishingScoreCard.tsx` | Modifié | Ajouter toggle interne `showFactors` au tap |
| `src/components/dashboard/FishingWindows.tsx` | Modifié | Touch-friendly : hover → tap persistant |
| `src/components/dashboard/SpeciesRecommendation.tsx` | Modifié | Ajouter liens `next/link` vers fiches espèces |
| `src/components/dashboard/WeatherCard.tsx` | Modifié | Ajouter prop `compact?: boolean` |
| `src/components/dashboard/SolunarIndicator.tsx` | Modifié | Ajouter prop `compact?: boolean` |
| `src/components/dashboard/WeekForecast.tsx` | **Supprimé** | Remplacé par `WeekView.tsx` ; le code de rendu des lignes est réécrit dans `WeekView` avec l'interactivité en plus |
| `src/components/semaine/WeekView.tsx` | **Créé** | Liste 7 jours interactive — remplace et étend `WeekForecast` (tap → `DayDetail`, mini-barre, badge ⭐/⚠️) |
| `src/components/semaine/BestDayHero.tsx` | **Créé** | Hero "meilleur créneau de la semaine" |
| `src/components/semaine/DayDetail.tsx` | **Créé** | Détail inline d'un jour sélectionné |
| `src/lib/scoring/fishing-windows.ts` | **Créé** | Extraction de la logique `bestWindow` depuis `FishingWindows.tsx` |
| `src/hooks/useWeekForecasts.ts` | **Créé** | Hook partagé encapsulant le calcul `weekForecasts` |

---

## Design détaillé

### Page "Aujourd'hui" — Nouvelle hiérarchie des blocs

```
Header : "PêcheBoard" + date + CoefficientBadge + icône ⚙️ (→ /reglages)

① DayHero — Bloc "Décision immédiate" (nouveau composant)
   Jauge score circulaire (mini, 64px)
   Label coloré : Excellent / Bon / Moyen / Faible / Mauvais
   Meilleure fenêtre du jour : "Optimal 14h → 17h" (ou "Aucune fenêtre optimale")
   Espèce top + leurre recommandé
   CTA tappable "↓ Voir le détail" → scroll vers FishingScoreCard ou toggle facteurs

② FishingWindows — Timeline 24h (remonté, touch-friendly)
   Barres colorées par espèce
   Marqueur heure courante (trait orange)
   Tap sur un slot → tooltip persistant (remplace hover)
   Tap en dehors ou sur le même slot → ferme le tooltip
   Pill "★ Meilleure sortie : 14h00 → 17h00"

③ FishingScoreCard — Score détaillé (tappable)
   Jauge circulaire 140px existante conservée
   Label + score
   Tap sur la carte → toggle `showFactors` (barres de facteurs)
   Libellé "↓ Détail des facteurs" / "↑ Masquer"

④ Marées (condensé)
   Hauteur courante + badge phase lisible (voir ordinal ci-dessous)
   Prochain extrême sur une ligne
   Extrêmes du jour en pills
   Courbe compacte (inchangée)

⑤ Espèces recommandées (avec liens)
   Top espèce : `<Link href="/especes/{species.slug}">` englobant la carte
   Bouton "→ Fiche" visible sur la top espèce
   Autres espèces : lien "→" en fin de ligne

⑥ Météo + Solunaire (grille 2 colonnes, prop compact)
   `<WeatherCard compact />` et `<SolunarIndicator compact />`
   Layout : `<div className="grid grid-cols-2 gap-3">`
```

**Supprimé :** `<WeekForecast>` retiré de `page.tsx`.

---

### Ordinal français pour l'heure de marée

Remplacer `"Heure {currentHour}/6"` par un badge lisible. Libellés exacts :

| `currentHour` | `currentPhase` | Libellé affiché |
|---------------|----------------|-----------------|
| 1 | montant | `1re heure de montant` |
| 2 | montant | `2e heure de montant` |
| 3 | montant | `3e heure de montant` |
| 4 | montant | `4e heure de montant` |
| 5 | montant | `5e heure de montant` |
| 6 | montant | `6e heure de montant` |
| 1 | descendant | `1re heure de jusant` |
| 2–6 | descendant | `{n}e heure de jusant` |

Implémentation : fonction utilitaire `formatTideHour(hour: number, phase: TidePhase): string` dans `lib/tides/tide-utils.ts`.

---

### Prop `compact` pour WeatherCard et SolunarIndicator

**`WeatherCard compact`** affiche :
- Vent : force (nœuds) + direction (ex. "SW 14 kt")
- Température air (°C)
- Pression (hPa) + tendance (↗/↘/→)
- Houle : hauteur + période (ex. "0.6m · 8s")

**`WeatherCard` normal** (inchangé) : tout le contenu actuel.

**`SolunarIndicator compact`** affiche :
- Phase lunaire (emoji + label, ex. "🌕 Pleine lune")
- Prochaine période majeure (heure)
- Heure de lever du soleil

**`SolunarIndicator` normal** (inchangé) : tout le contenu actuel.

---

### Page "Semaine" — `/semaine`

```
Header : "Cette semaine" + plage de dates (ex. "22 – 28 mars") + badge "Bassin d'Arcachon"

① BestDayHero — Meilleur créneau de la semaine
   Fond vert gradient (distinct visuellement du hero cyan du dashboard)
   Jour + date + fenêtre horaire optimale
   Score en grand + espèce top + coeff + vent dominant
   Si aucun jour ≥ 65 : "Conditions difficiles cette semaine" (fond orange)

② WeekView — Liste 7 jours interactive
   Par ligne : abréviation jour + numéro du jour + score coloré
                mini-barre largeur proportionnelle à la fenêtre optimale + horaire
                coeff + vent dominant + espèce top
   Aujourd'hui surligné (bordure cyan)
   Meilleur jour marqué ⭐ + fond vert sombre
   Jours avec vent > 25 nœuds : badge ⚠️
   Tap sur un jour → affiche `DayDetail` pour ce jour (inline en dessous)
   Tap sur le même jour → ferme le détail

③ DayDetail — Détail inline du jour sélectionné
   Mini timeline fenêtres horaires (même style que FishingWindows, 1 espèce)
   3 pills : Coeff / Vent / Heure de fenêtre optimale
   Espèce recommandée du jour + leurre top
```

---

### Hook `useWeekForecasts`

**Fichier :** `src/hooks/useWeekForecasts.ts`

Encapsule la logique actuellement dans `page.tsx` (lignes 98–126) :
- Appel `fetchWeatherData()` si non disponible
- 7 `calculateCoefficientForDate()` en parallèle
- `getTopSpeciesForConditions()` par jour
- Retourne `{ forecasts: DayForecast[] | null, loading: boolean, error: boolean }`

**Utilisé par :** `page.tsx` (remplace le code inline) et `semaine/page.tsx`.

**Comportement si l'utilisateur arrive directement sur `/semaine` :** le hook déclenche son propre fetch — pas de dépendance à l'état du dashboard.

---

### Fonction `getBestWindow`

**Fichier :** `src/lib/scoring/fishing-windows.ts`

Extrait la logique du `useMemo` de `FishingWindows.tsx` (calcul de `bestWindow`) :

```typescript
export function getBestWindow(
  topSpecies: SpeciesResult[],
  tideData: TideData,
  weatherData: WeatherData,
  solunarData: SolunarData,
  date: Date
): BestWindow | null
```

**Utilisé par :** `FishingWindows.tsx` (inchangé visuellement) et `DayHero.tsx`.

---

## Contraintes & non-régression

- **Zéro nouvelle API externe** — tout est calculé localement ou réutilise les données existantes
- **Pas de changement de logique métier** — seul l'affichage et la navigation sont modifiés
- **Pages Carte, Espèces, Journal inchangées** — aucune modification dans ces dossiers
- **Page `/reglages` inchangée** — seul son point d'accès change (header → icône ⚙️)
- **TypeScript strict** — pas de `any`, types existants réutilisés
- **Mobile-first** — touch targets ≥ 44px, tooltips touch-friendly, pas de scroll horizontal
- **`WeekForecast.tsx`** supprimé — `WeekView.tsx` le remplace entièrement. Vérifier qu'aucun autre fichier n'importe `WeekForecast` avant suppression.

---

## Ce qui N'est PAS dans ce scope

- Refonte des pages Carte, Espèces, Journal
- Nouvelles sources de données ou nouvelles API
- Système de notifications push
- Améliorations PWA / service worker
- Authentification / gestion du profil utilisateur
- Filtrage par espèce dans la vue Semaine
