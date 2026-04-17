import type { FishingScore, BestWindow, SpeciesResult } from '@/types';

interface Props {
  score: FishingScore;
  bestWindow: BestWindow | null;
  topSpecies: SpeciesResult[];
}

function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

export default function DayHero({ score, bestWindow, topSpecies }: Props) {
  const top = topSpecies[0];

  return (
    <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 rounded-xl border border-cyan-800/30 p-4">
      <p className="text-xs text-cyan-400/70 uppercase tracking-wide mb-2">
        Aujourd&apos;hui
      </p>

      <p className={`text-2xl font-bold ${score.color}`}>{score.label}</p>

      {bestWindow ? (
        <p className="text-sm text-slate-300 mt-1.5">
          ⏰{' '}
          <span className="font-semibold text-white">
            {fmt(bestWindow.start)} → {fmt(bestWindow.end)}
          </span>
        </p>
      ) : (
        <p className="text-sm text-slate-400 mt-1.5">Aucune fenêtre optimale aujourd&apos;hui</p>
      )}

      {top && (
        <p className="text-sm text-slate-400 mt-1">
          🐟{' '}
          <span className="text-slate-200 font-medium">{top.species.name}</span>
          {top.species.lures.length > 0 && (
            <span className="text-slate-400">
              {' · '}
              {[...top.species.lures].sort((a, b) => a.priority - b.priority)[0]!.name}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
