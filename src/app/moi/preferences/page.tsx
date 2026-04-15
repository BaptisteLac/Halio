'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import BottomNav from '@/components/layout/BottomNav';
import FavoritePicker from '@/components/settings/FavoritePicker';

const PORTS = [
  { id: 'arcachon',    label: 'Arcachon' },
  { id: 'andernos',   label: 'Andernos' },
  { id: 'gujan',      label: 'Gujan-Mestras' },
  { id: 'lege',       label: 'Lège-Cap-Ferret' },
  { id: 'la-teste',   label: 'La Teste-de-Buch' },
];

const TECHNIQUES = [
  'Leurre souple',
  'Leurre dur',
  'Vif',
  'Surfcasting',
  'Verticale',
  'Mouche',
  'Jigging',
];

export default function PreferencesPage() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  const [user, setUser]                     = useState<User | null | undefined>(undefined);
  const [favSpecies, setFavSpecies]         = useState<string[]>([]);
  const [favSpots,   setFavSpots]           = useState<string[]>([]);
  const [homePort,   setHomePortState]      = useState<string>('arcachon');
  const [techniques, setTechniques]         = useState<string[]>([]);
  const [saving,     setSaving]             = useState(false);
  const [saved,      setSaved]              = useState(false);

  // ── Auth + chargement ────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      supabase
        .from('user_settings')
        .select('favorite_species, favorite_spots, home_port, preferred_techniques')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: s }) => {
          if (s) {
            setFavSpecies(s.favorite_species ?? []);
            setFavSpots(s.favorite_spots ?? []);
            setHomePortState(s.home_port ?? 'arcachon');
            setTechniques(s.preferred_techniques ?? []);
          }
        });
    });
  }, []);

  useEffect(() => {
    if (user === null) router.push('/moi');
  }, [user, router]);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  async function saveAll(
    species = favSpecies,
    spots = favSpots,
    port = homePort,
    techs = techniques,
  ) {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      favorite_species: species,
      favorite_spots: spots,
      home_port: port,
      preferred_techniques: techs,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleTechnique(tech: string) {
    const next = techniques.includes(tech)
      ? techniques.filter((t) => t !== tech)
      : [...techniques, tech];
    setTechniques(next);
    saveAll(favSpecies, favSpots, homePort, next);
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

  return (
    <div className="min-h-dvh bg-slate-950 pb-24">
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
          <h1 className="text-base font-bold text-white flex-1">Mes préférences</h1>
          {saving && <span className="text-xs text-slate-400">Enregistrement…</span>}
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check size={12} /> Sauvegardé
            </span>
          )}
        </div>
      </header>

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">

        {/* ── Mes espèces ── */}
        <section className="space-y-2">
          <div className="px-1">
            <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide">Mes espèces</h2>
            <p className="text-slate-600 text-xs mt-0.5">Affichées en priorité sur le dashboard</p>
          </div>
          <FavoritePicker
            items={SPECIES.map((s) => ({ id: s.id, name: s.name }))}
            selected={favSpecies}
            onChange={(updated) => {
              setFavSpecies(updated);
              saveAll(updated, favSpots, homePort, techniques);
            }}
          />
        </section>

        {/* ── Mes spots ── */}
        <section className="space-y-2">
          <div className="px-1">
            <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide">Mes spots</h2>
            <p className="text-slate-600 text-xs mt-0.5">Mis en avant sur la carte</p>
          </div>
          <FavoritePicker
            items={SPOTS.map((s) => ({ id: s.id, name: s.name }))}
            selected={favSpots}
            onChange={(updated) => {
              setFavSpots(updated);
              saveAll(favSpecies, updated, homePort, techniques);
            }}
          />
        </section>

        {/* ── Port de départ ── */}
        <section className="space-y-2">
          <div className="px-1">
            <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide">Port de départ</h2>
            <p className="text-slate-600 text-xs mt-0.5">Calcul des distances vers les spots</p>
          </div>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden divide-y divide-slate-700/50">
            {PORTS.map((port) => (
              <button
                key={port.id}
                onClick={() => {
                  setHomePortState(port.id);
                  saveAll(favSpecies, favSpots, port.id, techniques);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-sm text-slate-200">{port.label}</span>
                {homePort === port.id && (
                  <span className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                    <Check size={10} className="text-slate-900" strokeWidth={3} />
                  </span>
                )}
                {homePort !== port.id && (
                  <span className="w-4 h-4 rounded-full border border-slate-600" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── Techniques préférées ── */}
        <section className="space-y-2">
          <div className="px-1">
            <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide">Techniques préférées</h2>
            <p className="text-slate-600 text-xs mt-0.5">Filtres par défaut sur la carte et les espèces</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TECHNIQUES.map((tech) => {
              const active = techniques.includes(tech);
              return (
                <button
                  key={tech}
                  onClick={() => toggleTechnique(tech)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
