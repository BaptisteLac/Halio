'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { T } from '@/design/tokens';
import BottomNav from '@/components/layout/BottomNav';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: T.l3,
  border: `1px solid ${T.border2}`,
  borderRadius: 12,
  padding: '12px 16px',
  color: T.t1,
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message.includes('Password should be at least')
        ? 'Le mot de passe doit faire au moins 6 caractères'
        : updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/journal'), 2000);
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 0' }}>
        <div style={{ width: '100%', maxWidth: 384, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>🔑</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: '0 0 4px' }}>Nouveau mot de passe</h2>
            <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>Choisissez un nouveau mot de passe pour votre compte</p>
          </div>

          {done ? (
            <div style={{ background: `${T.ok}10`, border: `1px solid ${T.ok}30`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.ok, margin: '0 0 4px' }}>Mot de passe mis à jour !</p>
              <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0 }}>Redirection vers le journal…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nouveau mot de passe" required minLength={6} style={inputStyle} />
              <input type="password" value={confirm}  onChange={(e) => setConfirm(e.target.value)}  placeholder="Confirmer le mot de passe" required minLength={6} style={inputStyle} />
              {error && <p style={{ fontSize: '0.75rem', color: T.danger, textAlign: 'center', margin: 0 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: T.accent, color: '#0f172a', fontWeight: 600, borderRadius: 12, padding: '12px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Mise à jour…' : 'Enregistrer le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
