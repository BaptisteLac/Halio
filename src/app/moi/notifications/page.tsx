'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Bell, BellOff, BellRing } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/components/layout/BottomNav';

const JOURS = [
  { id: 1, label: 'Lu' },
  { id: 2, label: 'Ma' },
  { id: 3, label: 'Me' },
  { id: 4, label: 'Je' },
  { id: 5, label: 'Ve' },
  { id: 6, label: 'Sa' },
  { id: 7, label: 'Di' },
];

type TimeRange = 'matin' | 'journee' | 'tous';

const TIME_RANGES: { id: TimeRange; label: string; detail: string }[] = [
  { id: 'matin',   label: 'Matin',    detail: '5h–12h' },
  { id: 'journee', label: 'Journée',  detail: '12h–20h' },
  { id: 'tous',    label: 'Tous',     detail: 'toute la journée' },
];

export default function NotificationsPage() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  const [user, setUser]                     = useState<User | null | undefined>(undefined);
  const [notifEnabled,  setNotifEnabled]    = useState(false);
  const [notifMinScore, setNotifMinScore]   = useState(70);
  const [notifDays,     setNotifDays]       = useState<number[]>([1,2,3,4,5,6,7]);
  const [timeRange,     setTimeRange]       = useState<TimeRange>('tous');
  const [pushStatus,    setPushStatus]      = useState<'default' | 'granted' | 'denied'>('default');
  const [saving,        setSaving]          = useState(false);
  const [saved,         setSaved]           = useState(false);

  // ── Auth + chargement ────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      supabase
        .from('user_settings')
        .select('notifications_enabled, notification_min_score, notification_days, notification_time_range, push_notifications_enabled')
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

    // Statut push actuel du navigateur
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (user === null) router.push('/moi');
  }, [user, router]);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  async function save(overrides?: {
    enabled?: boolean;
    minScore?: number;
    days?: number[];
    range?: TimeRange;
  }) {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      notifications_enabled:    overrides?.enabled  ?? notifEnabled,
      notification_min_score:   overrides?.minScore  ?? notifMinScore,
      notification_days:        overrides?.days      ?? notifDays,
      notification_time_range:  overrides?.range     ?? timeRange,
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

  async function requestPushPermission() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPushStatus(result);
    if (!user) return;
    const supabase = createClient();
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      push_notifications_enabled: result === 'granted',
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (user === undefined || !user) {
    return (
      <div className="h-dvh flex flex-col bg-slate-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 pb-24">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800">
        <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors p-1 -ml-1"
            aria-label="Retour"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-white flex-1">Notifications</h1>
          {saving && <span className="text-xs text-slate-400">Enregistrement…</span>}
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check size={12} /> Sauvegardé
            </span>
          )}
        </div>
      </header>

      <main className="px-4 py-4 space-y-5 max-w-lg mx-auto">

        {/* ── Alertes email ── */}
        <section className="space-y-1">
          <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1">Alertes email</h2>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">

            {/* Toggle */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                {notifEnabled
                  ? <Bell size={16} className="text-cyan-400" />
                  : <BellOff size={16} className="text-slate-500" />
                }
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white">Alerte bonne session</p>
                    {notifEnabled && (
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5 text-[10px] font-medium">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Email si le score de pêche est atteint</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const next = !notifEnabled;
                  setNotifEnabled(next);
                  save({ enabled: next });
                }}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifEnabled ? 'bg-cyan-400' : 'bg-slate-600'}`}
                aria-label={notifEnabled ? 'Désactiver' : 'Activer'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Seuil score */}
            {notifEnabled && (
              <div className="px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Score minimum pour être alerté</label>
                  <span className="text-sm font-bold text-cyan-400">{notifMinScore}/100</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={90}
                  step={5}
                  value={notifMinScore}
                  onChange={(e) => setNotifMinScore(Number(e.target.value))}
                  onMouseUp={() => save({ minScore: notifMinScore })}
                  onTouchEnd={() => save({ minScore: notifMinScore })}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Moyen (40)</span>
                  <span>Excellent (70)</span>
                  <span>Max (90)</span>
                </div>
              </div>
            )}

            {/* Jours */}
            {notifEnabled && (
              <div className="px-4 py-3 border-b border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">Jours de la semaine</p>
                <div className="flex gap-1.5">
                  {JOURS.map((jour) => {
                    const active = notifDays.includes(jour.id);
                    return (
                      <button
                        key={jour.id}
                        onClick={() => toggleDay(jour.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          active
                            ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {jour.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Créneau horaire */}
            {notifEnabled && (
              <div className="px-4 py-3">
                <p className="text-xs text-slate-400 mb-2">Créneau de vérification</p>
                <div className="flex gap-2">
                  {TIME_RANGES.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => {
                        setTimeRange(tr.id);
                        save({ range: tr.id });
                      }}
                      className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                        timeRange === tr.id
                          ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="block">{tr.label}</span>
                      <span className="block text-[10px] opacity-70">{tr.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Notifications push ── */}
        <section className="space-y-1">
          <h2 className="text-xs text-slate-400 font-medium uppercase tracking-wide px-1">Notifications push</h2>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-4">
            <div className="flex items-start gap-3">
              <BellRing size={20} className="text-cyan-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">Notifications navigateur</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Recevez des alertes directement sur votre appareil, même sans ouvrir l'application.
                </p>

                {pushStatus === 'granted' && (
                  <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-xs">
                    <Check size={12} />
                    Notifications accordées
                  </div>
                )}

                {pushStatus === 'denied' && (
                  <p className="mt-3 text-xs text-red-400">
                    Accès refusé. Modifiez les permissions dans les réglages de votre navigateur.
                  </p>
                )}

                {pushStatus === 'default' && (
                  <button
                    onClick={requestPushPermission}
                    className="mt-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg px-4 py-2 text-xs hover:bg-cyan-300 transition-colors"
                  >
                    Activer les notifications push
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
