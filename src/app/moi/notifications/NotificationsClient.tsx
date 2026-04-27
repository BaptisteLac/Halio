'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Bell, BellOff, BellRing } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { T } from '@/design/tokens';
import { IChevRight } from '@/design/icons';
import BottomNav from '@/components/layout/BottomNav';

const JOURS = [
  { id: 1, label: 'Lu' }, { id: 2, label: 'Ma' }, { id: 3, label: 'Me' },
  { id: 4, label: 'Je' }, { id: 5, label: 'Ve' }, { id: 6, label: 'Sa' }, { id: 7, label: 'Di' },
];

type TimeRange = 'matin' | 'journee' | 'tous';

const TIME_RANGES: { id: TimeRange; label: string; detail: string }[] = [
  { id: 'matin',   label: 'Matin',   detail: '5h–12h' },
  { id: 'journee', label: 'Journée', detail: '12h–20h' },
  { id: 'tous',    label: 'Tous',    detail: 'toute la journée' },
];

const sectionLabel: React.CSSProperties = {
  fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.t4, marginBottom: 6,
};

export default function NotificationsClient() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  const [user,          setUser]          = useState<User | null | undefined>(undefined);
  const [notifEnabled,  setNotifEnabled]  = useState(false);
  const [notifMinScore, setNotifMinScore] = useState(70);
  const [notifDays,     setNotifDays]     = useState<number[]>([1,2,3,4,5,6,7]);
  const [timeRange,     setTimeRange]     = useState<TimeRange>('tous');
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      supabase
        .from('user_settings')
        .select('notifications_enabled, notification_min_score, notification_days, notification_time_range')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: s }) => {
          if (s) {
            setNotifEnabled(s.notifications_enabled ?? false);
            setNotifMinScore(s.notification_min_score ?? 70);
            setNotifDays(s.notification_days ?? [1,2,3,4,5,6,7]);
            setTimeRange((s.notification_time_range as TimeRange) ?? 'tous');
          }
        });
    });
  }, []);

  useEffect(() => {
    if (user === null) router.push('/moi');
  }, [user, router]);

  async function save(overrides?: { enabled?: boolean; minScore?: number; days?: number[]; range?: TimeRange }) {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      notifications_enabled:   overrides?.enabled   ?? notifEnabled,
      notification_min_score:  overrides?.minScore   ?? notifMinScore,
      notification_days:       overrides?.days       ?? notifDays,
      notification_time_range: overrides?.range      ?? timeRange,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleDay(dayId: number) {
    const next = notifDays.includes(dayId)
      ? notifDays.filter((d) => d !== dayId)
      : [...notifDays, dayId].sort((a, b) => a - b);
    setNotifDays(next);
    save({ days: next });
  }

  if (user === undefined || !user) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
      <header style={{ background: T.l1, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: '12px 16px', maxWidth: 512, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} aria-label="Retour" style={{ padding: 6, marginLeft: -6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <IChevRight size={22} color={T.t3} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0, flex: 1 }}>Notifications</h1>
          {saving && <span style={{ fontSize: '0.75rem', color: T.t4 }}>Enregistrement…</span>}
          {saved  && <span style={{ fontSize: '0.75rem', color: T.ok, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Sauvegardé</span>}
        </div>
      </header>

      <main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 512, margin: '0 auto' }}>

        <section>
          <p style={sectionLabel}>Alertes email</p>
          <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>

            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: notifEnabled ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {notifEnabled
                  ? <Bell size={16} color={T.accent} />
                  : <BellOff size={16} color={T.t4} />}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: '0.875rem', color: T.t1, margin: 0 }}>Alerte bonne session</p>
                    {notifEnabled && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: T.ok, background: `${T.ok}15`, border: `1px solid ${T.ok}30`, borderRadius: 9999, padding: '2px 8px' }}>
                        Actif
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0 }}>Email si le score de pêche est atteint</p>
                </div>
              </div>
              <button
                onClick={() => { const next = !notifEnabled; setNotifEnabled(next); save({ enabled: next }); }}
                aria-label={notifEnabled ? 'Désactiver' : 'Activer'}
                style={{ position: 'relative', width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer', background: notifEnabled ? T.accent : T.l3, transition: 'background 0.2s ease', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: 2, left: notifEnabled ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'left 0.2s ease' }} />
              </button>
            </div>

            {notifEnabled && (
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: T.t3 }}>Score minimum pour être alerté</label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: T.accent }}>{notifMinScore}/100</span>
                </div>
                <input
                  type="range" min={40} max={90} step={5} value={notifMinScore}
                  onChange={(e) => setNotifMinScore(Number(e.target.value))}
                  onMouseUp={() => save({ minScore: notifMinScore })}
                  onTouchEnd={() => save({ minScore: notifMinScore })}
                  onKeyUp={(e) => save({ minScore: Number((e.target as HTMLInputElement).value) })}
                  style={{ width: '100%', accentColor: T.accent }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: T.t4, marginTop: 4 }}>
                  <span>Moyen (40)</span><span>Excellent (70)</span><span>Max (90)</span>
                </div>
              </div>
            )}

            {notifEnabled && (
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                <p style={{ fontSize: '0.75rem', color: T.t3, marginBottom: 8 }}>Jours de la semaine</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {JOURS.map((jour) => {
                    const active = notifDays.includes(jour.id);
                    return (
                      <button
                        key={jour.id}
                        onClick={() => toggleDay(jour.id)}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? `${T.accent}40` : T.border}`, background: active ? `${T.accent}15` : T.l3, color: active ? T.accent : T.t3 }}
                      >
                        {jour.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {notifEnabled && (
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: '0.75rem', color: T.t3, marginBottom: 8 }}>Créneau de vérification</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {TIME_RANGES.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => { setTimeRange(tr.id); save({ range: tr.id }); }}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${timeRange === tr.id ? `${T.accent}40` : T.border}`, background: timeRange === tr.id ? `${T.accent}15` : T.l3, color: timeRange === tr.id ? T.accent : T.t3 }}
                    >
                      <span style={{ display: 'block' }}>{tr.label}</span>
                      <span style={{ display: 'block', opacity: 0.7, fontSize: '0.6875rem' }}>{tr.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <p style={sectionLabel}>Notifications push</p>
          <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <BellRing size={20} color={T.t4} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t3, margin: '0 0 2px' }}>Notifications navigateur</p>
                <p style={{ fontSize: '0.75rem', color: T.t4, lineHeight: 1.5, margin: 0 }}>
                  Fonctionnalité à venir — disponible dans une prochaine mise à jour.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
