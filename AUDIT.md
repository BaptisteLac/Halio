# Audit PêcheBoard — Avril 2026

Audit complet en trois volets réalisé par inspection Playwright + lecture du code source.
**61 findings** — BT (bugs techniques), CF (configuration), UX (expérience utilisateur / graphique).

---

## Volet 1 — Bugs Techniques (14)

### BT-01 · Recharts — width/height=-1 warning
**Fichier** : `src/components/dashboard/TideCurve.tsx`  
**Description** : `<div className="h-44 w-full -mx-1">` avec `<ResponsiveContainer>` imbriqué provoque une erreur Recharts "width/height=-1" car le parent a une marge négative qui casse le calcul des dimensions.  
**Impact** : Avertissement console, risque de rendu vide sur certains viewports.  
**Correction** : Retirer le `-mx-1` ou appliquer `overflow: hidden` sur le wrapper, et passer explicitement `width="100%"` à `ResponsiveContainer`.

---

### BT-02 · BottomNav mal positionné dans l'état d'erreur du Coach
**Fichier** : `src/app/coach/page.tsx`  
**Description** : L'état `loadError` retourne un `<div className="flex items-center justify-center">` contenant à la fois le message d'erreur et `<BottomNav />`. La BottomNav est donc centrée verticalement dans la flex, pas fixée en bas.  
**Impact** : La navigation disparaît visuellement du bas de l'écran en cas d'erreur de chargement.  
**Correction** : Structurer comme les autres états (`min-h-screen flex flex-col`) et placer `<BottomNav />` en dehors du conteneur centré.

---

### BT-03 · Semaine — edge case "meilleure fenêtre" inexistant
**Fichier** : `src/app/semaine/page.tsx` (à vérifier)  
**Description** : Le calcul de la meilleure fenêtre de pêche de la journée peut retourner `undefined` si aucun créneau ne dépasse le seuil minimum. L'UI n'anticipe pas ce cas.  
**Impact** : Crash silencieux ou affichage de données `undefined`.  
**Correction** : Ajouter un fallback explicite ("Conditions difficiles aujourd'hui") si aucune fenêtre n'est calculable.

---

### BT-04 · Carte — tous les marqueurs affichent le même score
**Fichier** : `src/app/carte/page.tsx`  
**Description** : `scoreMap` est calculé avec `useMemo` mais la valeur utilisée dans `SpotMarker` n'est pas correctement indexée par `spot.id`, ce qui entraîne l'affichage du même score sur tous les marqueurs.  
**Impact** : Information incorrecte sur la carte — les scores par spot ne sont pas individualisés.  
**Correction** : Vérifier l'indexation `scoreMap[spot.id]` et s'assurer que la clé correspond bien à l'ID du spot.

---

### BT-05 · Dashboard — `overallScore` recalculé à chaque tick de `now`
**Fichier** : `src/app/page.tsx`  
**Description** : `overallScore` est calculé directement dans le corps du composant sans `useMemo`, alors que `now` est mis à jour périodiquement. Cela provoque un recalcul de l'algorithme de score (coûteux) à chaque re-render.  
**Impact** : Performances dégradées, recalculs inutiles.  
**Correction** : Envelopper le calcul dans `useMemo([tideData, weatherData, solunarData])`.

---

### BT-06 · Coach — logique `loadError` incohérente
**Fichier** : `src/app/coach/page.tsx`  
**Description** : Si `tideResult` est rejeté, `setLoadError` est appelé et la fonction retourne immédiatement — mais `weatherResult` n'est pas évalué. Si `weatherResult` est rejeté mais pas `tideResult`, on n'atteint jamais `setCoachContext`. Le contexte reste `null` indéfiniment, bloqué sur `<LoadingCoach />`.  
**Impact** : En cas d'échec météo seul, l'utilisateur voit le spinner à l'infini sans message d'erreur.  
**Correction** : Évaluer les deux résultats indépendamment et afficher un message d'erreur dans tous les cas d'échec.

---

### BT-07 · Journal — état `solunarData` mort (dead state)
**Fichier** : `src/app/journal/page.tsx`  
**Description** : `solunarData` est chargé dans le state de la page mais n'est jamais passé à `CatchForm` ni utilisé ailleurs. `CatchForm` recalcule `getSolunarData(caughtDate)` en interne au moment du submit.  
**Impact** : Calcul redondant, état inutile qui alourdit le composant.  
**Correction** : Supprimer l'état `solunarData` de `journal/page.tsx`.

---

