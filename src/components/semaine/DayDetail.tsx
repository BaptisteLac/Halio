import type { WeekDay, DaySpecies } from '@/types';
import { T, scoreColor } from '@/design/tokens';

interface Props {
  day: WeekDay;
}

function fmt(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function SpeciesRow({ s }: { s: DaySpecies }) {
  const color = scoreColor(s.score);
  const barWidth = Math.round((s.score / 100) * 40);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 0',
      borderBottom: `1px solid ${T.border}`,
    }}
    className="last:border-0"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', color: T.t1, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
        {s.lure && (
          <p style={{ fontSize: '0.6875rem', color: T.t3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.lure}</p>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {s.windowStart ? (
          <p style={{ fontSize: '0.6875rem', color: T.accent, fontWeight: 500, fontVariantNumeric: 'tabular-nums', margin: 0 }}>
            {fmt(s.windowStart)}{s.windowEnd ? ` → ${fmt(s.windowEnd)}` : ''}
          </p>
        ) : (
          <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>—</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0, width: 40 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>{s.score}</span>
        <div style={{ height: 4, width: 40, background: T.l2, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            borderRadius: 999,
            background: color,
            width: `${barWidth}px`,
          }} />
        </div>
      </div>
    </div>
  );
}

export default function DayDetail({ day }: Props) {
  return (
    <div style={{
      background: T.l3,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Coefficient', value: String(day.coefficient), color: T.accent },
          { label: 'Vent', value: `${day.windDir} ${day.windKnots.toFixed(0)} kt`, color: day.isHighWind ? T.warn : T.t1 },
          { label: 'Meilleure fenêtre', value: day.bestWindowStart ? fmt(day.bestWindowStart) : '—', color: T.t1 },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: T.l2,
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.6875rem', color: T.t4, margin: '0 0 2px' }}>{label}</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {day.topSpecies.length > 0 && (
        <div style={{
          background: T.l2,
          borderRadius: 8,
          padding: '4px 12px',
        }}>
          <p style={{
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: T.t4,
            padding: '6px 0 4px',
            margin: 0,
          }}>
            Espèces de saison · fenêtres de tir
          </p>
          {day.topSpecies.map((s) => (
            <SpeciesRow key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
