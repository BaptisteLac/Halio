import Link from 'next/link';
import type { Species } from '@/types';
import type { FishingScore } from '@/types';
import { getFishingScoreColor, getFishingScoreLabel } from '@/lib/scoring/fishing-score';

interface Props {
  species: Species;
  score?: FishingScore;
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

export default function SpeciesCard({ species, score, isInSeason }: Props) {
  const total = score?.total;
  const color = total !== undefined ? getFishingScoreColor(total) : 'text-slate-500';
  const label = total !== undefined ? getFishingScoreLabel(total) : '—';

  return (
    <Link
      href={`/especes/${species.slug}`}
      className="block bg-slate-800 rounded-xl p-3 active:scale-[0.98] transition-transform"
    >
      {/* En saison */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            isInSeason
              ? 'bg-green-400/15 text-green-400'
              : 'bg-slate-700 text-slate-500'
          }`}
        >
          {isInSeason ? 'En saison' : 'Hors saison'}
        </span>
        {/* Score */}
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-bold tabular-nums leading-none ${color}`}>
            {total ?? '·'}
          </span>
          {total !== undefined && (
            <span className={`text-[10px] font-medium ${color}`}>{label}</span>
          )}
        </div>
      </div>

      {/* Nom */}
      <p className="text-white font-semibold text-sm leading-tight">{species.name}</p>
      <p className="text-slate-500 text-[10px] italic mt-0.5 leading-tight">{species.scientificName}</p>

      {/* Infos clés */}
      <div className="mt-2 flex flex-wrap gap-1">
        {species.minSize && (
          <span className="text-[10px] text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded">
            ≥{species.minSize} cm
          </span>
        )}
        {species.techniques.slice(0, 2).map((t) => (
          <span key={t} className="text-[10px] text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded">
            {TECHNIQUE_LABELS[t] ?? t}
          </span>
        ))}
      </div>
    </Link>
  );
}
