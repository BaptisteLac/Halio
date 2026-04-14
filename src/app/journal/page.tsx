'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { TideData, WeatherData, SolunarData } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { getSolunarData } from '@/lib/solunar/solunar-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { createClient } from '@/lib/supabase/client';
import type { CatchRow } from '@/lib/supabase/types';

import BottomNav from '@/components/layout/BottomNav';
import AuthForm from '@/components/journal/AuthForm';
import CatchForm from '@/components/journal/CatchForm';
import CatchList from '@/components/journal/CatchList';
import CatchStats from '@/components/journal/CatchStats';

export default function JournalPage() {
  const [now] = useState(() => new Date());
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/moi');
    }
  }

  // Auth
  const [user, setUser]         = useState<User | null | undefined>(undefined); // undefined = loading
  const [catches, setCatches]   = useState<CatchRow[]>([]);

  // Conditions (pour auto-fill CatchForm)
  const [tideData, setTideData]       = useState<TideData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [solunarData, setSolunarData] = useState<SolunarData | null>(null);

  // UI
  const [showForm, setShowForm] = useState(false);

  // ── Auth state ────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Données marée + météo (quand connecté) ────────────────────────────────
  useEffect(() => {
    if (!user) return;

    Promise.all([getTideData(now), fetchWeatherData()])
      .then(([tide, weather]) => {
        setTideData(tide);
        setWeatherData(weather);
        setSolunarData(getSolunarData(now));
      })
      .catch(() => {/* conditions resteront nulles */});
  }, [user, now]);

  // ── Prises (quand connecté) ───────────────────────────────────────────────
  async function fetchCatches() {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('caught_at', { ascending: false });
    setCatches(data ?? []);
  }

  useEffect(() => {
    if (user) fetchCatches();
    else setCatches([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('catches').delete().eq('id', id);
    await fetchCatches();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  // ── Loading ───────────────────────────────────────────────────────────────
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

  // ── Non connecté ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="h-dvh flex flex-col bg-slate-950">
        <AuthForm />
        <BottomNav />
      </div>
    );
  }

  // ── Connecté ──────────────────────────────────────────────────────────────
  return (
    <div className="h-dvh flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-40">
        <div className="px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors p-1 -ml-1"
            aria-label="Retour"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">Journal</h1>
            <p className="text-xs text-slate-400 truncate max-w-[180px]">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 border border-slate-700 rounded-full px-3 py-1.5 hover:border-slate-500 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Stats + liste des prises */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {catches.length > 0 && (
          <div className="shrink-0 px-3 pt-3 max-w-lg mx-auto w-full">
            <CatchStats catches={catches} />
          </div>
        )}
        <CatchList catches={catches} onDelete={handleDelete} />
      </div>

      {/* Spacer BottomNav */}
      <div className="shrink-0 h-14" />

      {/* Bouton + flottant */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-16 right-4 z-30 w-12 h-12 bg-cyan-400 text-slate-900 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold hover:bg-cyan-300 transition-colors"
        aria-label="Nouvelle prise"
      >
        +
      </button>

      {/* Backdrop */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowForm(false)}
        />
      )}

      {/* Form bottom sheet */}
      <CatchForm
        visible={showForm}
        tideData={tideData}
        weatherData={weatherData}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          fetchCatches();
        }}
      />

      <BottomNav />
    </div>
  );
}
