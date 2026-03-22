# Page "Moi" + Settings UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'onglet "Journal" par un onglet "Moi" (hub profil), créer la page `/moi` avec mini stats et navigation vers Journal/Réglages, améliorer les chips favorites de `/reglages` avec le composant `FavoritePicker`, et ajouter des boutons retour sur les pages filles.

**Architecture:** Un nouveau composant `FavoritePicker` remplace les chips `flex-wrap` illimitées par un pattern résumé + sélecteur inline. La page `/moi` est un hub stateless (auth-aware) qui affiche mini stats Supabase et des liens vers les pages existantes. Aucune nouvelle route API, aucun changement de logique métier.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Tailwind CSS 4, lucide-react, Supabase client, vitest pour les tests unitaires purs.

---

## File Structure

| Fichier | Action | Responsabilité |
|---------|--------|----------------|
| `src/components/layout/BottomNav.tsx` | Modifié | Onglet Journal → Moi |
| `src/components/settings/FavoritePicker.tsx` | Créé | Sélecteur inline (résumé + grid) |
| `src/app/moi/page.tsx` | Créé | Hub profil : stats + navigation |
| `src/app/reglages/page.tsx` | Modifié | Back button, FavoritePicker, polish notifs, auth redirect |
| `src/app/journal/page.tsx` | Modifié | Back button |

---