### BT-08 · Journal — `fetchCatches` sans filtre `user_id` explicite
**Fichier** : `src/app/journal/page.tsx`  
**Description** : La requête Supabase pour récupérer les prises ne filtre pas explicitement par `user_id` dans le code client. Elle repose uniquement sur les RLS policies. Si les RLS sont mal configurées ou désactivées en dev, tous les catches sont exposés.  
**Impact** : Risque de fuite de données en environnement de développement ou après une migration Supabase.  
**Correction** : Ajouter `.eq('user_id', user.id)` explicitement même si RLS est actif.

---

### BT-09 · Notifications — slider non sauvegardé au clavier
**Fichier** : `src/app/moi/notifications/page.tsx`  
**Description** : Le slider de rayon de notification sauvegarde uniquement sur `onMouseUp` et `onTouchEnd`. La navigation clavier (flèches) ne déclenche pas de sauvegarde.  
**Impact** : Accessibilité — les utilisateurs navigant au clavier ne peuvent pas sauvegarder leur préférence.  
**Correction** : Ajouter `onKeyUp` ou `onChange` avec debounce pour couvrir la navigation clavier.

---

### BT-10 · Compte — export CSV silencieux si aucune prise
**Fichier** : `src/app/moi/compte/page.tsx`  
**Description** : Le bouton "Exporter en CSV" ne donne aucun retour visuel si l'utilisateur n'a pas de prises. Le fichier généré est vide ou l'action ne se produit pas sans feedback.  
**Impact** : UX confusante — l'utilisateur pense que l'export a échoué.  
**Correction** : Afficher un toast/message "Aucune prise à exporter" si le tableau est vide.

---

### BT-11 · Préférences — erreurs de sauvegarde silencieuses
**Fichier** : `src/app/moi/preferences/page.tsx`  
**Description** : La fonction `saveAll` n'a pas de bloc `catch`. En cas d'erreur Supabase (réseau, RLS, timeout), l'utilisateur voit le bouton repasser en état normal sans savoir que la sauvegarde a échoué.  
**Impact** : Perte silencieuse de préférences utilisateur.  
**Correction** : Envelopper dans `try/catch` et afficher un toast d'erreur.

---

