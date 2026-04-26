'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CatchRow } from '@/lib/supabase/types';
import { getSpeciesById } from '@/data/species';
import { getSpotById } from '@/data/spots';
import { T, scoreColor } from '@/design/tokens';
import { IFish } from '@/design/icons';

interface Props {
  catches: CatchRow[];
  onDelete: (id: string) => Promise<void>;
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

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
  const [confirmId,  setConfirmId]  = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
    setConfirmId(null);
  }

  if (catches.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '64px 24px', textAlign: 'center' }}>
        <IFish size={40} color={T.t4} />
        <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>Pas encore de prise enregistrée.</p>
        <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>Appuyez sur + pour logger votre première prise !</p>
      </div>
    );
  }

  const groups = groupByDay(catches);

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
      <div style={{ maxWidth: 512, margin: '0 auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map(({ day, items }) => (
          <div key={day}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: T.t4, marginBottom: 8, paddingLeft: 4, textTransform: 'capitalize' }}>
              {formatDay(items[0].caught_at)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((c) => {
                const species     = getSpeciesById(c.species_id);
                const spot        = getSpotById(c.spot_id);
                const color       = c.fishing_score !== null ? scoreColor(c.fishing_score) : T.t4;
                const isConfirming = confirmId  === c.id;
                const isDeleting   = deletingId === c.id;

                return (
                  <div key={c.id} style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    {c.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo_url} alt={species?.name ?? 'Photo'} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t1 }}>
                            {species?.name ?? c.species_id}
                          </span>
                          {c.released && (
                            <span style={{ fontSize: '0.6875rem', color: T.accent, background: `${T.accent}15`, border: `1px solid ${T.accent}30`, padding: '2px 8px', borderRadius: 9999 }}>
                              Relâché
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: T.t3, margin: '2px 0 0' }}>
                          {spot?.name ?? c.spot_id} · {formatTime(c.caught_at)}
                        </p>
                        {(c.size_cm || c.weight_kg || c.technique) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                            {c.size_cm   && <span style={{ fontSize: '0.75rem', color: T.t2 }}>{c.size_cm} cm</span>}
                            {c.weight_kg && <span style={{ fontSize: '0.75rem', color: T.t2 }}>{c.weight_kg} kg</span>}
                            {c.technique && <span style={{ fontSize: '0.75rem', color: T.t3 }}>{c.technique}</span>}
                          </div>
                        )}
                        {c.notes && (
                          <p style={{ fontSize: '0.75rem', color: T.t3, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.notes}
                          </p>
                        )}
                      </div>

                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        {c.fishing_score !== null && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.125rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                              {c.fishing_score}
                            </span>
                            <p style={{ fontSize: '0.6875rem', color: T.t4, margin: 0 }}>/100</p>
                          </div>
                        )}
                        {isConfirming ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleDelete(c.id)}
                              disabled={isDeleting}
                              style={{ fontSize: '0.6875rem', background: 'rgba(239,68,68,.15)', color: T.danger, border: `1px solid rgba(239,68,68,.3)`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', opacity: isDeleting ? 0.5 : 1 }}
                            >
                              {isDeleting ? '…' : 'Supprimer'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              style={{ fontSize: '0.6875rem', color: T.t3, background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(c.id)}
                            aria-label="Supprimer"
                            style={{ color: T.t4, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
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
