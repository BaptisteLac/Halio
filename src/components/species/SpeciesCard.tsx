import Link from 'next/link';
import type { Species } from '@/types';
import type { FishingScore } from '@/types';
import { getFishingScoreColor, getFishingScoreLabel } from '@/lib/scoring/fishing-score';
import { T, scoreColor } from '@/design/tokens';
import { SeasonDot } from '@/design/primitives';
import { IMapPin } from '@/design/icons';

interface Props {
  species: Species;
  score?: FishingScore;
  spotName?: string;
  isInSeason: boolean;
}

const TECHNIQUE_LABELS: Record<string, string> = {
  'leurre-souple':  'Leurre souple',
  'leurre-surface': 'Surface',
  'poisson-nageur': 'Poisson nageur',
  vif:              'Vif',
  verticale:        'Verticale',
  traine:           'Traîne',
  mouche:           'Mouche',
  surf:             'Surfcasting',
  jigging:          'Jigging',
  posé:             'Posé',
  palangrotte:      'Palangrotte',
  casier:           'Casier',
  sèche:            'Sèche (seiche)',
};

export default function SpeciesCard({ species, score, spotName, isInSeason }: Props) {
  const total = score?.total;
  const scoreLabel = total !== undefined ? getFishingScoreLabel(total) : '—';
  const color = total !== undefined ? scoreColor(total) : T.t3;

  return (
    <Link
      href={`/especes/${species.slug}`}
      style={{
        display: 'block',
        background: T.l2,
        borderRadius: 14,
        padding: 12,
        textDecoration: 'none',
        transition: 'transform 0.12s ease, opacity 0.12s ease',
      }}
      className="active:scale-[0.975] active:opacity-85"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SeasonDot inSeason={isInSeason} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {total ?? '·'}
          </span>
          {total !== undefined && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 500, color }}>{scoreLabel}</span>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t1, lineHeight: 1.3 }}>{species.name}</p>
      <p style={{ fontSize: '0.75rem', color: T.t3, fontStyle: 'italic', marginTop: 2, lineHeight: 1.3 }}>{species.scientificName}</p>
      {spotName && (
        <p style={{ fontSize: '0.75rem', color: T.t3, marginTop: 2, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IMapPin size={12} color={T.t3} />
          {spotName}
        </p>
      )}

      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {species.minSize && (
          <span style={{ fontSize: '0.75rem', color: T.t3, background: T.l3, padding: '2px 6px', borderRadius: 6 }}>
            ≥{species.minSize} cm
          </span>
        )}
        {species.techniques.slice(0, 2).map((t) => (
          <span key={t} style={{ fontSize: '0.75rem', color: T.t3, background: T.l3, padding: '2px 6px', borderRadius: 6 }}>
            {TECHNIQUE_LABELS[t] ?? t}
          </span>
        ))}
      </div>
    </Link>
  );
}
