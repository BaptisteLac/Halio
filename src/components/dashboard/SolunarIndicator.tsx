import { Sun, Moon, Clock } from 'lucide-react';
import type { SolunarData } from '@/types';

interface Props {
  solunar: SolunarData;
  now: Date;
}

function fmt(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

const MOON_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

export default function SolunarIndicator({ solunar, now }: Props) {
  const moonEmoji = MOON_EMOJIS[Math.round(solunar.moonPhase * 8) % 8];
  const { currentPeriod } = solunar;

  const nextPeriod = solunar.periods.find((p) => p.start > now);
  const minutesToNext = nextPeriod
    ? Math.round((nextPeriod.start.getTime() - now.getTime()) / 60000)
    : null;

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-300 font-medium text-sm">Solunaire & Lune</h3>
        {currentPeriod ? (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              currentPeriod === 'majeure'
                ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/30'
                : 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30'
            }`}
          >
            Période {currentPeriod}
          </span>
        ) : (
          <span className="text-xs text-slate-500">Hors période</span>
        )}
      </div>

      {/* Lune */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{moonEmoji}</span>
        <div>
          <p className="text-white font-medium text-sm">{solunar.moonPhaseName}</p>
          <p className="text-slate-400 text-xs">{Math.round(solunar.moonFraction * 100)}% illuminée</p>
        </div>
      </div>

      {/* Lever/coucher soleil + lune */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sun size={11} className="text-yellow-400 shrink-0" />
          <span>Lever {fmt(solunar.sunrise)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sun size={11} className="text-orange-400 shrink-0" />
          <span>Coucher {fmt(solunar.sunset)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Moon size={11} className="text-slate-300 shrink-0" />
          <span>Lever {fmt(solunar.moonrise)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Moon size={11} className="text-slate-500 shrink-0" />
          <span>Coucher {fmt(solunar.moonset)}</span>
        </div>
      </div>

      {/* Prochaine période */}
      {nextPeriod && minutesToNext !== null && (
        <div className="flex items-start gap-1.5 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
          <Clock size={11} className="shrink-0 mt-0.5" />
          <span>
            Prochaine {nextPeriod.type} dans{' '}
            <span className="text-slate-200 font-medium">{formatDuration(minutesToNext)}</span>
            {' '}({fmt(nextPeriod.start)} – {fmt(nextPeriod.end)})
          </span>
        </div>
      )}
    </div>
  );
}
