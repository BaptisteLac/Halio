import type { SolunarData } from '@/types';
import { T } from '@/design/tokens';
import { ISun, IMoon, IClock } from '@/design/icons';

interface Props {
  solunar: SolunarData;
  now: Date;
  compact?: boolean;
}

function fmt(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

const MOON_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

export default function SolunarIndicator({ solunar, now, compact = false }: Props) {
  const moonEmoji = MOON_EMOJIS[Math.round(solunar.moonPhase * 8) % 8];
  const moonLabel = solunar.moonPhaseName;
  const { currentPeriod } = solunar;

  const nextPeriod = solunar.periods.find((p) => p.start > now);
  const minutesToNext = nextPeriod
    ? Math.round((nextPeriod.start.getTime() - now.getTime()) / 60000)
    : null;

  const nextMajor = solunar.periods.find((p) => p.type === 'majeure' && p.start > now) ?? null;

  if (compact) {
    return (
      <div style={{
        background: T.l2,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 500, color: T.t3, margin: 0 }}>Solunaire</h3>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: T.t1, margin: 0 }}>
          {moonEmoji} {moonLabel}
        </p>
        <div style={{ fontSize: '0.75rem', color: T.t3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nextMajor && (
            <p style={{ margin: 0 }}>★ Majeure : {fmt(nextMajor.start)}</p>
          )}
          <p style={{ margin: 0 }}>Soleil : {fmt(solunar.sunrise)} – {fmt(solunar.sunset)}</p>
          {solunar.moonrise && <p style={{ margin: 0 }}>Lune : {fmt(solunar.moonrise)}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: T.l2,
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t2, margin: 0 }}>Solunaire & Lune</h3>
        {currentPeriod ? (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 9999,
            border: `1px solid ${currentPeriod === 'majeure' ? 'rgba(34,211,238,.3)' : 'rgba(250,204,21,.3)'}`,
            background: currentPeriod === 'majeure' ? 'rgba(34,211,238,.1)' : 'rgba(250,204,21,.1)',
            color: currentPeriod === 'majeure' ? T.accent : '#facc15',
          }}>
            Période {currentPeriod}
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: T.t4 }}>Hors période</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{moonEmoji}</span>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t1, margin: 0 }}>{solunar.moonPhaseName}</p>
          <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0 }}>{Math.round(solunar.moonFraction * 100)}% illuminée</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px 16px',
        fontSize: '0.75rem',
        color: T.t3,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ISun size={11} color="#facc15" />
          <span>Lever {fmt(solunar.sunrise)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ISun size={11} color="#fb923c" />
          <span>Coucher {fmt(solunar.sunset)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IMoon size={11} color={T.t2} />
          <span>Lever {fmt(solunar.moonrise)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IMoon size={11} color={T.t3} />
          <span>Coucher {fmt(solunar.moonset)}</span>
        </div>
      </div>

      {nextPeriod && minutesToNext !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          fontSize: '0.75rem',
          color: T.t3,
          paddingTop: 8,
          borderTop: `1px solid ${T.border}`,
        }}>
          <IClock size={11} color={T.t3} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Prochaine {nextPeriod.type} dans{' '}
            <span style={{ color: T.t1, fontWeight: 500 }}>{formatDuration(minutesToNext)}</span>
            {' '}({fmt(nextPeriod.start)} – {fmt(nextPeriod.end)})
          </span>
        </div>
      )}
    </div>
  );
}
