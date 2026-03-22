import type { WeekDay } from '@/types';
import { getFishingScoreColor, getFishingScoreLabel } from '@/lib/scoring/fishing-score';

interface Props {
  // Meilleur jour de la semaine pré-calculé par la page parente (évite la double dérivation)
  best: WeekDay;
}

function fmt(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

export default function BestDayHero({ best }: Props) {

  if (best.score < 65) {
    return (
      <div className="bg-orange-950/40 border border-orange-800/40 rounded-xl p-4">
        <p className="text-xs text-orange-400/70 uppercase tracking-wide mb-1">Cette semaine</p>
        <p className="text-white font-bold text-lg">Conditions difficiles</p>
        <p className="text-orange-400/80 text-sm mt-1">
          Aucun créneau optimal prévu — score max : {best.score}/100
        </p>
      </div>
    );
  }

  const dayLabel = best.date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  });

  const scoreColor = getFishingScoreColor(best.score);
  const scoreLabel = getFishingScoreLabel(best.score);

  return (
    <div className="bg-gradient-to-br from-green-950/60 to-slate-900 border border-green-800/40 rounded-xl p-4">
      <p className="text-xs text-green-400/70 uppercase tracking-wide mb-2">
        ⭐ Meilleur créneau de la semaine
      </p>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg capitalize">{dayLabel}</p>
          {best.bestWindowStart && best.bestWindowEnd ? (
            <p className="text-green-300 text-sm mt-1">
              ⏰ {fmt(best.bestWindowStart)} → {fmt(best.bestWindowEnd)}
            </p>
          ) : null}
          <p className="text-slate-400 text-sm mt-0.5">
            🐟 {best.topSpeciesName} · coeff {best.coefficient} · {best.windDir} {best.windKnots.toFixed(0)} kt
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-3xl font-extrabold ${scoreColor}`}>{best.score}</p>
          <p className={`text-xs ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>
    </div>
  );
}
