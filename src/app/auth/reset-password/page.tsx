'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      if (updateError.message.includes('Password should be at least')) {
        setError('Le mot de passe doit faire au moins 6 caractères');
      } else {
        setError(updateError.message);
      }
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/journal'), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 pb-20">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🔑</p>
          <h2 className="text-white font-bold text-xl">Nouveau mot de passe</h2>
          <p className="text-slate-400 text-sm mt-1">Choisissez un nouveau mot de passe pour votre compte</p>
        </div>

        {done ? (
          <div className="bg-green-400/10 border border-green-400/30 rounded-xl px-4 py-4 text-center space-y-1">
            <p className="text-green-400 font-semibold text-sm">Mot de passe mis à jour !</p>
            <p className="text-slate-400 text-xs">Redirection vers le journal…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 text-slate-900 font-semibold rounded-xl py-3 text-sm disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Mise à jour…' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
