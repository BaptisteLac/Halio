'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { TideData, WeatherData } from '@/types';
import { getTideData } from '@/lib/tides/tide-service';
import { fetchWeatherData } from '@/lib/weather/weather-service';
import { createClient } from '@/lib/supabase/client';
import type { CatchRow } from '@/lib/supabase/types';
import { T } from '@/design/tokens';
import { IChevRight, IPlus } from '@/design/icons';

import BottomNav from '@/components/layout/BottomNav';
import AuthForm from '@/components/journal/AuthForm';
import CatchForm from '@/components/journal/CatchForm';
import CatchList from '@/components/journal/CatchList';
import CatchStats from '@/components/journal/CatchStats';

export default function JournalClient() {
  const [now] = useState(() => new Date());
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  const [user,    setUser]    = useState<User | null | undefined>(undefined);
  const [catches, setCatches] = useState<CatchRow[]>([]);

  const [tideData,    setTideData]    = useState<TideData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const [showForm,          setShowForm]          = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([getTideData(now), fetchWeatherData()])
      .then(([tide, weather]) => { setTideData(tide); setWeatherData(weather); })
      .catch(() => {});
  }, [user, now]);

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

  if (user === undefined) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <AuthForm />
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page, overflow: 'hidden' }}>
      <header style={{
        flexShrink: 0,
        background: T.l1,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
        zIndex: 40,
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 512, margin: '0 auto' }}>
          <button
            onClick={handleBack}
            aria-label="Retour"
            style={{ padding: 6, marginLeft: -6, borderRadius: 8, background: 'none', border: 'none', color: T.t3, cursor: 'pointer', display: 'flex' }}
          >
            <IChevRight size={20} color={T.t3} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0 }}>Journal</h1>
            <p style={{ fontSize: '0.6875rem', color: T.t3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
              {user.email}
            </p>
          </div>
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{ fontSize: '0.75rem', color: T.t3, border: `1px solid ${T.border}`, borderRadius: 9999, padding: '6px 12px', background: 'none', cursor: 'pointer' }}
            >
              Déconnexion
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handleLogout}
                style={{ fontSize: '0.75rem', color: T.danger, border: `1px solid rgba(239,68,68,.4)`, borderRadius: 9999, padding: '6px 12px', background: 'none', cursor: 'pointer' }}
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ fontSize: '0.75rem', color: T.t3, border: `1px solid ${T.border}`, borderRadius: 9999, padding: '6px 8px', background: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {catches.length > 0 && (
          <div style={{ flexShrink: 0, padding: '12px 16px 0', maxWidth: 512, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <CatchStats catches={catches} />
          </div>
        )}
        {catches.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center', gap: 16 }}>
            <p style={{ fontSize: '2.5rem', margin: 0 }}>🎣</p>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: T.t1, margin: '0 0 4px' }}>Aucune prise enregistrée</p>
              <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>Commencez à tracer vos sessions de pêche.</p>
            </div>
            <button
              onClick={() => { navigator.vibrate?.(10); setShowForm(true); }}
              style={{ background: T.accent, color: '#0f172a', fontWeight: 600, borderRadius: 12, padding: '12px 24px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
            >
              Première prise
            </button>
          </div>
        ) : (
          <CatchList catches={catches} onDelete={handleDelete} />
        )}
      </div>

      <button
        onClick={() => { navigator.vibrate?.(10); setShowForm(true); }}
        aria-label="Nouvelle prise"
        style={{
          position: 'fixed',
          bottom: 'calc(4rem + env(safe-area-inset-bottom))',
          right: 16,
          zIndex: 30,
          width: 48,
          height: 48,
          background: T.accent,
          color: '#0f172a',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(34,211,238,.35)',
        }}
      >
        <IPlus size={22} color="#0f172a" />
      </button>

      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 30 }}
        />
      )}

      <CatchForm
        visible={showForm}
        tideData={tideData}
        weatherData={weatherData}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); fetchCatches(); }}
      />

      <BottomNav />
    </div>
  );
}
