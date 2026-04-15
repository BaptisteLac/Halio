'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Star, Bell, User, ChevronRight } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import BottomNav from '@/components/layout/BottomNav';

interface MiniStats {
  catchCount: number;
  topSpeciesName: string | null;
  topSpotName: string | null;
}

export default function MoiClient() {
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [stats, setStats] = useState<MiniStats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setStats(null); return; }
    const supabase = createClient();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

    supabase
      .from('catches')
      .select('species_id, spot_id')
      .eq('user_id', user.id)
      .gte('caught_at', yearStart)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setStats({ catchCount: 0, topSpeciesName: null, topSpotName: null });
          return;
        }

        const speciesCount: Record<string, number> = {};
        const spotCount: Record<string, number> = {};
        for (const row of data) {
          speciesCount[row.species_id] = (speciesCount[row.species_id] ?? 0) + 1;
          spotCount[row.spot_id] = (spotCount[row.spot_id] ?? 0) + 1;
        }

        const topSpeciesId = Object.entries(speciesCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const topSpotId = Object.entries(spotCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        setStats({
          catchCount: data.length,
          topSpeciesName: topSpeciesId ? (SPECIES.find((s) => s.id === topSpeciesId)?.name ?? null) : null,
          topSpotName: topSpotId ? (SPOTS.find((s) => s.id === topSpotId)?.name ?? null) : null,
        });
      });
  }, [user]);

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

  if (!user) {
    return (
      <div className="h-dvh flex flex-col bg-slate-950">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="text-5xl">🎣</div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Bienvenue sur PêcheBoard</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connectez-vous pour accéder à votre journal de pêche, vos préférences et vos alertes.
            </p>
          </div>
          <Link
            href="/journal"
            className="bg-cyan-400 text-slate-900 font-semibold rounded-xl px-8 py-3 text-sm hover:bg-cyan-300 transition-colors"
          >
            Se connecter
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 pb-24">
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-base font-bold text-white">Mon profil</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">

        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-400/15 rounded-full flex items-center justify-center shrink-0">
            <User size={20} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{user.email ?? 'Utilisateur'}</p>
            <p className="text-slate-400 text-xs">Pêcheur du Bassin</p>
          </div>
        </div>

        {stats !== null && (
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-3">
            {stats.catchCount === 0 ? (
              <p className="text-slate-400 text-sm text-center py-1">
                Aucune prise enregistrée —{' '}
                <Link href="/journal" className="text-cyan-400 underline">
                  commencez votre journal
                </Link>
              </p>
            ) : (
              <div className="flex items-center justify-around text-center gap-2">
                <div>
                  <p className="text-xl font-bold text-cyan-400">{stats.catchCount}</p>
                  <p className="text-[10px] text-slate-400">prises cette année</p>
                </div>
                {stats.topSpeciesName && (
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-[90px]">{stats.topSpeciesName}</p>
                    <p className="text-[10px] text-slate-400">espèce favorite</p>
                  </div>
                )}
                {stats.topSpotName && (
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-[90px]">{stats.topSpotName}</p>
                    <p className="text-[10px] text-slate-400">spot favori</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden divide-y divide-slate-700/50">
          <Link
            href="/journal"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <BookOpen size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Journal de pêche</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
          <Link
            href="/moi/preferences"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <Star size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Mes préférences</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
          <Link
            href="/moi/notifications"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <Bell size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Notifications</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
          <Link
            href="/moi/compte"
            className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors"
          >
            <User size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-200 flex-1">Mon compte</span>
            <ChevronRight size={16} className="text-slate-600" />
          </Link>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
