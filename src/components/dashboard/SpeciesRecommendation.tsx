import Link from 'next/link';
import type { Species, FishingScore, Spot } from '@/types';

interface Props {
  topSpecies: Array<{ species: Species; score: FishingScore; spot: Spot }>;
}

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-cyan-400'
    : score >= 70 ? 'bg-green-400'
    : score >= 55 ? 'bg-yellow-400'
    : score >= 40 ? 'bg-orange-400'
    : 'bg-red-400';
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

export default function SpeciesRecommendation({ topSpecies }: Props) {
  if (topSpecies.length === 0) return null;

  const [first, ...rest] = topSpecies;

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-2.5">
      <h3 className="text-slate-300 font-medium text-sm">Espèces recommandées</h3>

      {/* Top espèce — lien vers la fiche détaillée */}
      <Link
        href={`/especes/${first.species.slug}`}
        className={`block rounded-lg p-3 border transition-colors ${
          first.score.total >= 70
            ? 'bg-cyan-400/10 border-cyan-400/25 hover:bg-cyan-400/15'
            : 'bg-slate-800 border-slate-700 hover:bg-slate-700/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-white font-semibold">{first.species.name}</span>
            {first.species.localNames.length > 0 && (
              <span className="text-slate-400 text-xs ml-1.5">({first.species.localNames[0]})</span>
            )}
            <p className="text-slate-400 text-[10px] mt-0.5">📍 {first.spot.name}</p>
            {first.species.lures.length > 0 && (
              <p className="text-slate-400 text-xs mt-1 truncate">
                💡 {first.species.lures[0].name}
                {first.species.lures[1] ? ` · ${first.species.lures[1].name}` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ScoreDot score={first.score.total} />
            <span className={`font-bold text-lg ${first.score.color}`}>{first.score.total}</span>
          </div>
        </div>
      </Link>

      {/* Autres espèces */}
      {rest.length > 0 && (
        <div className="space-y-1.5">
          {rest.map(({ species, score, spot }) => (
            <Link
              key={species.id}
              href={`/especes/${species.slug}`}
              className="flex items-center justify-between text-sm hover:bg-slate-700/30 rounded-lg px-1 min-h-[44px] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ScoreDot score={score.total} />
                <div className="min-w-0">
                  <span className="text-slate-300">{species.name}</span>
                  <span className="text-slate-600 text-[10px] ml-1.5 truncate">· {spot.name}</span>
                </div>
              </div>
              <span className={`font-medium tabular-nums shrink-0 ${score.color}`}>{score.total}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
