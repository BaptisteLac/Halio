import type { CatchRow } from '@/lib/supabase/types';
import { getSpeciesById } from '@/data/species';
import { getSpotById } from '@/data/spots';

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
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
      <h3 className="text-slate-300 font-medium text-sm">Mes stats</h3>

      {/* Ligne 1 : totaux */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Prises" value={String(catches.length)} />
        <Stat label="Score moy." value={avgScore != null ? `${avgScore}/100` : '—'} />
        <Stat label="Remises" value={releasedCount > 0 ? `${releasedPct}%` : '—'} />
      </div>

      {/* Ligne 2 : espèce + spot favoris */}
      <div className="grid grid-cols-2 gap-2">
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

      {/* Ligne 3 : records (seulement si données disponibles) */}
      {(recordSize || recordWeight) && (
        <div className={`grid gap-2 ${recordSize && recordWeight ? 'grid-cols-2' : 'grid-cols-1'}`}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-center">
      <p className="text-white font-bold text-base tabular-nums">{value}</p>
      <p className="text-slate-400 text-[10px] mt-0.5">{label}</p>
    </div>
  );
}

function StatWide({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-slate-700/50 rounded-lg px-3 py-2">
      <p className="text-slate-400 text-[10px]">{label}</p>
      <p className="text-white font-semibold text-sm mt-0.5 truncate">{value}</p>
      <p className="text-slate-400 text-[10px]">{sub}</p>
    </div>
  );
}
