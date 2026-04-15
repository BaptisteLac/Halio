# Audit mobile — Halioapp PWA

**Date** : 2026-04-15  
**Méthode** : Analyse statique du code + Playwright runtime (iPhone 14 Pro, 393×852px, isMobile, hasTouch)  
**Scope** : Navigation smartphone, WCAG 2.1 AA, PWA iOS

Voir aussi : [`AUDIT.md`](../AUDIT.md) — audit général 61 findings (BT/CF/UX).

---

## ✅ Tout corrigé (commits 0f3bfff6 → fb7178c5)

| ID | Description | Recoupe AUDIT.md |
|----|-------------|-----------------|
| UX-18 | `text-slate-500` → `text-slate-400` WCAG AA sur 26 fichiers | UX-18 ✓ |
| UX-18bis | `text-slate-600` → `text-slate-400` sur textes lisibles (FishingScoreCard, FishingWindows, preferences, compte, notifications, DayDetail) | UX-18 ✓ |
| M-01 | `BottomNav` : `pb-[env(safe-area-inset-bottom)]` | — |
| M-02 | `viewport-fit: 'cover'` dans `app/layout.tsx` | — |
| M-03 | Bottom sheets : `bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]` | — |
| M-04 | `min-h-screen` → `min-h-dvh` sur 7 fichiers ; `max-h-[80vh]` → `max-h-[80dvh]` | — |
| M-05 | Filtres zone `/carte` : `min-h-[44px]` | — |
| M-06 | Toggle "En saison"/"Toutes" : `min-h-[44px]` | — |
| M-07 | "Mot de passe oublié ?" : `py-3` + `text-slate-400` | — |
| M-08 | "Pas encore de compte ?" : `py-3` | — |
| M-09 | Non-issue — Links BottomNav déjà `min-h-[56px]` | — |
| M-10 | `inputMode="decimal"` sur inputs taille/poids | — |
| M-11 | Selects `appearance-none` + chevron custom (espèce, spot, technique) | — |
| M-12 | `onFocus` → `scrollIntoView` sur l'input coach | — |
| M-13 | `SpotDetail` : `overscroll-contain` + `max-h-[65dvh]` | — |
| M-14 | `CatchForm` : `overscroll-contain` | — |
| M-15 | `touch-pan-y` sur les containers scroll principaux | — |
| M-16/17 | `text-[10px]` → `text-xs` sur 12 fichiers (28 occurrences) | UX-17 ✓ |
| M-18 | `PWAInstallPrompt` : `bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]` | — |
| M-19 | `BottomNav` ajouté dans `not-found.tsx` et `error.tsx` | CF-13 ✓, CF-14 ✓ |
| M-20 | `-webkit-tap-highlight-color: transparent` dans `globals.css` | — |

---

## 🔴 Priorité 1 — Bloquant (AUDIT.md)

| ID | Description | Fichier |
|----|-------------|---------|
| BT-02 | BottomNav cassée dans l'état d'erreur Coach — le `loadError` retourne un div flex-centré qui inclut la nav, pas un layout fixe | `CoachClient.tsx` |
| BT-06 | `loadError` silencieux si la météo seule échoue — contexte reste `null`, spinner infini | `CoachClient.tsx` |
| BT-08 | `fetchCatches` sans `.eq('user_id', user.id)` explicite — repose uniquement sur RLS | `JournalClient.tsx` |
| CF-01 | Nom incohérent : `layout.tsx` dit "Halioapp", `manifest.json` dit "PêcheBoard" | `layout.tsx`, `manifest.json` |
| CF-06 | `userScalable: false` absent du viewport actuel — à vérifier qu'il n'a pas été réintroduit | `layout.tsx` |

---

## 🟠 Priorité 2 — Important (AUDIT.md)

