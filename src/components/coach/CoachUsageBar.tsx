'use client';

import { useEffect, useState } from 'react';
import type { CoachUsage } from '@/hooks/useCoachUsage';
import { T } from '@/design/tokens';

function formatCountdown(resetAt: Date): string {
  const diff = resetAt.getTime() - Date.now();
  if (diff <= 0) return 'bientôt';
  const totalSeconds = Math.floor(diff / 1000);
  const hours   = Math.floor(totalSeconds / 3600);
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

  if (isLimitReached) {
    return (
      <div style={{ margin: '8px 16px 0', background: T.l2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '1rem', lineHeight: 1 }} aria-hidden="true">🔒</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t2 }}>Limite journalière atteinte</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: T.t3, margin: '0 0 8px' }}>
          Revenez demain — réinitialisation à minuit
          {countdown && <> · dans <span style={{ color: T.t3 }}>{countdown}</span></>}
        </p>
        <div style={{ height: 4, borderRadius: 9999, background: T.l3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', borderRadius: 9999, background: `${T.danger}60` }} />
        </div>
      </div>
    );
  }

  if (isWarning) {
    return (
      <div style={{ margin: '8px 16px 0', background: `${T.warn}10`, border: `1px solid ${T.warn}25`, borderRadius: 12, padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: T.warn }}>
            Plus que {remaining} message{remaining > 1 ? 's' : ''} aujourd&apos;hui
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 9999, background: T.l3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 9999, background: T.warn, width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '8px 16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', color: T.t4 }}>{count}/{limit} messages aujourd&apos;hui</span>
      </div>
      <div style={{ height: 4, borderRadius: 9999, background: T.l3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 9999, background: T.coach, width: `${progress}%`, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}
