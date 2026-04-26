'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LogOut, Download, Trash2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { T } from '@/design/tokens';
import { IChevRight, IUser, IChevDown } from '@/design/icons';
import BottomNav from '@/components/layout/BottomNav';

const sectionLabel: React.CSSProperties = {
  fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.t4, marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: T.l3,
  border: `1px solid ${T.border2}`,
  borderRadius: 10,
  padding: '10px 12px',
  color: T.t1,
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function CompteClient() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  const [user,        setUser]        = useState<SupabaseUser | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState('');
  const [nameSaved,   setNameSaved]   = useState(false);

  const [showPwForm, setShowPwForm] = useState(false);
  const [password,   setPassword]   = useState('');
  const [pwConfirm,  setPwConfirm]  = useState('');
  const [pwError,    setPwError]    = useState<string | null>(null);
  const [pwSuccess,  setPwSuccess]  = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);

  const [exporting,   setExporting]   = useState(false);
  const [exportEmpty, setExportEmpty] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput,       setDeleteInput]       = useState('');
  const [deleting,          setDeleting]          = useState(false);
  const [deleteError,       setDeleteError]       = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      supabase.from('user_settings').select('display_name').eq('user_id', data.user.id).single()
        .then(({ data: s }) => { if (s?.display_name) setDisplayName(s.display_name); });
    });
  }, []);

  useEffect(() => {
    if (user === null) router.push('/moi');
  }, [user, router]);

  async function saveDisplayName() {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('user_settings').upsert({ user_id: user.id, display_name: displayName.trim() || null });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (password !== pwConfirm) { setPwError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6)    { setPwError('Le mot de passe doit faire au moins 6 caractères'); return; }
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

  function cancelPwForm() { setShowPwForm(false); setPassword(''); setPwConfirm(''); setPwError(null); setPwSuccess(false); }

  async function exportCsv() {
    if (!user) return;
    setExporting(true);
    const supabase = createClient();
    const { data } = await supabase.from('catches').select('*').eq('user_id', user.id).order('caught_at', { ascending: false });
    if (!data || data.length === 0) { setExporting(false); setExportEmpty(true); setTimeout(() => setExportEmpty(false), 3000); return; }
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = (row as Record<string, unknown>)[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `halio-journal-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/moi');
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (!res.ok) { setDeleteError("Impossible de supprimer le compte. Réessayez."); setDeleting(false); return; }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (user === undefined || !user) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
      <header style={{ background: T.l1, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: '12px 16px', maxWidth: 512, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} aria-label="Retour" style={{ padding: 6, marginLeft: -6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <IChevRight size={22} color={T.t3} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0 }}>Mon compte</h1>
        </div>
      </header>

      <main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 512, margin: '0 auto' }}>

        <section>
          <p style={sectionLabel}>Profil</p>
          <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, background: `${T.accent}18`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IUser size={20} color={T.accent} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0 }}>Pêcheur du Bassin d'Arcachon</p>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', color: T.t4, marginBottom: 4 }}>Pseudo affiché</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} onBlur={saveDisplayName} placeholder="Pêcheur du Bassin" maxLength={40} style={inputStyle} />
                {nameSaved && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: T.ok }}><Check size={16} /></span>}
              </div>
              <p style={{ fontSize: '0.6875rem', color: T.t4, margin: '4px 0 0' }}>Sauvegardé automatiquement</p>
            </div>
          </div>
        </section>

        <section>
          <p style={sectionLabel}>Connexion</p>
          <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontSize: '0.6875rem', color: T.t4, margin: 0 }}>Email</p>
              <p style={{ fontSize: '0.875rem', color: T.t1, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>

            {user.app_metadata?.provider !== 'google' && (
              <>
                <button
                  onClick={() => showPwForm ? cancelPwForm() : setShowPwForm(true)}
                  style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', color: T.t2, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span>Changer le mot de passe</span>
                  <IChevDown size={16} color={T.t4} style={{ transform: showPwForm ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                </button>

                {showPwForm && (
                  <form onSubmit={handlePasswordChange} style={{ padding: '4px 16px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.6875rem', color: T.t4, marginBottom: 4 }}>Nouveau mot de passe</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 6 caractères" required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.6875rem', color: T.t4, marginBottom: 4 }}>Confirmer</label>
                      <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Répéter le mot de passe" required style={inputStyle} />
                    </div>
                    {pwError   && <p style={{ fontSize: '0.75rem', color: T.danger, margin: 0 }}>{pwError}</p>}
                    {pwSuccess && <p style={{ fontSize: '0.75rem', color: T.accent, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Mot de passe mis à jour</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" disabled={savingPw} style={{ flex: 1, background: T.accent, color: '#0f172a', fontWeight: 600, borderRadius: 10, padding: '10px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', opacity: savingPw ? 0.5 : 1 }}>
                        {savingPw ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                      <button type="button" onClick={cancelPwForm} style={{ padding: '10px 16px', color: T.t3, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: '0.875rem', background: 'none', cursor: 'pointer' }}>
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </section>

        <section>
          <p style={sectionLabel}>Mes données</p>
          <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
            <p style={{ fontSize: '0.75rem', color: T.t3, lineHeight: 1.6, margin: '0 0 12px' }}>
              Exportez l'intégralité de votre journal de pêche au format CSV, lisible dans Excel ou Google Sheets.
            </p>
            <button
              onClick={exportCsv}
              disabled={exporting}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.l3, color: T.t1, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 16px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: exporting ? 0.5 : 1 }}
            >
              <Download size={16} />
              {exporting ? 'Exportation…' : 'Exporter mon journal (CSV)'}
            </button>
            {exportEmpty && <p style={{ fontSize: '0.75rem', color: T.t4, margin: '8px 0 0' }}>Aucune prise enregistrée à exporter.</p>}
          </div>
        </section>

        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: T.l2, color: T.t2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        ) : (
          <div style={{ background: T.l2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '0.875rem', color: T.t2, fontWeight: 500, textAlign: 'center', margin: 0 }}>Confirmer la déconnexion ?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleLogout} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: T.l3, color: T.t1, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                <LogOut size={15} /> Déconnexion
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ padding: '10px 16px', color: T.t3, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: '0.875rem', background: 'none', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        <section>
          <p style={{ ...sectionLabel, color: 'rgba(239,68,68,.6)' }}>Zone danger</p>
          <div style={{ background: 'rgba(239,68,68,.05)', borderRadius: 12, border: 'rgba(239,68,68,.2) 1px solid', padding: 16 }}>
            {!showDeleteConfirm ? (
              <>
                <p style={{ fontSize: '0.75rem', color: T.t3, lineHeight: 1.6, margin: '0 0 12px' }}>
                  La suppression est définitive. Toutes vos prises, préférences et données seront effacées sans possibilité de récupération.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.danger, border: 'rgba(239,68,68,.3) 1px solid', borderRadius: 10, padding: '10px 16px', fontSize: '0.875rem', fontWeight: 500, background: 'none', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                  Supprimer mon compte
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '0.875rem', color: T.danger, fontWeight: 500, margin: 0 }}>Confirmer la suppression</p>
                <p style={{ fontSize: '0.75rem', color: T.t3, lineHeight: 1.5, margin: 0 }}>
                  Tapez <span style={{ color: T.t1, fontFamily: 'monospace' }}>SUPPRIMER</span> pour confirmer.
                </p>
                <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="SUPPRIMER" style={{ ...inputStyle, borderColor: 'rgba(239,68,68,.35)' }} />
                {deleteError && <p style={{ fontSize: '0.75rem', color: T.danger, margin: 0 }}>{deleteError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== 'SUPPRIMER' || deleting}
                    style={{ flex: 1, background: T.danger, color: '#fff', fontWeight: 600, borderRadius: 10, padding: '10px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', opacity: deleteInput !== 'SUPPRIMER' || deleting ? 0.4 : 1 }}
                  >
                    {deleting ? 'Suppression…' : 'Supprimer définitivement'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(null); }}
                    style={{ padding: '10px 16px', color: T.t3, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: '0.875rem', background: 'none', cursor: 'pointer' }}
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
