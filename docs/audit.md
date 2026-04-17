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
| BT-03 | `SemaineClient.tsx` : fallback "Conditions difficiles" si `bestDay` null |
| BT-09 | `NotificationsClient.tsx` : `onKeyUp` ajouté sur le slider de score |
| BT-10 | `CompteClient.tsx` : message "Aucune prise à exporter" si journal vide |
| BT-12 | `DayHero.tsx` : leurre trié par priority ascendant (intent explicite) |
| CF-03 | Metadata par page : `preferences`, `notifications`, `compte` scindés en server wrapper + client |
| CF-04 | Manifest : champ `screenshots` ajouté — images PNG à placer dans `/public/screenshots/` |
| UX-03 | `CarteClient.tsx` : label dynamique "Score min : N" quand filtre actif |
| UX-06 | `SolunarIndicator.tsx` compact : ☀️/🌙 labellisés explicitement |
| UX-09 | Standardisation `pb-20` sur toutes les pages `moi/*` |
| UX-22 | `TideCurve.tsx` : marges ajustées (`right: 8`, `left: -20`, `bottom: 4`) |
| UX-24 | `CoefficientBadge` : `title` attribut ; `FishingScoreCard` : sous-titre "Composite : marées · vent · lune" |
| UX-25 | `JournalClient.tsx` : empty state avec bouton "Première prise" |
| UX-27 | `NotificationsClient.tsx` : section push masquée — "fonctionnalité à venir" |
| UX-28 | `CompteClient.tsx` : confirmation déconnexion avant signOut |

---

## 🟡 Priorité 3 — Améliorations souhaitables

*(Toutes soldées — voir section ✅)*

---

## ⚪ Priorité 4 — Nice-to-have / Polish

### ✅ Soldés

| ID | Résolution |
|----|-----------|
| BT-13 | Déjà fait — `fetchDate` capturé avant les appels async |
| CF-05 | Déjà fait — `og:url: '/'` relatif + `metadataBase` en place |
| CF-12 | HSTS retiré de `next.config.ts` — Vercel l'ajoute nativement |
| UX-01 | `MiniGauge` supprimée de `DayHero` — score unique dans `FishingScoreCard` |
| UX-02 | `FishingScoreCard` repositionné avant `FishingWindows` |
| UX-07 | Légende couleurs ajoutée dans `FishingWindows` |
| UX-12 | `SpotMarker` : `hover:scale-110` desktop |
| UX-13 | "Tap" → "Appuyer" dans `FishingScoreCard` |
| UX-16 | Déjà correct — `transition-transform duration-300` suffisant |
| UX-21 | `SpotDetail` : score + top espèces côte à côte, info grid 14px |
| UX-26 | Animation `marker-pulse` sur marqueurs non sélectionnés |
| UX-30 | Déjà fait — `ScoreBlock` présent dans `especes/[slug]/page.tsx` |

### 🔲 Restants (décisions produit ou scope important)

| ID | Description | Note |
|----|-------------|------|
| CF-04 | Screenshots manifest Android | Assets PNG à créer dans `/public/screenshots/` |
| CF-11 | CSP `unsafe-inline` — durcissement | Nécessite un système de nonce (refonte majeure) |
| UX-04 | Incohérence violet Coach / cyan global | Décision design |
| UX-05 | WeatherCard mode full inaccessible | Rendre le compact cliquable |
| UX-08 | Espacements non uniformes | Audit composant par composant |
| UX-10 | Padding horizontal variable | Audit composant par composant |
| UX-14 | View Transitions API entre pages | Expérimental, risque de régression |
| UX-15 | Animations expand/collapse | Travail transversal |
| UX-19 | Locked preview non-authentifiés | Nécessite maquette |
| UX-20 | Vides verticaux grands mobiles/desktop | Layout responsive étendu |
| UX-23 | Onboarding | Feature à part entière |
| UX-29 | Skeletons par composant | Travail transversal |
| UX-31 | Cartes semaine trop compactes iPhone SE | Edge case 375px |
| UX-32 | Feedback haptic | Nice-to-have |
