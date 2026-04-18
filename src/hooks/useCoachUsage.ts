'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const DAILY_LIMIT = 10;
const PARIS_TZ = 'Europe/Paris';

export interface CoachUsage {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  isWarning: boolean; // true si remaining <= 2
  resetAt: Date | null;
  loading: boolean;
  refresh: () => void;
}

/** Retourne minuit Paris ce soir (en UTC). */
function getParisResetAt(): Date {
  const todayParis = new Intl.DateTimeFormat('fr-CA', { timeZone: PARIS_TZ }).format(new Date());
  const [yr, mo, dy] = todayParis.split('-').map(Number);
  // Minuit UTC pour la date "demain Paris"
  const tomorrowMidnightUTC = Date.UTC(yr, mo - 1, dy + 1);
  // Trouver l'offset Paris à ce moment (UTC+1 hiver, UTC+2 été)
  const testDate = new Date(tomorrowMidnightUTC);
  const parisHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: PARIS_TZ,
      hour: 'numeric',
      hour12: false,
    }).format(testDate),
    10,
  );
  const parisOffsetHours = parisHour <= 12 ? parisHour : parisHour - 24;
  return new Date(tomorrowMidnightUTC - parisOffsetHours * 3_600_000);
}

export function useCoachUsage(): CoachUsage {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCount(0);
        return;
      }
      const today = new Intl.DateTimeFormat('fr-CA', { timeZone: PARIS_TZ }).format(new Date());
      const { data } = await supabase
        .from('coach_usage')
        .select('messages_today, reset_date')
        .eq('user_id', user.id)
        .maybeSingle();

      // Si reset_date < aujourd'hui → nouveau jour, compteur à 0 (l'API réinitialisera côté serveur)
      if (!data || data.reset_date < today) {
        setCount(0);
      } else {
        setCount(data.messages_today ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remaining = Math.max(0, DAILY_LIMIT - count);

  return {
    count,
    limit: DAILY_LIMIT,
    remaining,
    isLimitReached: remaining === 0,
    isWarning: remaining <= 2 && remaining > 0,
    resetAt: getParisResetAt(),
    loading,
    refresh: load,
  };
}
