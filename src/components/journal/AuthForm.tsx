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

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

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

        {/* Bouton Google — affiché uniquement sur login et signup */}
        {!isForgot && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold rounded-xl py-3 text-sm hover:bg-slate-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-400 text-xs">ou</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>
          </div>
        )}

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
                className="block w-full text-slate-400 text-sm hover:text-slate-200 transition-colors py-3"
              >
                Pas encore de compte ? S&apos;inscrire
              </button>
              <button
                onClick={() => switchMode('forgot')}
                className="block w-full text-slate-400 text-xs hover:text-slate-200 transition-colors py-3"
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
