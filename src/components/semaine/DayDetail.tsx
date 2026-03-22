import type { WeekDay } from '@/types';
import { getFishingScoreColor } from '@/lib/scoring/fishing-score';

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

export default function DayDetail({ day }: Props) {
  const scoreColor = getFishingScoreColor(day.score);

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 space-y-3">
      {/* Pills résumé */}
      <div className="flex gap-2 flex-wrap">
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1 min-w-0">
          <p className="text-xs text-slate-500">Coefficient</p>
          <p className="text-base font-bold text-cyan-400">{day.coefficient}</p>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1 min-w-0">
          <p className="text-xs text-slate-500">Vent</p>
          <p className="text-sm font-bold text-slate-200">
            {day.windDir} {day.windKnots.toFixed(0)} kt
            {day.isHighWind && <span className="text-orange-400 ml-1">⚠️</span>}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1 min-w-0">
          <p className="text-xs text-slate-500">Fenêtre</p>
          <p className="text-sm font-bold text-slate-200">
            {day.bestWindowStart ? fmt(day.bestWindowStart) : '—'}
          </p>
        </div>
      </div>

      {/* Espèce recommandée */}
      {day.topSpeciesName !== '—' && (
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-slate-300 font-medium">🐟 {day.topSpeciesName}</span>
            {day.topLure && (
              <span className="text-slate-500 ml-2">· {day.topLure}</span>
            )}
          </div>
          <span className={`font-bold tabular-nums ${scoreColor}`}>{day.score}</span>
        </div>
      )}
    </div>
  );
}
