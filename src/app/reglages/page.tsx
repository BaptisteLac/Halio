'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronRight, Check } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import BottomNav from '@/components/layout/BottomNav';

const inputClass =
  'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors';

export default function ReglagesPage() {
  const router = useRouter();

  const [user, setUser]           = useState<User | null | undefined>(undefined);
  const [favSpecies, setFavSpecies] = useState<string[]>([]);
  const [favSpots,   setFavSpots]   = useState<string[]>([]);

  // Formulaire changement de mot de passe
  const [showPwForm,    setShowPwForm]    = useState(false);
  const [password,      setPassword]      = useState('');
  const [pwConfirm,     setPwConfirm]     = useState('');
  const [pwError,       setPwError]       = useState<string | null>(null);
  const [pwSuccess,     setPwSuccess]     = useState(false);
  const [savingPw,      setSavingPw]      = useState(false);

  // ── Chargement user + settings ────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      supabase
        .from('user_settings')
        .select('favorite_species, favorite_spots')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: s }) => {
          if (s) {
            setFavSpecies(s.favorite_species ?? []);
            setFavSpots(s.favorite_spots ?? []);
          }
        });
    });
  }, []);

  // ── Sauvegarde favorites ───────────────────────────────────────────────────
  async function saveFavorites(species: string[], spots: string[]) {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, favorite_species: species, favorite_spots: spots });
  }

  function toggleSpecies(id: string) {
    const updated = favSpecies.includes(id)
      ? favSpecies.filter((s) => s !== id)
      : [...favSpecies, id];
    setFavSpecies(updated);
    saveFavorites(updated, favSpots);
  }

  function toggleSpot(id: string) {
    const updated = favSpots.includes(id)
      ? favSpots.filter((s) => s !== id)
      : [...favSpots, id];
    setFavSpots(updated);
    saveFavorites(favSpecies, updated);
  }

  // ── Changement de mot de passe ────────────────────────────────────────────
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (password !== pwConfirm) {
      setPwError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setPwError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setSavingPw(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setPassword('');
      setPwConfirm('');
      setTimeout(() => { setPwSuccess(false); setShowPwForm(false); }, 2000);
    }
  }

  function cancelPwForm() {
    setShowPwForm(false);
    setPassword('');
    setPwConfirm('');
    setPwError(null);
    setPwSuccess(false);
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/journal');
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
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-slate-300 font-medium">Accès limité</p>
          <p className="text-slate-500 text-sm">
            Connectez-vous via le Journal pour accéder aux réglages.
          </p>
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
          <h1 className="text-base font-bold text-white">Réglages</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">

        {/* ── Compte ── */}
        <section className="space-y-1">
          <h2 className="text-xs text-slate-500 font-medium uppercase tracking-wide px-1">Compte</h2>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">

            {/* Email */}
            <div className="px-4 py-3 border-b border-slate-700/50">
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-white text-sm mt-0.5 truncate">{user.email}</p>
            </div>

            {/* Changer mot de passe */}
            <button
              onClick={() => showPwForm ? cancelPwForm() : setShowPwForm(true)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm text-slate-200 hover:bg-slate-700/40 transition-colors"
            >
              <span>Changer le mot de passe</span>
              <ChevronRight size={16} className={`text-slate-500 transition-transform ${showPwForm ? 'rotate-90' : ''}`} />
            </button>

            {showPwForm && (
              <form onSubmit={handlePasswordChange} className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-700/50">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="min. 6 caractères"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Confirmer</label>
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    placeholder="Répéter le mot de passe"
                    required
                    className={inputClass}
                  />
                </div>
                {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
                {pwSuccess && (
                  <p className="text-cyan-400 text-xs flex items-center gap-1">
                    <Check size={12} /> Mot de passe mis à jour
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingPw}
                    className="flex-1 bg-cyan-400 text-slate-900 font-semibold rounded-lg py-2 text-sm disabled:opacity-50 transition-opacity"
                  >
                    {savingPw ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelPwForm}
                    className="px-4 text-slate-400 border border-slate-700 rounded-lg text-sm hover:border-slate-500 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ── Espèces favorites ── */}
        <section className="space-y-2">
          <div className="px-1">
            <h2 className="text-xs text-slate-500 font-medium uppercase tracking-wide">Espèces favorites</h2>
            <p className="text-slate-600 text-xs mt-0.5">Sauvegardées pour référence</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPECIES.map((s) => {
              const active = favSpecies.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSpecies(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Spots favoris ── */}
        <section className="space-y-2">
          <div className="px-1">
            <h2 className="text-xs text-slate-500 font-medium uppercase tracking-wide">Spots favoris</h2>
            <p className="text-slate-600 text-xs mt-0.5">Sauvegardés pour référence</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPOTS.map((s) => {
              const active = favSpots.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSpot(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Déconnexion ── */}
        <section>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl py-3 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
