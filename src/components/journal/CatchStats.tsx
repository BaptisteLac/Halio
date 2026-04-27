import type { CatchRow } from '@/lib/supabase/types';
import { getSpeciesById } from '@/data/species';
import { getSpotById } from '@/data/spots';
import { T } from '@/design/tokens';

interface Props {
  catches: CatchRow[];
}

function topById(ids: string[]): { id: string; count: number } | null {
  if (ids.length === 0) return null;
  const freq = new Map<string, number>();
  for (const id of ids) freq.set(id, (freq.get(id) ?? 0) + 1);
  const [id, count] = [...freq.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
  return { id, count };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: T.l3, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: '0.6875rem', color: T.t4, margin: '2px 0 0' }}>{label}</p>
    </div>
  );
}

function StatWide({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: T.l3, borderRadius: 10, padding: '8px 10px' }}>
      <p style={{ fontSize: '0.6875rem', color: T.t4, margin: 0 }}>{label}</p>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t1, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      <p style={{ fontSize: '0.6875rem', color: T.t3, margin: '2px 0 0' }}>{sub}</p>
    </div>
  );
}

export default function CatchStats({ catches }: Props) {
  if (catches.length === 0) return null;

  const topSpecies = topById(catches.map((c) => c.species_id));
  const topSpot    = topById(catches.map((c) => c.spot_id));

  const withSize   = catches.filter((c) => c.size_cm   != null);
  const withWeight = catches.filter((c) => c.weight_kg != null);
  const withScore  = catches.filter((c) => c.fishing_score != null);

  const recordSize   = withSize.length   > 0 ? withSize.reduce((a, b)   => (b.size_cm!   > a.size_cm!   ? b : a)) : null;
  const recordWeight = withWeight.length > 0 ? withWeight.reduce((a, b) => (b.weight_kg! > a.weight_kg! ? b : a)) : null;

  const avgScore = withScore.length > 0
    ? Math.round(withScore.reduce((sum, c) => sum + c.fishing_score!, 0) / withScore.length)
    : null;

  const releasedCount = catches.filter((c) => c.released).length;
  const releasedPct   = Math.round((releasedCount / catches.length) * 100);

  return (
    <div style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t2, margin: 0 }}>Mes stats</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Stat label="Prises"     value={String(catches.length)} />
        <Stat label="Score moy." value={avgScore != null ? `${avgScore}/100` : '—'} />
        <Stat label="Remises"    value={releasedCount > 0 ? `${releasedPct}%` : '—'} />
      </div>

      {(topSpecies || topSpot) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {topSpecies && (
            <StatWide
              label="Plus pêchée"
              value={getSpeciesById(topSpecies.id)?.name ?? topSpecies.id}
              sub={`${topSpecies.count} prise${topSpecies.count > 1 ? 's' : ''}`}
            />
          )}
          {topSpot && (
            <StatWide
              label="Spot fréquent"
              value={getSpotById(topSpot.id)?.name ?? topSpot.id}
              sub={`${topSpot.count} sortie${topSpot.count > 1 ? 's' : ''}`}
            />
          )}
        </div>
      )}

      {(recordSize || recordWeight) && (
        <div style={{ display: 'grid', gridTemplateColumns: recordSize && recordWeight ? '1fr 1fr' : '1fr', gap: 8 }}>
          {recordSize && (
            <StatWide
              label="Record taille"
              value={`${recordSize.size_cm} cm`}
              sub={getSpeciesById(recordSize.species_id)?.name ?? recordSize.species_id}
            />
          )}
          {recordWeight && (
            <StatWide
              label="Record poids"
              value={`${recordWeight.weight_kg} kg`}
              sub={getSpeciesById(recordWeight.species_id)?.name ?? recordWeight.species_id}
            />
          )}
        </div>
      )}
    </div>
  );
}
