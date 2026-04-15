'use client';

import { useEffect, useState } from 'react';
import type { CoachUsage } from '@/hooks/useCoachUsage';

function formatCountdown(resetAt: Date): string {
  const diff = resetAt.getTime() - Date.now();
  if (diff <= 0) return 'bientôt';
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

interface Props {
  usage: CoachUsage;
}

export default function CoachUsageBar({ usage }: Props) {
  const { count, limit, remaining, isLimitReached, isWarning, resetAt } = usage;
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!isLimitReached || !resetAt) return;
    const update = () => setCountdown(formatCountdown(resetAt));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isLimitReached, resetAt]);

  const progress = Math.min(100, (count / limit) * 100);

  // --- État 3 : limite atteinte ---
  if (isLimitReached) {
    return (
      <div className="mx-4 mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base leading-none" aria-hidden="true">🔒</span>
          <span className="text-sm font-medium text-slate-200">Limite journalière atteinte</span>
        </div>
        <p className="text-xs text-slate-400 mb-2">
          Revenez demain — réinitialisation à minuit
          {countdown && (
            <> · Réinitialisation dans <span className="text-slate-400">{countdown}</span></>
          )}
        </p>
        <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full w-full rounded-full bg-red-400/50" />
        </div>
      </div>
    );
  }

  // --- État 2 : alerte (≤ 2 messages restants) ---
  if (isWarning) {
    return (
      <div className="mx-4 mt-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-amber-400">
            ⚠️ Plus que {remaining} message{remaining > 1 ? 's' : ''} aujourd&apos;hui
          </span>
        </div>
        <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // --- État 1 : normal ---
  return (
    <div className="mx-4 mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-400">
          {count}/{limit} messages aujourd&apos;hui
        </span>
      </div>
      <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
