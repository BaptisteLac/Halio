'use client';

import { useMemo } from 'react';
import { useWeekForecasts } from '@/hooks/useWeekForecasts';
import BottomNav from '@/components/layout/BottomNav';
import BestDayHero from '@/components/semaine/BestDayHero';
import WeekView from '@/components/semaine/WeekView';

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 max-w-lg mx-auto">
      <div className="h-24 bg-slate-800 rounded-xl" />
      <div className="h-64 bg-slate-800 rounded-xl" />
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
    <div className="min-h-dvh bg-slate-950 pb-20">
      <header className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800/80">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-base font-bold text-white">Cette semaine</h1>
            {weekRange && <p className="text-xs text-slate-400">{weekRange}</p>}
          </div>
          <div className="text-xs text-slate-400 bg-slate-800 rounded-md px-2 py-1">
            Bassin d&apos;Arcachon
          </div>
        </div>
      </header>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div className="p-4 max-w-lg mx-auto">
          <div className="bg-orange-950/40 border border-orange-800/40 rounded-xl p-4 text-center">
            <p className="text-orange-400 font-medium text-sm">Météo indisponible</p>
            <p className="text-slate-400 text-xs mt-1">
              Impossible de charger les prévisions — vérifiez votre connexion
            </p>
          </div>
        </div>
      )}

      {!loading && !error && days && bestDay && (
        <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
          <BestDayHero best={bestDay} />
          <WeekView days={days} bestDayDate={bestDay.date} todayDate={today} />
        </main>
      )}

      <BottomNav />
    </div>
  );
}
