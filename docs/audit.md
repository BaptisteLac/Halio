# Audit Halio PWA — Avril 2026

**Méthode** : Analyse statique + Playwright runtime (iPhone 14 Pro, 393×852px) + lecture code source  
**Scope** : Mobile, WCAG 2.1 AA, PWA iOS, bugs techniques, configuration, UX

---

## ✅ Corrigé

| ID | Description |
|----|-------------|
| UX-18 | `text-slate-500/600` → `text-slate-400` WCAG AA (26 fichiers) |
| UX-17 | `text-[10px]` → `text-xs` (12 fichiers, 28 occurrences) |
| M-01 | `BottomNav` : `pb-[env(safe-area-inset-bottom)]` |
| M-02 | `viewport-fit: 'cover'` dans `app/layout.tsx` |
| M-03 | Bottom sheets : `bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]` |
| M-04 | `min-h-screen` → `min-h-dvh` (7 fichiers) ; `max-h-[80vh]` → `max-h-[80dvh]` |
| M-05 | Filtres zone `/carte` : `min-h-[44px]` |
| M-06 | Toggle "En saison"/"Toutes" : `min-h-[44px]` |
| M-07 | "Mot de passe oublié ?" : `py-3` + `text-slate-400` |
| M-08 | "Pas encore de compte ?" : `py-3` |
| M-10 | `inputMode="decimal"` sur inputs taille/poids |
| M-11 | Selects `appearance-none` + chevron custom (espèce, spot, technique) |
| M-12 | `onFocus` → `scrollIntoView` sur l'input coach |
| M-13 | `SpotDetail` : `overscroll-contain` + `max-h-[65dvh]` |
| M-14 | `CatchForm` : `overscroll-contain` |
| M-15 | `touch-pan-y` sur les containers scroll principaux |
| M-18 | `PWAInstallPrompt` : `bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]` |
| M-19 | `BottomNav` ajouté dans `not-found.tsx` et `error.tsx` (CF-13, CF-14) |
| M-20 | `-webkit-tap-highlight-color: transparent` dans `globals.css` |
| BT-01 | Recharts `width/height=-1` → `debounce={50}` sur `ResponsiveContainer` |
| BT-02 | BottomNav cassée dans l'état d'erreur Coach — layout `min-h-dvh flex flex-col` |
| BT-04 | Marqueurs carte — `scoreMap` correctement indexé par `spot.id` (vérifié) |
| BT-05 | `overallScore` / `topSpecies` enveloppés dans `useMemo` |
| BT-06 | `loadError` silencieux si météo échoue — `Promise.allSettled` en place |
| BT-07 | `getSolunarData(now)` sans affectation supprimé dans `JournalClient` |
| BT-08 | `fetchCatches` avec `.eq('user_id', user.id)` explicite (vérifié) |
| BT-11 | `saveAll` dans préférences : `try/finally` ajouté |
| BT-14 | "Changer mot de passe" masqué pour comptes Google (`app_metadata.provider`) |
| CF-01 | Nom unifié : "Halio" / "Halioapp" partout (SW, Coach, install prompt, emails…) |
| CF-02 | `metadataBase: new URL('https://halioapp.com')` en place (vérifié) |
| CF-06 | `userScalable: false` absent du viewport (vérifié) |
| CF-07 | `/semaine`, `/coach`, `/moi` dans `STATIC_ASSETS` du SW (vérifié) |
| CF-08 | `CACHE_VERSION` passée à `v3` lors du renommage des caches |
| CF-09 | Header `X-XSS-Protection` absent de `next.config.ts` (vérifié) |
| CF-10 | `Permissions-Policy: geolocation=(self)` en place (vérifié) |
| CF-13 | Page 404 personnalisée (`not-found.tsx`) créée |
| CF-14 | Error boundary global (`error.tsx`) créé |
| CF-15 | `appleWebApp.title` aligné sur le nom définitif "Halioapp" |
| UX-11 | `FishingScoreCard` : `cursor-pointer hover:bg-slate-800/80 active:scale-[0.99]` |

---

## 🟡 Priorité 3 — Améliorations souhaitables

