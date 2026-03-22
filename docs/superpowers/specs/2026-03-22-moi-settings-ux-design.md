# Design Spec — Page "Moi" + Settings UX

**Date :** 2026-03-22
**Statut :** Approuvé
**Scope :** Refonte navigation (onglet "Moi"), nouvelle page hub profil, amélioration UX de la page Réglages

---

## Contexte & Problème

### Problèmes identifiés

- La page `/reglages` n'est accessible que depuis l'icône ⚙️ dans le header de l'onglet "Aujourd'hui" — introuvable depuis les autres pages
- Aucun bouton de retour sur `/reglages` ni sur `/journal` après la suppression de ces onglets de la bottom nav
- Les chips espèces/spots (`flex-wrap` illimité) génèrent une liste trop longue sur mobile — UX dégradée
- Le mot "Réglages" ne correspond pas au vocabulaire d'un pêcheur ; les sections sont mal organisées
- Pas d'identité utilisateur dans l'app : aucune stats, aucun profil visible
- L'état non-connecté est traité comme une erreur (message d'avertissement) plutôt qu'une invitation

---

## Architecture cible

### Navigation — Bottom nav

**Avant :** `Aujourd'hui | Semaine | Carte | Espèces | Journal`
**Après :** `Aujourd'hui | Semaine | Carte | Espèces | Moi`

| Onglet | Action | Détail |
|--------|--------|--------|
| `Journal` → `Moi` | Renommé + icône changée | `BookOpen` → `User` (lucide-react) |
| `/journal` | Conservé intacte | Accessible depuis "Moi" |
| `/reglages` | Conservé, amélioré | Accessible depuis "Moi", plus dans la nav |

---

## Design détaillé

### Page `/moi` (nouvelle)

**Fichier :** `src/app/moi/page.tsx`

#### État non-connecté

```
[ Icône 🎣 centré ]
[ "Bienvenue sur PêcheBoard" ]
[ Texte : "Connectez-vous pour accéder à votre journal de pêche,
   vos préférences et vos alertes." ]
[ Bouton CTA "Se connecter" → /journal ]
```

Le bouton pointe vers `/journal` qui gère le flux d'authentification Supabase. Après connexion, l'utilisateur reste sur `/journal` (comportement attendu — l'onglet "Moi" est accessible depuis la bottom nav). Ce n'est pas un bug : l'utilisateur non-connecté qui veut accéder à son journal doit se connecter, et après connexion il est naturellement sur la page Journal.

#### État connecté

```
┌─────────────────────────────────┐
│  🎣  baptiste@example.com       │  ← Card profil (email depuis auth.getUser())
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  14 prises · 🐟 Bar · 📍 Passes │  ← Mini stats (calculées depuis catches)
└─────────────────────────────────┘

[ 📓  Journal de pêche          › ]  → /journal
[ ⭐  Mes préférences           › ]  → /reglages (section favorites)
[ 🔔  Notifications             › ]  → /reglages (section notifications)
[ 👤  Mon compte                › ]  → /reglages (section compte)

[ Bouton Déconnexion ]               ← supabase.auth.signOut() → /moi
```

#### Mini stats

Calculées depuis la table `catches` de l'utilisateur connecté :
- **Prises cette année** : `count(*)` depuis le 1er janvier de l'année en cours (libellé UI : "cette année", pas "cette saison" pour éviter l'ambiguïté avec les saisons de pêche par espèce)
- **Espèce top** : `species_id` le plus fréquent parmi les prises
- **Spot top** : `spot_id` le plus fréquent parmi les prises

Si aucune prise : afficher `"Aucune prise enregistrée — commencez votre journal !"` avec lien vers `/journal`.

Les trois liens (Préférences, Notifications, Compte) pointent vers `/reglages` sans ancre. L'utilisateur arrivera en haut de la page et devra scroller jusqu'à la section concernée. **Dégradation connue et acceptée pour le MVP** — pas de scroll automatique vers une section.

---

### Page `/reglages` (améliorée)

**Fichier :** `src/app/reglages/page.tsx`

#### Changements

**Bouton retour :**
Header reçoit un bouton `← Retour` (icône `ChevronLeft`, lucide-react) qui appelle `router.back()`. Positionné à gauche du titre "Réglages".

**Renommage des sections :**
- "Espèces favorites" → "Mes espèces"
- "Spots favoris" → "Mes spots"

**Chips → `FavoritePicker` :**
Les deux sections de chips (`flex-wrap` illimité) sont remplacées par le composant `FavoritePicker`.

