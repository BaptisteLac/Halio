# Audit mobile — Halioapp PWA

**Date** : 2026-04-15  
**Méthode** : Analyse statique du code + Playwright runtime (iPhone 14 Pro, 393×852px, isMobile, hasTouch)  
**Scope** : Navigation smartphone, WCAG 2.1 AA, PWA iOS

---

## ✅ Tout corrigé (commits 0f3bfff6 → 57402283)

| ID | Description |
|----|-------------|
| UX-18 | Contrastes WCAG 2.1 AA — `text-slate-500` → `text-slate-400` sur 26 fichiers |
| M-01 | `BottomNav` : `pb-[env(safe-area-inset-bottom)]` |
| M-02 | `viewport-fit: 'cover'` dans `app/layout.tsx` |
| M-03 | Bottom sheets : `bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]` |
| M-04 | `min-h-screen` → `min-h-dvh` sur 7 fichiers, `max-h-[80vh]` → `max-h-[80dvh]` |
| M-05 | Filtres zone `/carte` : `min-h-[44px]` |
| M-06 | Toggle "En saison"/"Toutes" : `min-h-[44px]` |
| M-07 | "Mot de passe oublié ?" : `py-3` + `text-slate-400` |
| M-08 | "Pas encore de compte ?" : `py-3` |
| M-09 | Non-issue — Links BottomNav déjà `min-h-[56px]`, Playwright mesurait le SVG |
| M-10 | `inputMode="decimal"` sur inputs taille/poids |
| M-12 | `onFocus` → `scrollIntoView` sur l'input coach |
| M-13 | `SpotDetail` : `overscroll-contain` + `max-h-[65dvh]` |
| M-14 | `CatchForm` : `overscroll-contain` |
| M-15 | `touch-pan-y` sur les containers scroll (Coach, Espèces) |
| M-16/17 | `text-[10px]` → `text-xs` sur 12 fichiers (28 occurrences) |
| M-18 | `PWAInstallPrompt` : `bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]` |
| M-19 | `BottomNav` ajouté dans `not-found.tsx` et `error.tsx` |
| M-20 | `-webkit-tap-highlight-color: transparent` dans `globals.css` |

---

## 🔵 Restant — Nice-to-have

| ID | Sévérité | Constat | Fichier |
|----|----------|---------|---------|
| M-11 | 🟡 Mineur | 3 `<select>` natifs (espèce/spot/technique) → rendu iOS minimal, non stylisable. Remplacer par bottom sheets custom. | `CatchForm.tsx` |

---

## Contrastes résiduels (`text-slate-600` sur texte lisible)

Ces occurrences n'ont pas été traitées car hors scope des blocs 1–4. Elles échouent WCAG AA (~3.5:1 sur slate-950).

| Fichier | Ligne | Contenu |
|---------|-------|---------|
| `FishingScoreCard.tsx` | 109, 126 | `↑↓` toggle label, description facteurs |
| `FishingWindows.tsx` | 173 | Axe temporel (0h, 6h, 12h, 18h, 24h) |
| `notifications/page.tsx` | 211 | Labels slider score (Moyen/Excellent/Max) |
| `preferences/page.tsx` | 154, 170, 186, 216 | Sous-descriptions sections |
| `compte/page.tsx` | 232 | "Sauvegardé automatiquement" |
| `DayDetail.tsx` | 38 | `—` placeholder (probablement décoratif) |
