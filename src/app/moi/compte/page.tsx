'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, LogOut, Download, Trash2, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/components/layout/BottomNav';

const inputClass =
  'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors';

export default function ComptePage() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  const [user, setUser]               = useState<SupabaseUser | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState('');
  const [nameSaved,   setNameSaved]   = useState(false);

  // Changement de mot de passe
  const [showPwForm, setShowPwForm]   = useState(false);
  const [password,   setPassword]     = useState('');
  const [pwConfirm,  setPwConfirm]    = useState('');
  const [pwError,    setPwError]      = useState<string | null>(null);
  const [pwSuccess,  setPwSuccess]    = useState(false);
  const [savingPw,   setSavingPw]     = useState(false);

  // Export CSV
  const [exporting,  setExporting]    = useState(false);

  // Suppression de compte
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput,       setDeleteInput]        = useState('');
  const [deleting,          setDeleting]           = useState(false);
  const [deleteError,       setDeleteError]        = useState<string | null>(null);

  // ── Auth + chargement ────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      supabase
        .from('user_settings')
        .select('display_name')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: s }) => {
          if (s?.display_name) setDisplayName(s.display_name);
        });
    });
  }, []);

  useEffect(() => {
    if (user === null) router.push('/moi');
  }, [user, router]);

  // ── Sauvegarde du pseudo ──────────────────────────────────────────────────
  async function saveDisplayName() {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      display_name: displayName.trim() || null,
    });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
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

  // ── Export CSV ────────────────────────────────────────────────────────────
  async function exportCsv() {
    if (!user) return;
    setExporting(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('user_id', user.id)
      .order('caught_at', { ascending: false });

    if (!data || data.length === 0) {
      setExporting(false);
      return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = (row as Record<string, unknown>)[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pecheboard-journal-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/moi');
  }

  // ── Suppression de compte ─────────────────────────────────────────────────
  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (!res.ok) {
      setDeleteError("Impossible de supprimer le compte. Réessayez.");
      setDeleting(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (user === undefined || !user) {
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
          <h1 className="text-base font-bold text-white">Mon compte</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">

        {/* ── Profil ── */}
        <section className="space-y-1">
          <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1">Profil</h2>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-400/15 rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.email}</p>
                <p className="text-slate-400 text-xs">Pêcheur du Bassin d'Arcachon</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pseudo affiché</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={saveDisplayName}
                  placeholder="Pêcheur du Bassin"
                  maxLength={40}
                  className={inputClass}
                />
                {nameSaved && (
                  <span className="shrink-0 flex items-center text-emerald-400">
                    <Check size={16} />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">Sauvegardé automatiquement</p>
            </div>
          </div>
        </section>

        {/* ── Connexion ── */}
        <section className="space-y-1">
          <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1">Connexion</h2>
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
              <ChevronRight size={16} className={`text-slate-400 transition-transform ${showPwForm ? 'rotate-90' : ''}`} />
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
                {pwError   && <p className="text-red-400 text-xs">{pwError}</p>}
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

        {/* ── Mes données ── */}
        <section className="space-y-1">
          <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1">Mes données</h2>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-4">
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Exportez l'intégralité de votre journal de pêche au format CSV, lisible dans Excel ou Google Sheets.
            </p>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? 'Exportation…' : 'Exporter mon journal (CSV)'}
            </button>
          </div>
        </section>

        {/* ── Déconnexion ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800/60 text-slate-300 border border-slate-700/50 rounded-xl py-3 text-sm font-medium hover:bg-slate-700/60 transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>

        {/* ── Zone danger ── */}
        <section className="space-y-1">
          <h2 className="text-xs text-red-500/70 font-medium uppercase tracking-wide px-1">Zone danger</h2>
          <div className="bg-red-500/5 rounded-xl border border-red-500/20 px-4 py-4">
            {!showDeleteConfirm ? (
              <>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  La suppression est définitive. Toutes vos prises, préférences et données seront effacées sans possibilité de récupération.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-400 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                  Supprimer mon compte
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-400 font-medium">Confirmer la suppression</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tapez <span className="text-white font-mono">SUPPRIMER</span> pour confirmer.
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="w-full bg-slate-700 border border-red-500/30 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-400 transition-colors"
                />
                {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== 'SUPPRIMER' || deleting}
                    className="flex-1 bg-red-500 text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-40 hover:bg-red-400 transition-colors"
                  >
                    {deleting ? 'Suppression…' : 'Supprimer définitivement'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(null); }}
                    className="px-4 text-slate-400 border border-slate-700 rounded-lg text-sm hover:border-slate-500 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