## Task 1 : BottomNav — Journal → Moi

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`

- [ ] **Step 1 : Modifier NAV_ITEMS dans BottomNav.tsx**

Remplacer l'import `BookOpen` par `User` et mettre à jour l'item Journal :

```typescript
// src/components/layout/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CalendarDays, Map, Fish, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: "Aujourd'hui", icon: CalendarCheck },
  { href: '/semaine', label: 'Semaine', icon: CalendarDays },
  { href: '/carte', label: 'Carte', icon: Map },
  { href: '/especes', label: 'Espèces', icon: Fish },
  { href: '/moi', label: 'Moi', icon: User },
];
// ... reste du composant inchangé
```

- [ ] **Step 2 : Vérifier le build**

```bash
cd /Users/b.lacoste/Documents/pecheboard
npm run build 2>&1 | tail -20
```

Expected : aucune erreur TypeScript ni de compilation.

- [ ] **Step 3 : Commit**

```bash
git add src/components/layout/BottomNav.tsx
git commit -m "feat(nav): onglet Journal → Moi avec icône User"
```

---

## Task 2 : Composant FavoritePicker

**Files:**
- Create: `src/components/settings/FavoritePicker.tsx`

Ce composant est un sélecteur inline en deux états : fermé (chips des sélectionnés) et ouvert (grid 2 colonnes). Il est purement contrôlé — le parent gère la persistance.

- [ ] **Step 1 : Créer le fichier**

```typescript
// src/components/settings/FavoritePicker.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FavoritePickerProps {
  label: string;
  items: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function FavoritePicker({ label, items, selected, onChange }: FavoritePickerProps) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-sm text-slate-500">Aucune sélection</span>
          ) : (
            selected.map((id) => {
              const item = items.find((i) => i.id === id);
              return item ? (
                <span
                  key={id}
                  className="bg-cyan-400/15 text-cyan-400 border border-cyan-400/40 rounded-full px-2.5 py-0.5 text-xs"
                >
                  {item.name}
                </span>
              ) : null;
            })
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.length > 0 && (
            <span className="text-xs text-slate-500">({selected.length})</span>
          )}
          {open ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Sélecteur grid */}
      {open && (
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((item) => {
              const active = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] text-left ${
                    active
                      ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/40'
                      : 'bg-slate-900/50 text-slate-400 border border-transparent hover:border-slate-600'
                  }`}
                >
                  <span className={`text-xs shrink-0 ${active ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {active ? '✓' : '○'}
                  </span>
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le typage**

```bash
cd /Users/b.lacoste/Documents/pecheboard
npx tsc --noEmit 2>&1 | grep -E "FavoritePicker|error"
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/settings/FavoritePicker.tsx
git commit -m "feat(settings): composant FavoritePicker (résumé + sélecteur inline)"
```

---

## Task 3 : Mise à jour de `/reglages`

**Files:**
- Modify: `src/app/reglages/page.tsx`

Changements : bouton retour, FavoritePicker (remplace chips), polish notifications, redirect si non-authentifié, suppression du bouton déconnexion.

- [ ] **Step 1 : Mettre à jour les imports**

Ajouter `useRouter`, `ChevronLeft`, `FavoritePicker`. Retirer `LogOut` (déconnexion déplacée vers `/moi`).

```typescript
// Remplacer les imports existants :
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Bell, BellOff } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import BottomNav from '@/components/layout/BottomNav';
import FavoritePicker from '@/components/settings/FavoritePicker';
```

- [ ] **Step 2 : Ajouter la fonction handleBack**

Après la déclaration `const router = useRouter();`, ajouter :

```typescript
function handleBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/moi');
  }
}
```

- [ ] **Step 3 : Modifier l'état non-connecté — rediriger vers /moi via useEffect**

Ne pas appeler `router.push()` directement dans le render (interdit par les règles React).
Ajouter un `useEffect` après la déclaration de `router` :

```typescript
// Redirection si non-authentifié (après chargement de l'état auth)
useEffect(() => {
  if (user === null) router.push('/moi');
}, [user, router]);
```

Et remplacer le bloc `if (!user)` (lignes 149-161) par :

```typescript
// ── Non connecté ──────────────────────────────────────────────────────────
if (!user) {
  return (
    <div className="h-dvh flex flex-col bg-slate-950">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
      <BottomNav />
    </div>
  );
}
```

Le spinner s'affiche le temps que le `useEffect` déclenche la redirection vers `/moi`.

- [ ] **Step 4 : Mettre à jour le header — ajouter bouton retour, retirer LogOut du header**

Remplacer le header (lignes 166-171) :

```typescript
{/* Header */}
<header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800">
  <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-3">
    <button
      onClick={handleBack}
      className="text-slate-400 hover:text-white transition-colors p-1 -ml-1"
      aria-label="Retour"
    >
      <ChevronLeft size={22} />
    </button>
    <h1 className="text-base font-bold text-white">Réglages</h1>
  </div>
</header>
```

- [ ] **Step 5 : Remplacer les chips espèces par FavoritePicker**

Remplacer la section "Espèces favorites" (section complète avec `flex flex-wrap gap-2` et tous les boutons SPECIES) par :

```tsx
{/* ── Mes espèces ── */}
<section className="space-y-2">
  <div className="px-1">
    <h2 className="text-xs text-slate-500 font-medium uppercase tracking-wide">Mes espèces</h2>
    <p className="text-slate-600 text-xs mt-0.5">Sauvegardées pour référence</p>
  </div>
  <FavoritePicker
    label="Mes espèces"
    items={SPECIES.map((s) => ({ id: s.id, name: s.name }))}
    selected={favSpecies}
    onChange={(updated) => {
      setFavSpecies(updated);
      saveFavorites(updated, favSpots);
    }}
  />
</section>
```

- [ ] **Step 6 : Remplacer les chips spots par FavoritePicker**

Remplacer la section "Spots favoris" de la même manière :

```tsx
{/* ── Mes spots ── */}
<section className="space-y-2">
  <div className="px-1">
    <h2 className="text-xs text-slate-500 font-medium uppercase tracking-wide">Mes spots</h2>
    <p className="text-slate-600 text-xs mt-0.5">Sauvegardés pour référence</p>
  </div>
  <FavoritePicker
    label="Mes spots"
    items={SPOTS.map((s) => ({ id: s.id, name: s.name }))}
    selected={favSpots}
    onChange={(updated) => {
      setFavSpots(updated);
      saveFavorites(favSpecies, updated);
    }}
  />
</section>
```

- [ ] **Step 7 : Polish section notifications**

Remplacer la section notifications par une version améliorée visuellement. Le toggle reçoit une transition smooth et un badge "Actif" :

```tsx
{/* ── Notifications email ── */}
<section className="space-y-1">
  <h2 className="text-xs text-slate-500 font-medium uppercase tracking-wide px-1">Notifications email</h2>
  <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">

    {/* Toggle */}
    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
      <div className="flex items-center gap-2">
        {notifEnabled ? (
          <Bell size={16} className="text-cyan-400" />
        ) : (
          <BellOff size={16} className="text-slate-500" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-white">Alerte bonne session</p>
            {notifEnabled && (
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 text-[10px] font-medium">
                Actif
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Email chaque soir si le score est atteint</p>
        </div>
      </div>
      <button
        onClick={() => {
          const next = !notifEnabled;
          setNotifEnabled(next);
          saveNotifications(next, notifMinScore);
        }}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifEnabled ? 'bg-cyan-400' : 'bg-slate-600'}`}
        aria-label={notifEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifEnabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>

    {/* Seuil minimum */}
    {notifEnabled && (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">Score minimum pour être notifié</label>
          <span className="text-sm font-bold text-cyan-400">{notifMinScore}/100</span>
        </div>
        <input
          type="range"
          min={40}
          max={90}
          step={5}
          value={notifMinScore}
          onChange={(e) => setNotifMinScore(Number(e.target.value))}
          onMouseUp={() => saveNotifications(notifEnabled, notifMinScore)}
          onTouchEnd={() => saveNotifications(notifEnabled, notifMinScore)}
          className="w-full accent-cyan-400"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>Moyen (40)</span>
          <span>Excellent (70)</span>
          <span>Max (90)</span>
        </div>
        {notifSaved && (
          <p className="text-emerald-400 text-xs flex items-center gap-1 mt-2">
            <Check size={12} /> Sauvegardé
          </p>
        )}
        {savingNotif && (
          <p className="text-slate-500 text-xs mt-2">Enregistrement…</p>
        )}
      </div>
    )}
  </div>
</section>
```

- [ ] **Step 8 : Supprimer la section Déconnexion de /reglages et le code mort**

Supprimer entièrement :
1. La section JSX `{/* ── Déconnexion ── */}` (le bouton LogOut)
2. La fonction `handleLogout` dans le composant (devenue morte après suppression du bouton)
3. Les fonctions `toggleSpecies` et `toggleSpot` (devenues mortes après introduction de `FavoritePicker`)

Ces trois éléments ne causent pas d'erreur TypeScript mais laissent du code mort.

- [ ] **Step 9 : Vérifier le build et le typage**

```bash
cd /Users/b.lacoste/Documents/pecheboard
npx tsc --noEmit 2>&1 | grep error
npm run build 2>&1 | tail -20
```

Expected : 0 erreur TypeScript, build réussi.

- [ ] **Step 10 : Commit**

```bash
git add src/app/reglages/page.tsx
git commit -m "feat(reglages): back button, FavoritePicker, polish notifications, redirect /moi si non-auth"
```

---

## Task 4 : Bouton retour dans `/journal`

**Files:**
- Modify: `src/app/journal/page.tsx`

- [ ] **Step 1 : Ajouter l'import ChevronLeft et useRouter**

Dans les imports existants de `journal/page.tsx`, ajouter :

```typescript
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
```

- [ ] **Step 2 : Ajouter router et handleBack dans le composant**

Dans le corps du composant `JournalPage`, après `const [now] = useState(...)` :

```typescript
const router = useRouter();

function handleBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/moi');
  }
}
```

- [ ] **Step 3 : Ajouter le bouton retour dans le header connecté**

Remplacer le header connecté (lignes 114-127) :

```tsx
{/* Header */}
<header className="shrink-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-40">
  <div className="px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
    <button
      onClick={handleBack}
      className="text-slate-400 hover:text-white transition-colors p-1 -ml-1"
      aria-label="Retour"
    >
      <ChevronLeft size={22} />
    </button>
    <div className="flex-1">
      <h1 className="text-base font-bold text-white">Journal</h1>
      <p className="text-xs text-slate-400 truncate max-w-[180px]">{user.email}</p>
    </div>
    <button
      onClick={handleLogout}
      className="text-xs text-slate-400 border border-slate-700 rounded-full px-3 py-1.5 hover:border-slate-500 transition-colors"
    >
      Déconnexion
    </button>
  </div>
</header>
```

- [ ] **Step 4 : Vérifier le build**

```bash
cd /Users/b.lacoste/Documents/pecheboard
npx tsc --noEmit 2>&1 | grep error
```

Expected : 0 erreur.

- [ ] **Step 5 : Commit**

```bash
git add src/app/journal/page.tsx
git commit -m "feat(journal): bouton retour vers /moi"
```

---

## Task 5 : Page `/moi`

**Files:**
- Create: `src/app/moi/page.tsx`

Page hub profil : deux états (non-connecté / connecté), mini stats depuis `catches`, navigation vers Journal et Réglages, bouton déconnexion.

- [ ] **Step 1 : Créer src/app/moi/page.tsx**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Star, Bell, User, ChevronRight, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import BottomNav from '@/components/layout/BottomNav';

interface MiniStats {
  catchCount: number;
  topSpeciesName: string | null;
  topSpotName: string | null;
}

export default function MoiPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [stats, setStats] = useState<MiniStats | null>(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Mini stats ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setStats(null); return; }
    const supabase = createClient();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

    supabase
      .from('catches')
      .select('species_id, spot_id')
      .eq('user_id', user.id)
      .gte('caught_at', yearStart)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setStats({ catchCount: 0, topSpeciesName: null, topSpotName: null });
          return;
        }

        // Top espèce
        const speciesCount: Record<string, number> = {};
        const spotCount: Record<string, number> = {};
        for (const row of data) {
          speciesCount[row.species_id] = (speciesCount[row.species_id] ?? 0) + 1;
          spotCount[row.spot_id] = (spotCount[row.spot_id] ?? 0) + 1;
        }

        const topSpeciesId = Object.entries(speciesCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const topSpotId = Object.entries(spotCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        setStats({
          catchCount: data.length,
          topSpeciesName: topSpeciesId ? (SPECIES.find((s) => s.id === topSpeciesId)?.name ?? null) : null,
          topSpotName: topSpotId ? (SPOTS.find((s) => s.id === topSpotId)?.name ?? null) : null,
        });
      });
  }, [user]);

  // ── Déconnexion ───────────────────────────────────────────────────────────
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/moi');
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (user === undefined) {
    return (
      <div className="h-dvh flex flex-col bg-slate-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Non connecté ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="h-dvh flex flex-col bg-slate-950">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="text-5xl">🎣</div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Bienvenue sur PêcheBoard</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connectez-vous pour accéder à votre journal de pêche, vos préférences et vos alertes.
            </p>
          </div>
          <Link
            href="/journal"
            className="bg-cyan-400 text-slate-900 font-semibold rounded-xl px-8 py-3 text-sm hover:bg-cyan-300 transition-colors"
          >
            Se connecter
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Connecté ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-slate-950 pb-24">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-base font-bold text-white">Mon profil</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">

        {/* ── Card profil ── */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-400/15 rounded-full flex items-center justify-center shrink-0">
            <User size={20} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{user.email}</p>
            <p className="text-slate-500 text-xs">Pêcheur du Bassin</p>
          </div>
        </div>

        {/* ── Mini stats ── */}
        {stats !== null && (
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-3">
            {stats.catchCount === 0 ? (
              <p className="text-slate-500 text-sm text-center py-1">
                Aucune prise enregistrée —{' '}
                <Link href="/journal" className="text-cyan-400 underline">
                  commencez votre journal
                </Link>
              </p>
            ) : (
              <div className="flex items-center justify-around text-center gap-2">
                <div>
                  <p className="text-xl font-bold text-cyan-400">{stats.catchCount}</p>
                  <p className="text-[10px] text-slate-500">prises cette année</p>
                </div>
                {stats.topSpeciesName && (
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-[90px]">{stats.topSpeciesName}</p>
                    <p className="text-[10px] text-slate-500">espèce favorite</p>
                  </div>
                )}
                {stats.topSpotName && (
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-[90px]">{stats.topSpotName}</p>
                    <p className="text-[10px] text-slate-500">spot favori</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden divide-y divide-slate-700/50">
          <Link
            href="/journal"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <BookOpen size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Journal de pêche</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
          <Link
            href="/reglages"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <Star size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Mes préférences</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
          <Link
            href="/reglages"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <Bell size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Notifications</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
          <Link
            href="/reglages"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <User size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Mon compte</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
        </div>

        {/* ── Déconnexion ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl py-3 text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>

      </main>

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build complet**

```bash
cd /Users/b.lacoste/Documents/pecheboard
npx tsc --noEmit 2>&1 | grep error
npm run build 2>&1 | tail -30
```

Expected : 0 erreur TypeScript, build réussi avec 0 warning bloquant.

- [ ] **Step 3 : Vérification manuelle (liste de contrôle)**

Lancer `npm run dev` et vérifier dans le navigateur :

- [ ] Bottom nav affiche "Moi" (icône User) à la place de "Journal"
- [ ] `/moi` non-connecté : page d'invitation avec CTA "Se connecter"
- [ ] `/moi` connecté : email, stats, 3 liens, bouton déconnexion
- [ ] Tap "Journal de pêche" → `/journal` avec bouton ← Retour visible
- [ ] Bouton ← dans `/journal` → retour à `/moi`
- [ ] Tap "Mes préférences" → `/reglages` avec bouton ← Retour visible
- [ ] Dans `/reglages` : chips remplacées par FavoritePicker (fermé par défaut)
- [ ] Tap FavoritePicker → ouvre le grid, tap item → toggle sélection
- [ ] Toggle notifications : animation smooth, badge "Actif" visible quand activé
- [ ] `/reglages` : plus de bouton "Déconnexion"
- [ ] `/journal` : bouton Déconnexion toujours présent dans son header
- [ ] Déconnexion depuis `/moi` → reste sur `/moi` (état non-connecté)

- [ ] **Step 4 : Commit**

```bash
git add src/app/moi/page.tsx
git commit -m "feat(moi): page hub profil avec mini stats, navigation et déconnexion"
```

---

## Vérification finale

```bash
cd /Users/b.lacoste/Documents/pecheboard
npm run build
```

Expected : build Next.js réussi, 0 erreur TypeScript.
