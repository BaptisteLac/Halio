'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { T } from '@/design/tokens';

type Mode = 'login' | 'signup' | 'forgot';

function toFrench(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect';
  if (msg.includes('Email not confirmed'))        return 'Confirmez votre email avant de vous connecter';
  if (msg.includes('User already registered'))    return 'Un compte existe déjà avec cet email';
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères';
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit'))
    return 'Trop de tentatives, patientez quelques minutes';
  return msg;
}

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

export default function AuthForm() {
  const [mode, setMode]                     = useState<Mode>('login');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [error, setError]                   = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [sent, setSent]                     = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSent(false);
    setNeedsConfirmation(false);
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (resendError) {
      setError(toFrench(resendError.message));
    } else {
      setNeedsConfirmation(false);
      setSent(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      setLoading(false);
      if (resetError) setError(toFrench(resetError.message));
      else setSent(true);
      return;
    }

    if (mode === 'signup') {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (signupError) setError(toFrench(signupError.message));
      else setSent(true);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      if (loginError.message.includes('Email not confirmed')) setNeedsConfirmation(true);
      else setError(toFrench(loginError.message));
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (sent) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 384, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ fontSize: '3rem' }}>📧</p>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: '0 0 8px' }}>Email envoyé !</h2>
            <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>
              {mode === 'forgot'
                ? 'Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.'
                : 'Vérifiez votre boîte mail et cliquez sur le lien pour activer votre compte.'}
            </p>
          </div>
          <button onClick={() => switchMode('login')} style={{ fontSize: '0.875rem', color: T.t3, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (needsConfirmation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 384, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ fontSize: '3rem' }}>✉️</p>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: '0 0 8px' }}>Email non confirmé</h2>
            <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>
              L&apos;email <span style={{ color: T.t2 }}>{email}</span> n&apos;a pas encore été confirmé.
              Renvoyez le lien d&apos;activation pour pouvoir vous connecter.
            </p>
          </div>
          {error && <p style={{ fontSize: '0.75rem', color: T.danger, margin: 0 }}>{error}</p>}
          <button
            onClick={handleResend}
            disabled={loading}
            style={{ width: '100%', background: T.accent, color: '#0f172a', fontWeight: 600, borderRadius: 12, padding: '12px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Envoi…' : "Renvoyer l'email de confirmation"}
          </button>
          <button onClick={() => switchMode('login')} style={{ fontSize: '0.875rem', color: T.t3, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  const isForgot = mode === 'forgot';

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 384, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>🎣</p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: '0 0 4px' }}>Journal de pêche</h2>
          <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>
            {mode === 'login'  && 'Connectez-vous pour accéder à vos prises'}
            {mode === 'signup' && 'Créez un compte pour commencer à logger'}
            {isForgot          && 'Entrez votre email pour réinitialiser votre mot de passe'}
          </p>
        </div>

        {!isForgot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={handleGoogle}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#ffffff', color: '#0f172a', fontWeight: 600, borderRadius: 12, padding: '12px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: '0.75rem', color: T.t4 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          {!isForgot && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              minLength={6}
              style={inputStyle}
            />
          )}
          {error && <p style={{ fontSize: '0.75rem', color: T.danger, textAlign: 'center', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: T.accent, color: '#0f172a', fontWeight: 600, borderRadius: 12, padding: '12px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading
              ? 'Chargement…'
              : mode === 'login'  ? 'Se connecter'
              : mode === 'signup' ? 'Créer un compte'
              : 'Envoyer le lien'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('signup')} style={{ fontSize: '0.875rem', color: T.t3, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0' }}>
                Pas encore de compte ? S&apos;inscrire
              </button>
              <button onClick={() => switchMode('forgot')} style={{ fontSize: '0.75rem', color: T.t4, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0' }}>
                Mot de passe oublié ?
              </button>
            </>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <button onClick={() => switchMode('login')} style={{ fontSize: '0.875rem', color: T.t3, background: 'none', border: 'none', cursor: 'pointer' }}>
              Déjà un compte ? Se connecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
