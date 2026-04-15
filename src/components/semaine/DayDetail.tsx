import type { WeekDay, DaySpecies } from '@/types';
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

function SpeciesRow({ s }: { s: DaySpecies }) {
  const scoreColor = getFishingScoreColor(s.score);
  const barWidth = Math.round((s.score / 100) * 56);

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-700/40 last:border-0">
      {/* Nom + leurre */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 font-medium truncate">{s.name}</p>
        {s.lure && (
          <p className="text-[11px] text-slate-400 truncate">{s.lure}</p>
        )}
      </div>

      {/* Fenêtre de tir */}
      <div className="text-right shrink-0">
        {s.windowStart ? (
          <p className="text-[11px] text-cyan-400 font-medium tabular-nums">
            {fmt(s.windowStart)}{s.windowEnd ? ` → ${fmt(s.windowEnd)}` : ''}
          </p>
        ) : (
          <p className="text-xs text-slate-400">—</p>
        )}
      </div>

      {/* Score + barre */}
      <div className="flex flex-col items-end gap-0.5 shrink-0 w-10">
        <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{s.score}</span>
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden" style={{ width: '40px' }}>
          <div
            className={`h-full rounded-full ${s.score >= 70 ? 'bg-cyan-500' : s.score >= 55 ? 'bg-green-500' : s.score >= 40 ? 'bg-yellow-500' : 'bg-slate-500'}`}
            style={{ width: `${barWidth}px` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DayDetail({ day }: Props) {
  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 space-y-3">
      {/* Pills résumé */}
      <div className="flex gap-2">
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1">
          <p className="text-xs text-slate-400">Coefficient</p>
          <p className="text-base font-bold text-cyan-400">{day.coefficient}</p>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1">
          <p className="text-xs text-slate-400">Vent</p>
          <p className="text-sm font-bold text-slate-200">
            {day.windDir} {day.windKnots.toFixed(0)} kt
            {day.isHighWind && <span className="text-orange-400 ml-1">⚠️</span>}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-center flex-1">
          <p className="text-xs text-slate-400">Meilleure fenêtre</p>
          <p className="text-sm font-bold text-slate-200">
            {day.bestWindowStart ? fmt(day.bestWindowStart) : '—'}
          </p>
        </div>
      </div>

      {/* Espèces de saison avec leurs fenêtres */}
      {day.topSpecies.length > 0 && (
        <div className="bg-slate-800/60 rounded-lg px-3 py-1">
          <p className="text-xs uppercase tracking-wide text-slate-400 pt-1.5 pb-1">
            Espèces de saison · fenêtres de tir
          </p>
          {day.topSpecies.map((s) => (
            <SpeciesRow key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
