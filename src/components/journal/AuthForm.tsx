'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

export default function AuthForm() {
  const [mode, setMode]                     = useState<Mode>('login');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [error, setError]                   = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [sent, setSent]                     = useState(false); // email de confirmation / reset envoyé
  const [needsConfirmation, setNeedsConfirmation] = useState(false); // compte non confirmé

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
      const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      setLoading(false);
      if (resetError) {
        setError(toFrench(resetError.message));
      } else {
        setSent(true);
      }
      return;
    }

    if (mode === 'signup') {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (signupError) {
        setError(toFrench(signupError.message));
      } else {
        setSent(true);
      }
      return;
    }

    // login
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      if (loginError.message.includes('Email not confirmed')) {
        setNeedsConfirmation(true);
      } else {
        setError(toFrench(loginError.message));
      }
    }
  }

  // ── Écran "email envoyé" ────────────────────────────────────────────────────
  if (sent) {
    const isReset = mode === 'forgot';
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <p className="text-5xl">📧</p>
          <div>
            <h2 className="text-white font-bold text-xl">Email envoyé !</h2>
            <p className="text-slate-400 text-sm mt-2">
              {isReset
                ? 'Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.'
                : 'Vérifiez votre boîte mail et cliquez sur le lien pour activer votre compte.'}
            </p>
          </div>
          <button
            onClick={() => switchMode('login')}
            className="text-slate-400 text-sm hover:text-slate-200 transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // ── Écran "compte non confirmé" ────────────────────────────────────────────
  if (needsConfirmation) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <p className="text-5xl">✉️</p>
          <div>
            <h2 className="text-white font-bold text-xl">Email non confirmé</h2>
            <p className="text-slate-400 text-sm mt-2">
              Votre compte existe mais l&apos;email <span className="text-slate-200">{email}</span> n&apos;a pas encore été confirmé.
              Renvoyez le lien d&apos;activation pour pouvoir vous connecter.
            </p>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleResend}
            disabled={loading}
            className="w-full bg-cyan-400 text-slate-900 font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Envoi…' : "Renvoyer l'email de confirmation"}
          </button>
          <button
            onClick={() => switchMode('login')}
            className="block w-full text-slate-400 text-sm hover:text-slate-200 transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────────
  const isForgot = mode === 'forgot';

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🎣</p>
          <h2 className="text-white font-bold text-xl">Journal de pêche</h2>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'login'  && 'Connectez-vous pour accéder à vos prises'}
            {mode === 'signup' && 'Créez un compte pour commencer à logger'}
            {isForgot          && 'Entrez votre email pour réinitialiser votre mot de passe'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
          />

          {!isForgot && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          )}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-400 text-slate-900 font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity"
          >
            {loading
              ? 'Chargement…'
              : mode === 'login'  ? 'Se connecter'
              : mode === 'signup' ? 'Créer un compte'
              : 'Envoyer le lien'}
          </button>
        </form>

        <div className="space-y-2 text-center">
          {mode === 'login' && (
            <>
              <button
                onClick={() => switchMode('signup')}
                className="block w-full text-slate-400 text-sm hover:text-slate-200 transition-colors"
              >
                Pas encore de compte ? S&apos;inscrire
              </button>
              <button
                onClick={() => switchMode('forgot')}
                className="block w-full text-slate-600 text-xs hover:text-slate-400 transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <button
              onClick={() => switchMode('login')}
              className="block w-full text-slate-400 text-sm hover:text-slate-200 transition-colors"
            >
              Déjà un compte ? Se connecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
