'use client';

import { AlertTriangle } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center gap-6 px-8 pb-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white mb-2">Une erreur est survenue</h1>
        <p className="text-slate-400 text-sm">Quelque chose s&apos;est mal passé. Réessayez ou revenez à l&apos;accueil.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-xl px-5 py-2.5 text-sm transition-colors border border-slate-700"
        >
          Réessayer
        </button>
        <a
          href="/"
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
        >
          Accueil
        </a>
      </div>
      <BottomNav />
    </div>
  );
}
