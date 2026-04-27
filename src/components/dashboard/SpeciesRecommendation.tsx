import Link from 'next/link';
import type { Species, FishingScore, Spot } from '@/types';
import { T, scoreColor } from '@/design/tokens';
import { IMapPin, ILayers } from '@/design/icons';

interface Props {
  topSpecies: Array<{ species: Species; score: FishingScore; spot: Spot }>;
}

function ScoreDot({ score }: { score: number }) {
  return (
    <div style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: scoreColor(score),
      flexShrink: 0,
    }} />
  );
}

export default function SpeciesRecommendation({ topSpecies }: Props) {
  if (topSpecies.length === 0) return null;

  const [first, ...rest] = topSpecies;
  const firstBg = first.score.total >= 70 ? 'rgba(34,211,238,.1)' : T.l3;
  const firstBorder = first.score.total >= 70 ? 'rgba(34,211,238,.25)' : T.border;

  return (
    <div style={{
      background: T.l2,
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t2, margin: 0 }}>Espèces recommandées</h3>

      <Link
        href={`/especes/${first.species.slug}`}
        style={{
          display: 'block',
          borderRadius: 10,
          padding: 12,
          border: `1px solid ${firstBorder}`,
          background: firstBg,
          textDecoration: 'none',
          transition: 'opacity 0.12s ease',
        }}
        className="active:opacity-70"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              <span style={{ color: T.t1, fontWeight: 600, fontSize: '0.875rem' }}>{first.species.name}</span>
              {first.species.localNames.length > 0 && (
                <span style={{ color: T.t3, fontSize: '0.75rem', marginLeft: 6 }}>({first.species.localNames[0]})</span>
              )}
            </div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.t3, fontSize: '0.75rem', margin: 0 }}>
              <IMapPin size={11} color={T.t3} />
              {first.spot.name}
            </p>
            {first.species.lures.length > 0 && (
              <p style={{ color: T.t3, fontSize: '0.75rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ILayers size={11} color={T.t3} />
                {first.species.lures[0].name}
                {first.species.lures[1] ? ` · ${first.species.lures[1].name}` : ''}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ScoreDot score={first.score.total} />
            <span style={{ fontWeight: 700, fontSize: '1.125rem', color: scoreColor(first.score.total), fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {first.score.total}
            </span>
          </div>
        </div>
      </Link>

      {rest.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rest.map(({ species, score, spot }) => (
            <Link
              key={species.id}
              href={`/especes/${species.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                padding: '8px 4px',
                borderRadius: 10,
                minHeight: 44,
                textDecoration: 'none',
                transition: 'opacity 0.12s ease',
              }}
              className="active:opacity-70"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <ScoreDot score={score.total} />
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: T.t2, fontSize: '0.875rem' }}>{species.name}</span>
                  <span style={{ color: T.t3, fontSize: '0.75rem', marginLeft: 6 }}>· {spot.name}</span>
                </div>
              </div>
              <span style={{ fontWeight: 500, color: scoreColor(score.total), fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {score.total}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
