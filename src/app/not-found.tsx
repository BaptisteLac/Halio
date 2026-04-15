import Link from 'next/link';
import { Fish } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center gap-6 px-8 pb-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        <Fish size={28} className="text-slate-500" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white mb-2">Page introuvable</h1>
        <p className="text-slate-400 text-sm">Cette page n&apos;existe pas ou a été déplacée.</p>
      </div>
      <Link
        href="/"
        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
      <BottomNav />
    </div>
  );
}