| ID | Description | Fichier |
|----|-------------|---------|
| BT-03 | Edge case "meilleure fenêtre" `undefined` non géré — afficher un fallback "Conditions difficiles" | `SemaineClient.tsx` |
| BT-09 | Slider score min notifications non sauvegardé via clavier (ajouter `onKeyUp`) | `notifications/page.tsx` |
| BT-10 | Export CSV silencieux si aucune prise — afficher un message | `compte/page.tsx` |
| BT-12 | `DayHero` affiche `lures[0]` statique au lieu du leurre optimal pour les conditions | `DayHero.tsx` |
| CF-03 | Titres de pages statiques — chaque page devrait avoir son propre `export const metadata` | Toutes les pages |
| CF-04 | Manifest PWA incomplet — `screenshots` manquants (requis pour install prompt enrichi Android) | `manifest.json` |
| UX-03 | Label "Score min" orphelin sur la carte — afficher la valeur active (`Score min : 60`) | `CarteClient.tsx` |
| UX-06 | Confusion lever soleil / lever lune dans `SolunarIndicator` compact — labelliser explicitement | `SolunarIndicator.tsx` |
| UX-09 | Spacer BottomNav incohérent (`pb-20` vs `pb-16` vs `pb-24` selon les pages) — standardiser | Diverses pages |
| UX-22 | `TideCurve` tronquée sur certains viewports — ajuster les marges du graphique | `TideCurve.tsx` |
| UX-24 | Terminologie opaque — ajouter des tooltips sur "coefficient" et "score" | Dashboard, Semaine |
| UX-25 | Journal — empty state sans CTA — concevoir un état vide avec bouton "Première prise" | `JournalClient.tsx` |
| UX-27 | Notifications push — UI présente mais non implémentée (pas de VAPID) — masquer ou implémenter | `notifications/page.tsx` |
| UX-28 | Pas de confirmation avant déconnexion — risque fat finger | `compte/page.tsx` |

---

## ⚪ Priorité 4 — Nice-to-have / Polish

| ID | Description | Fichier |
|----|-------------|---------|
| BT-13 | Décalage temporel théorique entre données async — capturer `now` avant les appels | `DashboardClient.tsx` |
| CF-05 | `og:url` hardcodée — utiliser `metadataBase` pour les URLs relatives | `layout.tsx` |
| CF-11 | CSP présente mais à durcir (actuellement `unsafe-inline`) | `next.config.ts` |
| CF-12 | HSTS présent — vérifier si Vercel l'ajoute en double | `next.config.ts` |
| UX-01 | Score affiché deux fois sur le dashboard (DayHero + FishingScoreCard) | `DashboardClient.tsx` |
| UX-02 | Ordre composants dashboard sous-optimal — FishingScoreCard avant FishingWindows | `DashboardClient.tsx` |
| UX-04 | Incohérence violet (Coach) / cyan (reste) — décision design à prendre | Global |
| UX-05 | Détails météo complets jamais accessibles (mode full de WeatherCard inutilisé) | `WeatherCard.tsx` |
| UX-07 | Absence de légende pour les fenêtres de pêche | `FishingWindows.tsx` |
| UX-08 | Espacements non uniformes entre composants (`space-y-4` vs `gap-3` vs `gap-4`) | Dashboard |
| UX-10 | Padding horizontal variable (`px-3` vs `px-4` vs `px-5`) | Diverses pages |
| UX-12 | `SpotMarker` sans état hover desktop | `SpotMarker.tsx` |
| UX-13 | Texte "Tap" inadapté sur desktop | `FishingScoreCard.tsx` |
| UX-14 | Pas de transitions entre pages (View Transitions API) | `layout.tsx` |
| UX-15 | Animations expand/collapse absentes | Composants conditionnels |
| UX-16 | `SpotDetail` — vérifier que `transition-transform` est suffisant | `SpotDetail.tsx` |
| UX-19 | Pages vides pour non-authentifiés (Coach, Moi) — envisager un "locked preview" | `CoachClient.tsx`, `MoiClient.tsx` |
| UX-20 | Vides verticaux excessifs sur grands mobiles (iPhone Pro Max, desktop) | `/semaine`, `/especes` |
| UX-21 | `SpotDetail` trop dense — retravailler la hiérarchie visuelle | `SpotDetail.tsx` |
| UX-23 | Zéro onboarding — 2-3 écrans d'introduction ou tooltips contextuels | Global |
| UX-26 | Pas d'affordance sur les marqueurs carte (pulsation, tooltip "Tap pour les détails") | `SpotMarker.tsx` |
| UX-29 | Skeletons par composant absents (flash de contenu au chargement) | Dashboard |
| UX-30 | Score du jour absent des fiches espèces | `especes/[slug]/page.tsx` |
| UX-31 | Cartes semaine trop compactes sur iPhone SE (375px) | `SemaineClient.tsx` |
| UX-32 | Absence de feedback haptic (`navigator.vibrate`) sur actions clés | Global |
