import type { WeekDay } from '@/types';
import { T, scoreColor, scoreLabel } from '@/design/tokens';
import { IClock, IFish } from '@/design/icons';

interface Props {
  best: WeekDay;
}

function fmt(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

export default function BestDayHero({ best }: Props) {
  if (best.score < 65) {
    return (
      <div style={{
        background: 'rgba(120,53,15,.25)',
        border: '1px solid rgba(251,146,60,.2)',
        borderRadius: 14,
        padding: 16,
      }}>
        <p style={{ fontSize: '0.6875rem', color: 'rgba(251,146,60,.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Cette semaine</p>
        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: T.t1, margin: 0 }}>Conditions difficiles</p>
        <p style={{ fontSize: '0.875rem', color: 'rgba(251,146,60,.7)', marginTop: 4 }}>
          Aucun créneau optimal prévu — score max : {best.score}/100
        </p>
      </div>
    );
  }

  const dayLabel = best.date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  });

  const color = scoreColor(best.score);
  const label = scoreLabel(best.score);

  return (
    <div style={{
      background: 'linear-gradient(135deg, oklch(15% .02 145), oklch(7% .012 230))',
      border: `1px solid ${color}22`,
      borderRadius: 14,
      padding: 16,
    }}>
      <p style={{ fontSize: '0.6875rem', color: 'rgba(74,222,128,.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        ★ Meilleur créneau de la semaine
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', textTransform: 'capitalize', margin: 0 }}>{dayLabel}</p>
          {best.bestWindowStart && best.bestWindowEnd && (
            <p style={{ fontSize: '0.875rem', color: color, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IClock size={13} color={color} />
              {fmt(best.bestWindowStart)} → {fmt(best.bestWindowEnd)}
            </p>
          )}
          <p style={{ fontSize: '0.875rem', color: T.t3, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <IFish size={13} color={T.t3} />
            {best.topSpeciesName} · coeff {best.coefficient} · {best.windDir} {best.windKnots.toFixed(0)} kt
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.04em', color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', margin: 0 }}>{best.score}</p>
          <p style={{ fontSize: '0.75rem', color, marginTop: 2 }}>{label}</p>
        </div>
      </div>
    </div>
  );
}
