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

const inputClass =
  'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors';

export default function ReglagesPage() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/moi');
    }
  }

  const [user, setUser]           = useState<User | null | undefined>(undefined);
  const [favSpecies, setFavSpecies] = useState<string[]>([]);
  const [favSpots,   setFavSpots]   = useState<string[]>([]);

  // Notifications
  const [notifEnabled,  setNotifEnabled]  = useState(false);
  const [notifMinScore, setNotifMinScore] = useState(70);
  const [savingNotif,   setSavingNotif]   = useState(false);
  const [notifSaved,    setNotifSaved]    = useState(false);

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
        .select('favorite_species, favorite_spots, notifications_enabled, notification_min_score')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: s }) => {
          if (s) {
            setFavSpecies(s.favorite_species ?? []);
            setFavSpots(s.favorite_spots ?? []);
            setNotifEnabled(s.notifications_enabled ?? false);
            setNotifMinScore(s.notification_min_score ?? 70);
          }
        });
    });
  }, []);

  // Redirection si non-authentifié (après chargement de l'état auth)
  useEffect(() => {
    if (user === null) router.push('/moi');
  }, [user, router]);

  // ── Sauvegarde favorites ───────────────────────────────────────────────────
  async function saveFavorites(species: string[], spots: string[]) {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, favorite_species: species, favorite_spots: spots });
  }

  async function saveNotifications(enabled: boolean, minScore: number) {
    if (!user) return;
    setSavingNotif(true);
    const supabase = createClient();
    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, notifications_enabled: enabled, notification_min_score: minScore });
    setSavingNotif(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
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

  // ── Non connecté — spinner pendant que le useEffect redirige ──────────────
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

  // ── Connecté ──────────────────────────────────────────────────────────────
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

      </main>

      <BottomNav />
    </div>
  );
}
