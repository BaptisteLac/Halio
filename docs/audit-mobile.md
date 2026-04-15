# Audit mobile — Halioapp PWA

**Date** : 2026-04-15  
**Méthode** : Analyse statique du code + Playwright runtime (iPhone 14 Pro, 393×852px, isMobile, hasTouch)  
**Scope** : Navigation smartphone, WCAG 2.1 AA, PWA iOS

---

## ✅ Corrigé

| ID | Description | Commit |
|----|-------------|--------|
| UX-18 | Contrastes WCAG 2.1 AA — `text-slate-500` → `text-slate-400` sur 26 fichiers | b89947be |
| M-01 | `BottomNav` : `pb-[env(safe-area-inset-bottom)]` ajouté | — |
| M-02 | `viewport-fit: 'cover'` ajouté dans `app/layout.tsx` | — |
| M-19 | `BottomNav` ajouté dans `not-found.tsx` et `error.tsx` | — |
| M-20 | `-webkit-tap-highlight-color: transparent` dans `globals.css` | — |
| M-04 | `min-h-screen` → `min-h-dvh` dans `CoachClient`, `max-h-[80vh]` → `max-h-[80dvh]` dans `CatchForm` | — |
| M-05 | Filtres zone `/carte` : `py-1.5` → `min-h-[44px]` | — |
| M-06 | Toggle "En saison"/"Toutes" : `py-1` → `min-h-[44px]` | — |
| M-07 | "Mot de passe oublié ?" : `py-3` ajouté + contraste `text-slate-400` | — |
| M-08 | "Pas encore de compte ?" : `py-3` ajouté | — |
| M-10 | `inputMode="decimal"` sur inputs taille/poids dans `CatchForm` | — |
| M-03 | Bottom sheets `CatchForm` + `SpotDetail` : `bottom-14` → `bottom-[calc(3.5rem+env(safe-area-inset-bottom))]` | — |
| M-13 | `SpotDetail` : `overscroll-contain` + `max-h-[65dvh]` | — |
| M-14 | `CatchForm` : `overscroll-contain` | — |
| M-18 | `PWAInstallPrompt` : `bottom-14` → `bottom-[calc(3.5rem+env(safe-area-inset-bottom))]` | — |
| M-09 | Non-issue : les Links BottomNav ont déjà `min-h-[56px]` — Playwright mesurait le SVG, pas la zone de tap | — |
| M-12 | `onFocus` + `scrollIntoView` sur l'input du coach | — |
| M-15 | `touch-pan-y` sur les containers scroll principaux (Coach, Espèces) | — |
| M-16 | `text-[10px]` → `text-xs` sur 12 fichiers (28 occurrences) — minimum 12px | — |
| M-17 | Idem (couvert par M-16) | — |

---

## Backlog actif

### Bloc 1 — Safe area & viewport (critique)

| ID | Sévérité | Constat | Fichier(s) |
|----|----------|---------|------------|
| ~~M-01~~ | ✅ | ~~`BottomNav` en `fixed bottom-0` sans `pb-[env(safe-area-inset-bottom)]`~~ | — |
| ~~M-02~~ | ✅ | ~~Viewport sans `viewportFit: 'cover'`~~ | — |
| M-03 | 🟠 Majeur | Bottom sheets (`CatchForm`, `SpotDetail`) positionnés à `bottom-14` sans compensation safe area | `CatchForm.tsx`, `SpotDetail.tsx` |
| M-04 | 🟠 Majeur | `min-h-screen` / `max-h-[80vh]` au lieu de `dvh` — l'URL bar Safari fait "sauter" les layouts | `CoachClient.tsx`, `CatchForm.tsx` |

Playwright confirmé : `navBottom=0px` sur toutes les pages testées.

### Bloc 2 — Tap targets trop petits

| ID | Sévérité | Élément | Taille mesurée | Cible |
|----|----------|---------|---------------|-------|
| M-05 | 🟠 Majeur | Filtres zone `/carte` (8 pills) | h=30px | 44px |
| M-06 | 🟠 Majeur | Toggle "En saison"/"Toutes" `/especes` | h=24px | 44px |
| M-07 | 🔴 Critique | "Mot de passe oublié ?" | h=16px | 44px |
| M-08 | 🔴 Critique | "Pas encore de compte ?" | h=20px | 44px |
| M-09 | 🟡 Mineur | Icônes BottomNav | 22–26px | 44px (zone de tap) |

### Bloc 3 — Saisie clavier mobile

| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| M-10 | 🟠 Majeur | `type="number"` sans `inputMode="decimal"` → clavier QWERTY au lieu du pavé numérique sur iOS | `CatchForm.tsx` |
| M-11 | 🟡 Mineur | 3 `<select>` natifs (espèce/spot/technique) → rendu iOS minimal, non stylisable | `CatchForm.tsx` |
| M-12 | 🟡 Mineur | Input coach sans `scroll-into-view` au focus → clavier couvre le champ | `CoachClient.tsx` |

### Bloc 4 — Scroll & overscroll

| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| M-13 | 🟠 Majeur | `SpotDetail` bottom sheet sans `overscroll-contain` → scroll déborde sur la carte | `SpotDetail.tsx` |
| M-14 | 🟠 Majeur | `CatchForm` bottom sheet sans `overscroll-contain` → même problème | `CatchForm.tsx` |
| M-15 | 🟡 Mineur | Pas de `touch-action: pan-y` sur les listes longues (journal, espèces) | `globals.css` |

### Bloc 5 — Typographie & lisibilité

| ID | Sévérité | Constat | Source |
|----|----------|---------|--------|
| M-16 | 🟠 Majeur | 25 éléments < 11px sur Dashboard — minimum mesuré 9px (labels timeline FishingWindows) | Playwright |
| M-17 | 🟠 Majeur | 45 éléments < 11px sur `/especes`, 23 sur `/semaine` — badges, sous-labels en `text-[10px]` | Playwright |

### Bloc 6 — UX & navigation

| ID | Sévérité | Constat | Source |
|----|----------|---------|--------|
| M-18 | 🟠 Majeur | `PWAInstallPrompt` sans `env(safe-area-inset-bottom)` → chevauche le contenu sur iPhone X+ | Screenshots Playwright |
| ~~M-19~~ | ✅ | ~~`BottomNav` absent de la page 404~~ | — |
| ~~M-20~~ | ✅ | ~~Pas de `-webkit-tap-highlight-color: transparent`~~ | — |

---

## Plan de correction

### Priorité 1 — Bloquant (M-01, M-02, M-19, M-20)
- `viewport-fit=cover` dans `app/layout.tsx`
- `pb-[env(safe-area-inset-bottom)]` sur BottomNav
- Ajouter BottomNav dans `not-found.tsx`
- `-webkit-tap-highlight-color: transparent` dans `globals.css`

### Priorité 2 — UX dégradée (M-04, M-05, M-06, M-07, M-08, M-10)
- `min-h-dvh` / `max-h-[80dvh]` dans les overlays
- Pills filtres → `min-h-[44px]`
- Auth links → zone de tap agrandie
- `inputMode="decimal"` sur inputs numériques

### Priorité 3 — Confort (M-03, M-13, M-14, M-18)
- Bottom sheets → compensation safe area + `overscroll-contain`
- Safe area sur `PWAInstallPrompt`

### Priorité 4 — Nice-to-have (M-09, M-11, M-12, M-15, M-16, M-17)
- Zone de tap 44px sur icônes BottomNav
- Remplacer `<select>` par bottom sheets custom
- `scrollIntoView` au focus dans CoachClient
- Revoir `text-[10px]` → `text-xs` minimum
