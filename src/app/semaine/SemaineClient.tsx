'use client';

import { useMemo } from 'react';
import { useWeekForecasts } from '@/hooks/useWeekForecasts';
import BottomNav from '@/components/layout/BottomNav';
import BestDayHero from '@/components/semaine/BestDayHero';
import WeekView from '@/components/semaine/WeekView';
import { T } from '@/design/tokens';

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, maxWidth: 512, margin: '0 auto' }}>
      <div style={{ height: 96, background: T.l2, borderRadius: 14 }} />
      <div style={{ height: 260, background: T.l2, borderRadius: 14 }} />
    </div>
  );
}

export default function SemaineClient() {
  const { days, loading, error } = useWeekForecasts();
  const today = useMemo(() => new Date(), []);

  const bestDay = useMemo(() => {
    if (!days || days.length === 0) return null;
    return days.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), days[0]!);
  }, [days]);

  const weekRange = useMemo(() => {
    if (!days || days.length === 0) return '';
    const first = days[0]!.date;
    const last = days[days.length - 1]!.date;
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' };
    return `${first.toLocaleDateString('fr-FR', opts)} – ${last.toLocaleDateString('fr-FR', opts)}`;
  }, [days]);

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
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 512, margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0 }}>Cette semaine</h1>
            {weekRange && <p style={{ fontSize: '0.6875rem', color: T.t3, marginTop: 1 }}>{weekRange}</p>}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: T.t3,
            background: T.l3,
            borderRadius: 8,
            padding: '4px 8px',
          }}>
            Bassin d&apos;Arcachon
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <div style={{ padding: 16, maxWidth: 512, margin: '0 auto' }}>
            <div style={{
              background: 'rgba(120,53,15,.3)',
              border: '1px solid rgba(251,146,60,.2)',
              borderRadius: 14,
              padding: 16,
              textAlign: 'center',
            }}>
              <p style={{ color: T.warn, fontWeight: 500, fontSize: '0.875rem', margin: 0 }}>Météo indisponible</p>
              <p style={{ color: T.t3, fontSize: '0.75rem', marginTop: 4, margin: '4px 0 0' }}>
                Impossible de charger les prévisions — vérifiez votre connexion
              </p>
            </div>
          </div>
        )}

        {!loading && !error && days && !bestDay && (
          <div style={{ padding: 16, maxWidth: 512, margin: '0 auto' }}>
            <div style={{
              background: T.l2,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: 16,
              textAlign: 'center',
            }}>
              <p style={{ color: T.t2, fontWeight: 500, fontSize: '0.875rem', margin: 0 }}>Conditions difficiles</p>
              <p style={{ color: T.t3, fontSize: '0.75rem', marginTop: 4 }}>Aucun créneau optimal prévu cette semaine</p>
            </div>
          </div>
        )}

        {!loading && !error && days && bestDay && (
          <main style={{ padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 512, margin: '0 auto' }}>
            <BestDayHero best={bestDay} />
            <WeekView days={days} bestDayDate={bestDay.date} todayDate={today} />
          </main>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
