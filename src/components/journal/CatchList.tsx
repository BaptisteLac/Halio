import { useState } from 'react';
import { Fish, Trash2 } from 'lucide-react';
import type { CatchRow } from '@/lib/supabase/types';
import { getSpeciesById } from '@/data/species';
import { getSpotById } from '@/data/spots';
import { getFishingScoreColor } from '@/lib/scoring/fishing-score';

interface Props {
  catches: CatchRow[];
  onDelete: (id: string) => Promise<void>;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Grouper par jour (date locale)
function groupByDay(catches: CatchRow[]): Array<{ day: string; items: CatchRow[] }> {
  const map = new Map<string, CatchRow[]>();
  for (const c of catches) {
    const day = new Date(c.caught_at).toLocaleDateString('fr-FR');
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(c);
  }
  return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
}

export default function CatchList({ catches, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
    setConfirmId(null);
  }

  if (catches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center py-16">
        <Fish size={40} className="text-slate-600" />
        <p className="text-slate-400 text-sm">Pas encore de prise enregistrée.</p>
        <p className="text-slate-500 text-xs">Appuyez sur + pour logger votre première prise !</p>
      </div>
    );
  }

  const groups = groupByDay(catches);

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="max-w-lg mx-auto px-3 py-3 space-y-4">
        {groups.map(({ day, items }) => (
          <div key={day}>
            {/* Header du jour */}
            <p className="text-slate-400 text-xs font-medium mb-2 px-1 capitalize">
              {formatDay(items[0].caught_at)}
            </p>

            <div className="space-y-2">
              {items.map((c) => {
                const species = getSpeciesById(c.species_id);
                const spot    = getSpotById(c.spot_id);
                const scoreColor = c.fishing_score !== null
                  ? getFishingScoreColor(c.fishing_score)
                  : 'text-slate-500';

                const isConfirming = confirmId === c.id;
                const isDeleting = deletingId === c.id;

                return (
                  <div
                    key={c.id}
                    className="bg-slate-800 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">
                          {species?.name ?? c.species_id}
                        </span>
                        {c.released && (
                          <span className="text-[10px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded-full">
                            Relâché
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {spot?.name ?? c.spot_id} · {formatTime(c.caught_at)}
                      </p>
                      {/* Taille / poids / technique */}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {c.size_cm && (
                          <span className="text-xs text-slate-300">{c.size_cm} cm</span>
                        )}
                        {c.weight_kg && (
                          <span className="text-xs text-slate-300">{c.weight_kg} kg</span>
                        )}
                        {c.technique && (
                          <span className="text-xs text-slate-400">{c.technique}</span>
                        )}
                      </div>
                      {c.notes && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-1">{c.notes}</p>
                      )}
                    </div>

                    {/* Score + suppression */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {c.fishing_score !== null && (
                        <div className="text-right">
                          <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>
                            {c.fishing_score}
                          </span>
                          <p className="text-slate-500 text-[10px]">/100</p>
                        </div>
                      )}

                      {isConfirming ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={isDeleting}
                            className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-2 py-1 disabled:opacity-50"
                          >
                            {isDeleting ? '…' : 'Supprimer'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-[10px] text-slate-500 border border-slate-700 rounded-lg px-2 py-1"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(c.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors p-1"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
