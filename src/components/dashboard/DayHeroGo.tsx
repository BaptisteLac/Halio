import Link from 'next/link';
import type { BestWindow, SpeciesResult, FishingScore } from '@/types';

interface Props {
  bestWindow: BestWindow | null;
  topSpecies: SpeciesResult[];
  currentScore: FishingScore;
}

function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function getTheme(score: number) {
  if (score >= 85) return { gradient: 'from-cyan-950/60 to-slate-900', border: 'border-cyan-800/30', accent: 'text-cyan-400', icon: '✓' };
  if (score >= 75) return { gradient: 'from-green-950/60 to-slate-900', border: 'border-green-800/30', accent: 'text-green-400', icon: '✓' };
  return { gradient: 'from-amber-950/50 to-slate-900', border: 'border-amber-800/30', accent: 'text-amber-400', icon: '≈' };
}

function verdict(score: number): string {
  if (score >= 85) return 'Conditions exceptionnelles';
  if (score >= 75) return 'Bonnes conditions';
  return 'Conditions correctes';
}

export default function DayHeroGo({ bestWindow, topSpecies, currentScore }: Props) {
  const top = topSpecies[0];
  const topLure = top
    ? [...top.species.lures].sort((a, b) => a.priority - b.priority)[0]?.name
    : null;

  if (!bestWindow) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900 rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Aujourd&apos;hui</p>
            <p className="text-white font-bold text-lg leading-tight">Conditions difficiles</p>
            <p className="text-slate-400 text-sm mt-1">Aucune sortie optimale prévue</p>
            <Link
              href="/semaine"
              className="inline-block mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Voir les prochains jours →
            </Link>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-3xl font-extrabold tabular-nums ${currentScore.color}`}>
              {currentScore.total}
            </p>
            <p className="text-slate-500 text-xs">/100</p>
            <p className="text-slate-500 text-xs mt-0.5">actuel</p>
          </div>
        </div>
      </div>
    );
  }

  const theme = getTheme(bestWindow.score);

  return (
    <div className={`bg-gradient-to-br ${theme.gradient} rounded-xl border ${theme.border} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Aujourd&apos;hui</p>
          <p className={`font-bold text-lg leading-tight ${theme.accent}`}>
            {theme.icon} {verdict(bestWindow.score)}
          </p>
          <p className="text-white font-semibold text-base mt-1.5">
            ⏰ {fmt(bestWindow.start)} – {fmt(bestWindow.end)}
          </p>
          {top && (
            <p className="text-slate-300 text-sm mt-1 truncate">
              🐟 {top.species.name}
              {top.spot && <span className="text-slate-400"> · {top.spot.name}</span>}
              {topLure && <span className="text-slate-400"> · {topLure}</span>}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className={`text-3xl font-extrabold tabular-nums ${theme.accent}`}>
            {bestWindow.score}
          </p>
          <p className="text-slate-500 text-xs">/100</p>
          <p className="text-slate-500 text-xs mt-0.5">sortie</p>
        </div>
      </div>
    </div>
  );
}