### BT-12 · Dashboard — DayHero affiche le premier leurre, pas l'optimal
**Fichier** : `src/components/dashboard/DayHero.tsx`  
**Description** : La recommandation de leurre affiche `lures[0]` (premier leurre de la liste statique de l'espèce) au lieu du leurre optimal pour les conditions actuelles.  
**Impact** : Conseil potentiellement inapproprié selon les conditions du jour.  
**Correction** : Trier les leurres par score de conditions avant d'afficher `lures[0]`, ou afficher le leurre recommandé par l'algorithme de score.

---

### BT-13 · Score — décalage temporel possible entre données
**Fichier** : `src/app/page.tsx`  
**Description** : Les données météo, marées et solunaires sont chargées de manière asynchrone avec `Promise.allSettled`. Si les requêtes météo et marée arrivent à des instants différents, le score affiché peut être calculé avec un `now` légèrement différent entre les appels.  
**Impact** : Mineur — inconsistance théorique dans le score calculé.  
**Correction** : Capturer `now` une seule fois avant les appels et le passer à toutes les fonctions de calcul.

---

### BT-14 · Compte — changement de mot de passe affiché aux utilisateurs Google SSO
**Fichier** : `src/app/moi/compte/page.tsx`  
**Description** : La section "Changer le mot de passe" est affichée à tous les utilisateurs, y compris ceux connectés via Google OAuth. Ces utilisateurs n'ont pas de mot de passe Supabase.  
**Impact** : Interface confusante, action qui échouera silencieusement ou avec une erreur cryptique.  
**Correction** : Vérifier le `app_metadata.provider` de l'utilisateur et masquer la section pour les comptes OAuth.

---

## Volet 2 — Configuration (15)

### CF-01 · Incohérence du nom de l'application
**Fichiers** : `src/app/layout.tsx`, `public/manifest.json`  
**Description** : `layout.tsx` définit le titre `"Halioapp"` et `appleWebApp.title: "Halioapp"`. `manifest.json` définit `"name": "PêcheBoard"`. Les deux noms coexistent.  
**Impact** : Nom différent selon le point d'entrée (onglet navigateur vs icône installée). Confusion utilisateur.  
**Correction** : Choisir un nom définitif et le synchroniser dans `layout.tsx`, `manifest.json`, et toutes les métadonnées.

---

### CF-02 · `metadataBase` absent
**Fichier** : `src/app/layout.tsx`  
**Description** : La propriété `metadataBase` n'est pas définie dans l'export `metadata`. Next.js utilise `http://localhost:3000` comme fallback, générant un avertissement en build et des URLs Open Graph incorrectes en production.  
**Impact** : Les previews de liens (Slack, Twitter, Facebook) affichent des images cassées.  
**Correction** : Ajouter `metadataBase: new URL('https://votre-domaine.vercel.app')`.

---

### CF-03 · Titres de pages statiques
**Fichiers** : Toutes les pages `app/*/page.tsx`  
**Description** : Toutes les pages partagent le même titre générique défini dans `layout.tsx`. Aucune page ne définit son propre `export const metadata` ou `generateMetadata`.  
**Impact** : SEO nul, onglets tous identiques, pas de contexte dans l'historique du navigateur.  
**Correction** : Ajouter `export const metadata = { title: 'Carte — PêcheBoard' }` dans chaque page.

---

### CF-04 · Manifest PWA incomplet
**Fichier** : `public/manifest.json`  
**Description** : Le manifest est incomplet. Manquent : `scope`, `id` (requis pour "Same App" detection), `categories` (recommandé pour les stores d'apps), `screenshots` (requis pour l'install prompt enrichi sur Android/Chrome).  
**Impact** : Install prompt basique sans aperçu de l'app. Score Lighthouse PWA dégradé.  
**Correction** : Compléter le manifest avec au minimum `scope: "/"`, `id: "/"`, `categories: ["sports", "navigation"]`, et 2 screenshots (mobile portrait).

---

### CF-05 · `og:url` hardcodé
**Fichier** : `src/app/layout.tsx`  
**Description** : La balise `og:url` pointe vers une URL hardcodée plutôt que d'utiliser `metadataBase` + le chemin relatif.  
**Impact** : Toutes les pages partagent la même `og:url`, ce qui est incorrect pour le partage de liens par page.  
**Correction** : Utiliser `metadataBase` et laisser Next.js résoudre les URLs automatiquement.

---

### CF-06 · `userScalable: false` — violation WCAG
**Fichier** : `src/app/layout.tsx`  
**Description** : Le viewport est configuré avec `userScalable: false` (ou `user-scalable=no`), empêchant le zoom utilisateur.  
**Impact** : Violation WCAG 2.1 critère 1.4.4 (Resize text, niveau AA). Inaccessible aux malvoyants.  
**Correction** : Retirer `userScalable: false`. Une PWA bien designée n'a pas besoin de bloquer le zoom.

---

### CF-07 · Service Worker — pages manquantes dans le précache
**Fichier** : `public/sw.js`  
**Description** : `STATIC_ASSETS` précache uniquement `['/', '/carte', '/especes', '/journal']`. Les pages `/semaine`, `/coach`, et `/moi` ne sont pas précachées.  
**Impact** : Ces pages ne sont pas disponibles hors ligne, contrairement aux autres.  
**Correction** : Ajouter `/semaine`, `/coach`, `/moi` à `STATIC_ASSETS`.

---

### CF-08 · Service Worker — version de cache hardcodée
**Fichier** : `public/sw.js`  
**Description** : `CACHE_VERSION = 'v1'` est statique. Après un déploiement, les anciens assets restent en cache jusqu'à ce que l'utilisateur purge manuellement ou que le SW se mette à jour.  
**Impact** : Utilisateurs qui voient une ancienne version de l'app après un déploiement.  
**Correction** : Injecter la version de build dans `CACHE_VERSION` au moment du build (ex: `CACHE_VERSION = 'v__BUILD_ID__'` remplacé par un script de build).

---

### CF-09 · Header `X-XSS-Protection` déprécié
**Fichier** : `next.config.ts`  
**Description** : L'en-tête de sécurité `X-XSS-Protection: 1; mode=block` est inclus dans les headers HTTP. Cet en-tête est déprécié depuis 2019 et retiré de tous les navigateurs modernes.  
**Impact** : Header inutile, potentiellement contre-productif sur d'anciens browsers.  
**Correction** : Retirer `X-XSS-Protection`. La protection XSS est gérée par CSP.

---

### CF-10 · `Permissions-Policy: geolocation=()` bloque l'API geo
**Fichier** : `next.config.ts`  
**Description** : La Permissions-Policy interdit la géolocalisation sur toute l'app. Or, la carte (`/carte`) ou une future feature pourrait nécessiter la position de l'utilisateur pour centrer la carte.  
**Impact** : L'API `navigator.geolocation` est bloquée sur toute l'app sans possibilité de demander la permission.  
**Correction** : Changer en `geolocation=(self)` pour autoriser la géolocalisation dans le même origine.

---

### CF-11 · Absence de Content Security Policy (CSP)
**Fichier** : `next.config.ts`  
**Description** : Aucun header `Content-Security-Policy` n'est défini.  
**Impact** : Risque XSS, injection de scripts tiers, clickjacking non mitigé.  
**Correction** : Ajouter une CSP stricte adaptée aux domaines utilisés (Supabase, Open-Meteo, tiles.openfreemap.org, Vercel Analytics).

---

### CF-12 · Absence de HSTS
**Fichier** : `next.config.ts`  
**Description** : L'en-tête `Strict-Transport-Security` n'est pas défini.  
**Impact** : Sans HSTS, le navigateur peut tenter une connexion HTTP initiale avant la redirection HTTPS.  
**Correction** : Ajouter `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.  
**Note** : Vercel ajoute HSTS automatiquement en production — à vérifier si redondant.

---

### CF-13 · Absence de page 404 personnalisée
**Fichier** : `src/app/not-found.tsx` (inexistant)  
**Description** : Next.js affiche sa page 404 par défaut (thème clair, générique) quand une route est introuvable. Ex: `/auth` retourne un 404 brut.  
**Impact** : Rupture totale du thème sombre. Expérience dégradée.  
**Correction** : Créer `src/app/not-found.tsx` avec le design PêcheBoard et un lien de retour à l'accueil.

---

### CF-14 · Absence d'Error Boundary global
**Fichier** : `src/app/error.tsx` (inexistant)  
**Description** : Aucun `error.tsx` ni `global-error.tsx` n'est défini dans le App Router. Une erreur non catchée dans un composant client fait crasher toute la page avec l'écran d'erreur Next.js par défaut.  
**Impact** : Expérience catastrophique en cas d'erreur inattendue.  
**Correction** : Créer `src/app/error.tsx` et `src/app/global-error.tsx` avec un fallback cohérent avec le design.

---

### CF-15 · `appleWebApp.title` incohérent
**Fichier** : `src/app/layout.tsx`  
**Description** : `appleWebApp.title` est défini à `"Halioapp"` alors que le manifest dit `"PêcheBoard"`. Sur iOS, l'icône d'écran d'accueil affiche le titre du `appleWebApp.title`.  
**Impact** : Sur iPhone/iPad, l'app installée s'appelle "Halioapp" à l'écran d'accueil.  
**Correction** : Aligner avec le nom définitif choisi pour CF-01.

---

## Volet 3 — UX / Cohérence Graphique (32)

### UX-01 · Score affiché deux fois sur le Dashboard
**Fichier** : `src/app/page.tsx`  
**Description** : Le score de pêche apparaît dans `DayHero` (grand gauge) ET dans `FishingScoreCard` qui suit immédiatement. L'utilisateur voit la même métrique répétée en scrollant à peine.  
**Impact** : Redondance visuelle, dilution de l'information principale.  
**Correction** : Retirer le score de `FishingScoreCard` si `DayHero` l'affiche déjà, ou restructurer l'ordre des composants.

---

### UX-02 · Ordre des informations sous-optimal sur le Dashboard
**Fichier** : `src/app/page.tsx`  
**Description** : L'ordre actuel est DayHero → FishingWindows → FishingScoreCard. Le score global (FishingScoreCard) devrait précéder les détails (FishingWindows) pour répondre d'abord à la question "Est-ce que je pars pêcher ?" avant "À quelle heure ?".  
**Impact** : Hiérarchie d'information inversée par rapport au flow décisionnel du pêcheur.  
**Correction** : Réordonner : DayHero (score + conditions) → FishingScoreCard → FishingWindows.

---

### UX-03 · Label "Score min" orphelin sur la carte
**Fichier** : `src/app/carte/page.tsx`  
**Description** : Le filtre "Score min" (slider) est affiché sans label visible ou avec un label mal positionné par rapport au slider, créant une association visuelle peu claire.  
**Impact** : L'utilisateur ne comprend pas immédiatement à quoi correspond la valeur du slider.  
**Correction** : Afficher le label et la valeur actuelle ensemble, sous forme `Score min : 65`.

---

### UX-04 · Incohérence violet/cyan dans la navigation et les CTAs
**Fichiers** : `src/components/layout/BottomNav.tsx`, `src/app/coach/page.tsx`  
**Description** : L'onglet Coach utilise `text-violet-400` (actif) alors que tous les autres onglets utilisent `text-cyan-400`. De même, `UnauthenticatedCoach` utilise un bouton `bg-violet-600` alors que les autres CTAs de l'app sont `bg-cyan-*`.  
**Impact** : Deux systèmes de couleur en compétition. Le violet est thématiquement cohérent pour le Coach mais crée une rupture dans le système de design.  
**Correction** : Décider d'une règle : soit le violet est exclusif au Coach (et tous ses éléments sont violets), soit on unifie sur le cyan. La première option est plus défendable narrativement.

---

### UX-05 · Détails météo masqués sans accès possible
**Fichier** : `src/components/dashboard/WeatherCard.tsx`  
**Description** : Le mode compact (utilisé sur le dashboard) affiche seulement vent/température/pression/houle. Les informations précipitations, nébulosité et ressentie sont dans le mode "full" mais ce mode n'est jamais activé sur aucune page.  
**Impact** : Données collectées et calculées mais jamais affichées. Opportunité manquée.  
**Correction** : Ajouter un "Voir plus" expandable sur la WeatherCard, ou afficher le mode full sur une page dédiée (ex: tap sur la carte).

---

### UX-06 · Confusion lever soleil / lever lune dans SolunarIndicator
**Fichier** : `src/components/dashboard/SolunarIndicator.tsx`  
**Description** : En mode compact, l'indicateur affiche `solunar.sunrise` avec le label "🌅 Lever" alors que dans un contexte solunar, "lever" devrait référencer le lever de lune, pas du soleil.  
**Impact** : Information ambiguë. Un pêcheur qui lit "Lever 06:42" dans la section Solunar s'attend à l'heure de lever de lune.  
**Correction** : Utiliser des labels explicites "☀️ Lever soleil" et "🌕 Lever lune", ou n'afficher que les données lunaires dans ce composant.

---

### UX-07 · Absence de légende pour les fenêtres de pêche
**Fichier** : `src/components/dashboard/FishingWindows.tsx` (à vérifier)  
**Description** : Les fenêtres de pêche sont colorées par score (rouge→vert→cyan) mais sans légende expliquant ce code couleur au premier usage.  
**Impact** : L'utilisateur doit deviner que "plus c'est vert/cyan, mieux c'est".  
**Correction** : Ajouter une légende inline minimaliste ou un tooltip au premier affichage.

---

### UX-08 · Non-uniformité des espacements (gap/padding)
**Fichiers** : Multiples composants dashboard  
**Description** : Certains composants utilisent `space-y-4`, d'autres `gap-3`, d'autres `py-3 px-4` vs `p-4`. L'espacement entre les cartes du dashboard n'est pas constant.  
**Impact** : Rythme visuel irrégulier. L'app paraît moins finie.  
**Correction** : Définir un système d'espacement : `gap-3` entre les sections compactes, `gap-4` entre les sections principales.

---

### UX-09 · Spacer de BottomNav incohérent
**Fichiers** : Diverses pages  
**Description** : Certaines pages utilisent `pb-20` pour compenser la BottomNav fixe, d'autres `pb-16`, d'autres n'ont rien. Le contenu peut être coupé par la navigation sur certaines pages.  
**Impact** : Contenu partiellement masqué selon la page.  
**Correction** : Standardiser sur `pb-20` (hauteur BottomNav + marge de sécurité) sur toutes les pages, ou utiliser un composant `<NavSpacer />` partagé.

---

### UX-10 · Variance de padding horizontal
**Fichiers** : Diverses pages  
**Description** : Les pages utilisent des paddings horizontaux variés : `px-4`, `px-3`, `px-5`. Le contenu n'est pas aligné sur une grille commune.  
**Impact** : Impression de manque de soin dans l'assemblage.  
**Correction** : Standardiser sur `px-4` pour toutes les pages (ou utiliser un composant `<PageContainer>` centralisé).

---

### UX-11 · `FishingScoreCard` — zone cliquable sans retour visuel
**Fichier** : `src/components/dashboard/FishingScoreCard.tsx`  
**Description** : Le composant a `role="button"` mais aucun style `hover:` ni `active:` ni `cursor-pointer`. L'utilisateur ne sait pas que la carte est interactive.  
**Impact** : Affordance manquante — fonctionnalité discoverable uniquement par accident.  
**Correction** : Ajouter `cursor-pointer hover:bg-slate-800/80 active:scale-[0.99] transition-all`.

---

### UX-12 · `SpotMarker` — pas d'état intermédiaire hover
**Fichier** : `src/components/map/SpotMarker.tsx`  
**Description** : Le marqueur a une transition CSS mais ne change visuellement qu'entre "default" et "selected". Il n'y a pas d'état hover pour indiquer l'interactivité avant le clic.  
**Impact** : Sur mobile, l'absence de hover n'est pas critique, mais sur desktop l'expérience est pauvre.  
**Correction** : Ajouter un état `hover:scale-110 hover:shadow-lg` même sans js, pour le desktop.

---

### UX-13 · Language "Tap" sur desktop
**Fichier** : `src/components/dashboard/FishingScoreCard.tsx`  
**Description** : Le texte "Tap pour voir le détail" est utilisé, ce qui est un langage tactile. Sur desktop, ce devrait être "Cliquer".  
**Impact** : Mineur sur une app mobile-first, mais détectable en préview desktop.  
**Correction** : Remplacer par "Voir le détail →" ou utiliser le CSS `@media (pointer: fine)` pour adapter le texte.

---

### UX-14 · Absence de transitions entre pages
**Fichiers** : `src/app/layout.tsx`  
**Description** : La navigation entre pages (via BottomNav) est instantanée — pas de fade-in, pas de slide. Sur une PWA standalone, cela rompt l'illusion d'une app native.  
**Impact** : Ressenti "site web" plutôt qu'"app".  
**Correction** : Implémenter des transitions légères via `framer-motion` ou CSS View Transitions API (supportée dans Next.js 14+).

---

### UX-15 · Absence d'animation expand/collapse
**Fichiers** : Composants avec états conditionnels  
**Description** : Les éléments qui apparaissent/disparaissent (erreurs, états vides, détails) le font sans animation. Les transitions de hauteur sont brusques.  
**Impact** : L'UI paraît saccadée lors des changements d'état.  
**Correction** : Utiliser `transition-all duration-200` sur les conteneurs avec hauteur variable, ou `AnimatePresence` de framer-motion pour les montées/descentes.

---

### UX-16 · Absence de slide-up pour le SpotDetail
**Fichier** : `src/components/map/SpotDetail.tsx`  
**Description** : Le panneau de détail d'un spot (bottom sheet) apparaît sans animation. Sur mobile, le pattern standard est un slide-up depuis le bas.  
**Impact** : Interaction non-native sur une app qui vise l'expérience PWA.  
**Correction** : Animer l'entrée avec `transform: translateY(100%)` → `translateY(0)` sur `transition-transform duration-300 ease-out`.

---

### UX-17 · Texte à 10px sous le minimum WCAG
**Fichiers** : Divers composants  
**Description** : Plusieurs éléments utilisent `text-[10px]` (ex: labels BottomNav, badges). WCAG recommande 12px minimum pour le texte d'interface, 14px pour le corps de texte.  
**Impact** : Lisibilité réduite, non-conformité WCAG 1.4.4.  
**Correction** : Remplacer `text-[10px]` par `text-xs` (12px) minimum. Pour les labels de nav, accepter de réduire le padding plutôt que la taille de police.

---

### UX-18 · Contrastes insuffisants — `slate-500` et `slate-600`
**Fichiers** : Divers composants  
**Description** : Le texte en `text-slate-500` (#64748b) sur fond `bg-slate-900` (#0f172a) produit un ratio de contraste ≈ 3.8:1, inférieur au minimum WCAG AA de 4.5:1 pour le texte normal.  
**Impact** : Non-conformité WCAG 2.1 critère 1.4.3. Illisible pour les utilisateurs malvoyants.  
**Correction** : Monter à `text-slate-400` (#94a3b8) minimum pour le texte secondaire sur fond `slate-900`. Ratio `slate-400/slate-900` ≈ 6.4:1 ✓.

---

### UX-19 · Pages vides pour les utilisateurs non authentifiés
**Fichiers** : `src/app/moi/page.tsx`, `src/app/coach/page.tsx`  
**Description** : Les pages `/moi` et `/coach` affichent un état "connectez-vous" qui occupe l'écran entier sans donner de contexte sur ce que fait la fonctionnalité. L'utilisateur ne sait pas pourquoi il devrait se connecter.  
**Impact** : Taux de conversion réduit. L'utilisateur non connecté voit une page morte.  
**Correction** : Afficher un aperçu "teaser" de la fonctionnalité derrière un overlay de connexion (pattern "locked content preview").

---

### UX-20 · Vides verticaux sur plusieurs pages
**Fichiers** : `/semaine`, `/especes`, `/moi` (non authentifié)  
**Description** : Certaines pages ont de grands espaces vides entre les sections, particulièrement visibles sur les grands mobiles (iPhone Pro Max) et sur desktop.  
**Impact** : Impression de page non terminée.  
**Correction** : Auditer chaque page sur un viewport 390px et 430px. Réduire les marges excessives et utiliser le padding pour l'air, pas les espaces vides.

---

### UX-21 · SpotDetail trop dense
**Fichier** : `src/components/map/SpotDetail.tsx`  
**Description** : Le panneau de détail d'un spot affiche toutes les informations (profondeur, fond, espèces, techniques, vent optimal, coefficient, conseils) de manière compacte sur 2-3 écrans. Il n'y a pas de hiérarchie visuelle claire.  
**Impact** : Surcharge informationnelle. L'utilisateur ne sait pas quoi regarder en premier.  
**Correction** : Organiser en sections (En-tête : nom + score), Corps : conditions optimales, Espèces, puis Conseils expert en bas.

---

### UX-22 · Courbe de marée tronquée
**Fichier** : `src/components/dashboard/TideCurve.tsx`  
**Description** : Le graphique de marée (AreaChart Recharts) est tronqué sur les côtés sur certains viewports, coupant les premières et dernières heures de la courbe.  
**Impact** : Information incomplète, visuellement peu soigné.  
**Correction** : Ajouter `margin={{ left: 0, right: 8, top: 8, bottom: 0 }}` à l'AreaChart et s'assurer que le domaine X couvre bien 0h-24h.

---

### UX-23 · Zéro onboarding
**Fichier** : Application entière  
**Description** : Un nouvel utilisateur qui ouvre PêcheBoard pour la première fois voit le dashboard avec des données mais sans contexte. Aucune explication sur : comment le score est calculé, ce que signifient les coefficients, pourquoi se connecter.  
**Impact** : Adoption réduite. Les bêta-testeurs non-initiés abandonneront rapidement.  
**Correction** : Implémenter un onboarding minimal en 2-3 écrans (ou des tooltips contextuels) expliquant les concepts clés : score, coefficient, fenêtres de pêche.

---

### UX-24 · Terminologie opaque — coefficient et score
**Fichier** : Application entière  
**Description** : Les termes "coefficient" (ex: "Coeff. 85") et "score" (ex: "Score 72/100") sont utilisés sans explication dans l'UI. Un pêcheur novice ne sait pas ce que cela signifie.  
**Impact** : Friction à l'adoption. La valeur de l'app est masquée derrière du jargon.  
**Correction** : Ajouter des tooltips explicatifs (ex: tap sur "Coeff. 85" → "Le coefficient de marée mesure l'amplitude. Plus il est élevé, plus le courant est fort. Idéal pour le bar : 70-95.").

---

### UX-25 · Journal — état vide sans incitation à l'action
**Fichier** : `src/app/journal/page.tsx`  
**Description** : Quand l'utilisateur connecté n'a pas encore de prises, la page journal affiche un état vide générique sans illustration ni CTA clair pour ajouter une première prise.  
**Impact** : L'utilisateur ne sait pas par où commencer. Fort taux de rebond sur cette page.  
**Correction** : Concevoir un "empty state" avec illustration et bouton "Enregistrer ma première prise" bien visible.

---

### UX-26 · Carte — pas d'affordance sur les marqueurs
**Fichier** : `src/components/map/SpotMarker.tsx`  
**Description** : Les marqueurs de spots sur la carte ne donnent aucune indication visuelle qu'ils sont cliquables (pas d'ombre, pas de curseur pointer, pas d'animation d'invitation).  
**Impact** : Un utilisateur qui ne sait pas que les marqueurs sont cliquables ne découvrira jamais le SpotDetail.  
**Correction** : Ajouter une légère animation de pulsation ou un shadow, et afficher un tooltip "Tap pour les détails" au premier lancement.

---

### UX-27 · Notifications PWA — UI sans implémentation réelle
**Fichier** : `src/app/moi/notifications/page.tsx`  
**Description** : La page notifications présente une UI complète (toggle, rayon, types de notification) mais les push notifications ne sont pas réellement implémentées (pas de service worker push, pas de VAPID keys, pas de subscription Supabase).  
**Impact** : Feature promise mais non fonctionnelle. Risque de déception utilisateur.  
**Correction** : Soit implémenter réellement les notifications, soit masquer la page avec un badge "Bientôt disponible" et désactiver les contrôles.

---

### UX-28 · Absence de confirmation de déconnexion
**Fichier** : `src/app/moi/compte/page.tsx` (ou composant de déconnexion)  
**Description** : Le bouton de déconnexion exécute immédiatement `signOut()` sans dialog de confirmation.  
**Impact** : Risque de déconnexion accidentelle, notamment sur mobile avec les fat fingers.  
**Correction** : Ajouter un dialog de confirmation simple : "Voulez-vous vraiment vous déconnecter ?" avec deux boutons.

---

### UX-29 · Aucun indicateur de chargement pour les données live
**Fichier** : `src/app/page.tsx`  
**Description** : Pendant le chargement des données météo et marées, les composants affichent soit des valeurs nulles soit un skeleton global. Il n'y a pas de skeleton individualisé par composant, ce qui crée un flash de contenu.  
**Impact** : Layout shift visible, impression de lenteur.  
**Correction** : Implémenter des skeletons par composant (WeatherCard skeleton, TideCurve skeleton) pour un chargement progressif cohérent.

---

### UX-30 · Icônes de score manquantes sur les fiches espèces
**Fichier** : `src/app/especes/[slug]/page.tsx`  
**Description** : Les fiches espèces listent les conditions optimales (coefficient, marée, vent) sous forme de texte brut. Il n'y a pas de représentation visuelle rapide du score actuel pour cette espèce.  
**Impact** : L'utilisateur ne peut pas savoir en un coup d'œil si aujourd'hui est bon pour cette espèce.  
**Correction** : Afficher le score du jour en haut de la fiche espèce, calculé pour les conditions actuelles.

---

### UX-31 · Semaine — design des cartes journalières trop compact
**Fichier** : `src/app/semaine/page.tsx`  
**Description** : Les cartes des 7 jours affichent beaucoup d'informations dans un espace réduit. Sur iPhone SE (375px), certaines informations sont tronquées ou trop petites.  
**Impact** : Lisibilité réduite sur les petits écrans.  
**Correction** : Alléger chaque carte journalière : afficher uniquement score + heure optimale + 1 icône météo. Les détails peuvent être dans un expandable.

---

### UX-32 · Absence de feedback haptic / sonore sur les actions clés
**Fichier** : Application entière  
**Description** : Les actions importantes (envoi d'un message Coach, enregistrement d'une prise, changement de favori) n'ont pas de feedback haptic sur mobile.  
**Impact** : Ressenti "app web" plutôt qu'"app native".  
**Correction** : Utiliser `navigator.vibrate(10)` sur les actions positives (disponible sur Android). iOS n'expose pas d'API vibration standard, mais le retour visuel (animation de scale) compense.

---

## Récapitulatif par priorité

### Priorité 1 — Bloquant / Critique
| ID | Titre |
|----|-------|
| BT-02 | BottomNav cassée dans l'état d'erreur Coach |
| BT-06 | loadError silencieux si météo échoue |
| BT-08 | fetchCatches sans filtre user_id |
| CF-01 | Nom de l'app incohérent (Halioapp vs PêcheBoard) |
| CF-06 | userScalable:false — violation WCAG |
| UX-18 | Contrastes slate-500/900 insuffisants (WCAG AA) |

### Priorité 2 — Important
| ID | Titre |
|----|-------|
| BT-01 | Recharts warning width/height=-1 |
| BT-04 | Tous les marqueurs carte affichent le même score |
| BT-05 | overallScore recalculé sans useMemo |
| BT-11 | Erreurs de sauvegarde silencieuses (préférences) |
| BT-14 | Changement mot de passe affiché aux comptes Google |
| CF-02 | metadataBase absent (og images cassées) |
| CF-07 | Pages /semaine /coach /moi absentes du précache SW |
| CF-13 | Pas de page 404 personnalisée |
| CF-14 | Pas d'Error Boundary global |
| UX-11 | FishingScoreCard sans retour hover/active |
| UX-17 | Texte 10px sous le minimum WCAG |
| UX-23 | Zéro onboarding |
| UX-25 | Journal — empty state sans CTA |

### Priorité 3 — Améliorations souhaitables
| ID | Titre |
|----|-------|
| BT-03 | Edge case "meilleure fenêtre" semaine |
| BT-07 | Dead state solunarData dans journal |
| BT-09 | Slider notifications non sauvegardé au clavier |
| BT-10 | Export CSV silencieux si vide |
| BT-12 | DayHero affiche lures[0] pas le leurre optimal |
| CF-03 | Titres de pages statiques |
| CF-04 | Manifest PWA incomplet |
| CF-08 | CACHE_VERSION hardcodée |
| CF-09 | Header X-XSS-Protection déprécié |
| CF-10 | Permissions-Policy bloque geolocation |
| CF-15 | appleWebApp.title incohérent |
| UX-01 | Score affiché deux fois dashboard |
| UX-03 | Label "Score min" orphelin carte |
| UX-04 | Incohérence violet/cyan |
| UX-08 | Non-uniformité espacements |
| UX-09 | pb-20 / pb-16 incohérent |
| UX-16 | Pas de slide-up SpotDetail |
| UX-22 | TideCurve tronquée |
| UX-24 | Terminologie opaque (coefficient, score) |
| UX-27 | Notifications UI sans implémentation |
| UX-28 | Pas de confirmation déconnexion |

### Priorité 4 — Nice-to-have / Polish
| ID | Titre |
|----|-------|
| BT-13 | Décalage temporel possible entre données |
| CF-05 | og:url hardcodée |
| CF-11 | Absence de CSP |
| CF-12 | Absence de HSTS |
| UX-02 | Ordre dashboard sous-optimal |
| UX-05 | Détails météo masqués sans accès |
| UX-06 | Confusion lever soleil/lune solunar |
| UX-07 | Absence de légende fenêtres de pêche |
| UX-10 | Variance padding horizontal |
| UX-12 | SpotMarker sans état hover |
| UX-13 | Texte "Tap" sur desktop |
| UX-14 | Pas de transitions entre pages |
| UX-15 | Pas d'animation expand/collapse |
| UX-19 | Pages vides pour non-authentifiés |
| UX-20 | Vides verticaux sur certaines pages |
| UX-21 | SpotDetail trop dense |
| UX-26 | Pas d'affordance sur les marqueurs carte |
| UX-29 | Pas de skeletons individuels |
| UX-30 | Score du jour absent des fiches espèces |
| UX-31 | Cartes semaine trop compactes sur petits écrans |
| UX-32 | Absence de feedback haptic |
