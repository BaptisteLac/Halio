import { X, AlertTriangle, Anchor, Layers } from 'lucide-react';
import type { Spot, SpotScoreEntry, ZoneType, TidePhase } from '@/types';

interface Props {
  spot: Spot | null;
  entry: SpotScoreEntry | null;
  onClose: () => void;
}

const ZONE_LABELS: Record<ZoneType, string> = {
  passes:       'Passes',
  bancs:        'Bancs',
  fosses:       'Fosses',
  parcs:        'Parcs ostréicoles',
  chenaux:      'Chenaux',
  'cap-ferret': 'Cap Ferret',
  plages:       'Plages',
};

const ZONE_COLORS: Record<ZoneType, string> = {
  passes:       'bg-cyan-400/20 text-cyan-400 border-cyan-400/30',
  bancs:        'bg-green-400/20 text-green-400 border-green-400/30',
  fosses:       'bg-violet-400/20 text-violet-400 border-violet-400/30',
  parcs:        'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  chenaux:      'bg-orange-400/20 text-orange-400 border-orange-400/30',
  'cap-ferret': 'bg-pink-400/20 text-pink-400 border-pink-400/30',
  plages:       'bg-slate-400/20 text-slate-400 border-slate-400/30',
};

const BOTTOM_LABELS: Record<string, string> = {
  sable: 'Sable',
  vase: 'Vase',
  roche: 'Roche',
  epave: 'Épave',
  mixte: 'Mixte',
};

const PHASE_LABELS: Record<TidePhase, string> = {
  montant:   '↑ Montant',
  descendant:'↓ Descendant',
  etale:     '⇒ Étale',
  tous:      'Toutes phases',
};

function ScoreBadge({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-3xl font-bold tabular-nums ${color}`}>{score}</span>
      <div>
        <p className={`text-sm font-medium ${color}`}>{label}</p>
        <p className="text-slate-400 text-xs">/100</p>
      </div>
    </div>
  );
}

export default function SpotDetail({ spot, entry, onClose }: Props) {
  const visible = spot !== null;

  return (
    <div
      className={`fixed left-0 right-0 bottom-14 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[65vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1 sticky top-0 bg-slate-900">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {spot && (
          <div className="px-4 pb-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-white font-bold text-lg leading-tight">{spot.name}</h2>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border font-medium ${ZONE_COLORS[spot.zone]}`}
                >
                  {ZONE_LABELS[spot.zone]}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Score + top espèces */}
            {entry && (
              <div className="bg-slate-800 rounded-xl p-3 space-y-3">
                <ScoreBadge
                  score={entry.best.total}
                  label={entry.best.label}
                  color={entry.best.color}
                />
                {entry.top3.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-700">
                    {entry.top3.map(({ species, score }) => (
                      <div key={species.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{species.name}</span>
                        <span className={`font-medium tabular-nums ${score.color}`}>
                          {score.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Infos clés */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                <Anchor size={13} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-400">Profondeur</p>
                  <p className="text-white font-medium">{spot.depth.min}–{spot.depth.max} m</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                <Layers size={13} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-400">Fond</p>
                  <p className="text-white font-medium">{BOTTOM_LABELS[spot.bottom] ?? spot.bottom}</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-400">Phase optimale</p>
                <p className="text-white font-medium mt-0.5">{PHASE_LABELS[spot.optimalTidePhase]}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5">
                <p className="text-slate-400">Coeff optimal</p>
                <p className="text-white font-medium mt-0.5">
                  {spot.optimalCoeffRange[0]}–{spot.optimalCoeffRange[1]}
                </p>
              </div>
            </div>

            {/* Danger */}
            {spot.danger && (
              <div className="flex gap-2 bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs leading-relaxed">{spot.danger}</p>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-slate-300 text-sm leading-relaxed">{spot.description}</p>
            </div>

            {/* Tips */}
            <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-xl p-3">
              <p className="text-cyan-400 text-xs font-medium mb-1">💡 Conseil local</p>
              <p className="text-slate-300 text-xs leading-relaxed">{spot.tips}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