| ID | Description | Fichier |
|----|-------------|---------|
| BT-01 | Recharts `width/height=-1` warning — `-mx-1` sur le wrapper de `TideCurve` | `TideCurve.tsx` |
| BT-04 | Marqueurs carte affichent potentiellement le même score — vérifier indexation `scoreMap.get(spot.id)` | `CarteClient.tsx` |
| BT-05 | `overallScore` recalculé sans `useMemo` à chaque render | `DashboardClient.tsx` |
| BT-11 | `saveAll` sans `try/catch` dans préférences — erreurs silencieuses | `preferences/page.tsx` |
| BT-14 | Section "Changer mot de passe" affichée aux comptes Google OAuth | `compte/page.tsx` |
| CF-07 | `/semaine`, `/coach`, `/moi` absents du précache Service Worker | `sw.js` |
| UX-11 | `FishingScoreCard` sans `cursor-pointer` ni `hover:`/`active:` | `FishingScoreCard.tsx` |

---

## 🟡 Priorité 3 — Améliorations souhaitables (AUDIT.md)

| ID | Description |
|----|-------------|
| BT-03 | Edge case "meilleure fenêtre" undefined non géré sur `/semaine` |
| BT-07 | Dead state `solunarData` inutilisé dans `journal/page.tsx` |
| BT-09 | Slider notifications non sauvegardé via clavier (flèches) |
| BT-10 | Export CSV silencieux si aucune prise |
| BT-12 | `DayHero` affiche `lures[0]` statique au lieu du leurre optimal |
| CF-03 | Titres de pages statiques (SEO, onglets) |
| CF-04 | Manifest PWA incomplet (`scope`, `id`, `screenshots`) |
| CF-08 | `CACHE_VERSION = 'v1'` hardcodée dans le SW |
| CF-09 | Header `X-XSS-Protection` déprécié dans `next.config.ts` |
| CF-10 | `Permissions-Policy: geolocation=()` bloque l'API geo — changer en `geolocation=(self)` |
| CF-15 | `appleWebApp.title: 'Halioapp'` ≠ nom définitif |
| UX-03 | Label "Score min" orphelin sur la carte |
| UX-06 | Confusion lever soleil / lever lune dans `SolunarIndicator` compact |
| UX-09 | Spacer BottomNav incohérent (`pb-20` vs `pb-16` selon les pages) |
| UX-22 | `TideCurve` tronquée sur certains viewports |
| UX-24 | Terminologie opaque — coefficient et score sans explication |
| UX-25 | Journal — empty state sans CTA pour la première prise |
| UX-27 | Notifications UI sans implémentation push réelle (VAPID, SW push) |
| UX-28 | Pas de confirmation avant déconnexion |

---

## ⚪ Priorité 4 — Nice-to-have / Polish (AUDIT.md)

| ID | Description |
|----|-------------|
| BT-13 | Décalage temporel théorique entre données asynchrones |
| CF-05 | `og:url` hardcodée |
| CF-11 | Absence de CSP |
| CF-12 | Absence de HSTS (Vercel l'ajoute en prod — vérifier) |
| UX-01 | Score affiché deux fois sur le dashboard |
| UX-02 | Ordre composants dashboard sous-optimal |
| UX-04 | Incohérence violet (Coach) / cyan (reste) — décision design à prendre |
| UX-05 | Détails météo complets jamais accessibles |
| UX-07 | Absence de légende pour les fenêtres de pêche |
| UX-08 | Espacements non uniformes entre composants |
| UX-10 | Padding horizontal variable (`px-3` vs `px-4` vs `px-5`) |
| UX-12 | `SpotMarker` sans état hover desktop |
| UX-13 | Texte "Tap" inadapté sur desktop |
| UX-14 | Pas de transitions entre pages (View Transitions API) |
| UX-15 | Animations expand/collapse absentes |
| UX-16 | `SpotDetail` déjà animé (`transition-transform`) — vérifier suffisant |
| UX-19 | Pages vides pour non-authentifiés (Coach, Moi) |
| UX-20 | Vides verticaux sur grands mobiles |
| UX-21 | `SpotDetail` trop dense — hiérarchie à retravailler |
| UX-23 | Zéro onboarding |
| UX-26 | Pas d'affordance sur les marqueurs carte |
| UX-29 | Skeletons par composant absents |
| UX-30 | Score du jour absent des fiches espèces |
| UX-31 | Cartes semaine trop compactes sur iPhone SE |
| UX-32 | Absence de feedback haptic (`navigator.vibrate`) |
