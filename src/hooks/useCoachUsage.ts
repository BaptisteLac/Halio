'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { COACH_DAILY_LIMIT } from '@/lib/coach/constants';

const PARIS_TZ = 'Europe/Paris';

export interface CoachUsage {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  isWarning: boolean;
  resetAt: Date | null;
  loading: boolean;
  refresh: () => void;
}

function getParisResetAt(): Date {
  const todayParis = new Intl.DateTimeFormat('fr-CA', { timeZone: PARIS_TZ }).format(new Date());
  const [yr, mo, dy] = todayParis.split('-').map(Number);
  const tomorrowMidnightUTC = Date.UTC(yr, mo - 1, dy + 1);
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

  const remaining = Math.max(0, COACH_DAILY_LIMIT - count);

  return {
    count,
    limit: COACH_DAILY_LIMIT,
    remaining,
    isLimitReached: remaining === 0,
    isWarning: remaining <= 2 && remaining > 0,
    resetAt: getParisResetAt(),
    loading,
    refresh: load,
  };
}