**Notifications (polish) :**
- Toggle : transition CSS `transition-all duration-200` sur le déplacement du bouton circulaire
- État actif : badge `Actif` vert (`bg-emerald-500/15 text-emerald-400`) affiché à côté du libellé quand activé
- Feedback sauvegarde : message "✓ Sauvegardé" affiché 2 secondes (comportement actuel conservé, rendu amélioré)
- Le slider de score minimum conserve son comportement actuel

---

### Composant `FavoritePicker` (nouveau)

**Fichier :** `src/components/settings/FavoritePicker.tsx`

#### Props

```typescript
interface FavoritePickerProps {
  label: string;           // "Mes espèces" ou "Mes spots"
  items: { id: string; name: string }[];   // liste complète (SPECIES ou SPOTS)
  selected: string[];      // IDs sélectionnés
  onChange: (selected: string[]) => void;
}
```

**Pas de limite de sélection** — tous les items peuvent être sélectionnés simultanément.

**Déclenchement de la sauvegarde** : `onChange` est appelé à chaque toggle. C'est le parent (`/reglages/page.tsx`) qui appelle immédiatement `saveFavorites()` via Supabase — comportement identique à l'actuel. Pas de bouton "Sauvegarder" nécessaire.

#### Comportement

**Fermé :**
```
Mes espèces  (3 sélectionnées)
┌──────────────────────────────────────────┐
│  [Bar] [Dorade royale] [Maigre]    ›    │
└──────────────────────────────────────────┘
```
- Affiche uniquement les chips des items sélectionnés
- Si aucun sélectionné : texte "Aucune sélection" grisé
- Tap sur la card → ouvre le sélecteur

**Ouvert :**
```
Mes espèces  (3 sélectionnées)
┌──────────────────────────────────────────┐
│  [Bar ✓] [Dorade ✓] [Maigre ✓]   ↑    │
├──────────────────────────────────────────┤
│  ✓ Bar              ○ Seiche            │
│  ✓ Dorade royale    ○ Sole              │
│  ✓ Maigre           ○ Mulet             │
│  ○ Anguille         ○ Crevette          │
└──────────────────────────────────────────┘
```
- Grid 2 colonnes
- Items sélectionnés : fond `slate-700`, checkmark `cyan-400`
- Items non sélectionnés : fond transparent, cercle vide `slate-600`
- Tap sur un item → toggle sélection → appel `onChange`
- Touch target minimum 44px par item
- Tap sur la card header → ferme le sélecteur

---

### Page `/journal` (modifiée)

**Fichier :** `src/app/journal/page.tsx`

Ajout d'un bouton `← Retour` dans le header, identique à celui de `/reglages`.

**Navigation retour (pattern commun à `/journal` et `/reglages`) :**
```typescript
// Fallback vers /moi si pas d'historique (deep-link, PWA shortcut, bookmark)
function handleBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/moi');
  }
}
```

---

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/layout/BottomNav.tsx` | `Journal` → `Moi` : label + icône `User` + href `/moi` |
| `src/app/moi/page.tsx` | **Créé** — hub profil |
| `src/app/reglages/page.tsx` | Bouton retour + sections renommées + `FavoritePicker` + polish notifs |
| `src/app/journal/page.tsx` | Bouton retour |
| `src/components/settings/FavoritePicker.tsx` | **Créé** — sélecteur inline Option C |

---

## Contraintes & non-régression

- **Zéro nouvelle API externe** — mini stats depuis Supabase (déjà utilisé)
- **`/reglages` conserve sa route** — pas de redirection, pas de suppression
- **`/journal` conserve toute sa logique** — seul le header change
- **TypeScript strict** — pas de `any`, props typées
- **Mobile-first** — touch targets ≥ 44px, `FavoritePicker` fermé par défaut
- **Auth** — `moi/page.tsx` gère les deux états (connecté / non-connecté) sans dépendre du layout
- **`/reglages` non-authentifié** : si l'utilisateur accède à `/reglages` sans être connecté (ex. après déconnexion depuis `/moi`, ou deep-link), la page redirige vers `/moi` (remplace le comportement actuel qui redirige vers `/journal`). Le composant `BottomNav` reste visible.
- **Déconnexion** : le bouton de déconnexion est **déplacé vers `/moi`** (supprimé de `/reglages`). `supabase.auth.signOut()` → `router.push('/moi')`

---

## Ce qui N'est PAS dans ce scope

- Moteur de notifications intelligentes (règles, Magic Snapshot, calendrier) — sous-projet B séparé
- GPS sur les prises du journal — évolution future du journal
- Gamification (badges, niveaux) — MVP uniquement
- Nouvelles pages `/preferences`, `/notifications`, `/compte` — tout reste dans `/reglages` pour le MVP
- Modification de la logique métier (scoring, marées, météo)
