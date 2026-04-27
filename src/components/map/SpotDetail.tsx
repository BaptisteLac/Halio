'use client';

import type { Spot, SpotScoreEntry, ZoneType, TidePhase } from '@/types';
import { T, scoreColor, ZONE_COLORS } from '@/design/tokens';
import { IX, IAnchor, ILayers, IAlertTri, IArrowUp, IArrowDown } from '@/design/icons';
import InfoTooltip from '@/components/ui/InfoTooltip';

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

const BOTTOM_LABELS: Record<string, string> = {
  sable: 'Sable',
  vase:  'Vase',
  roche: 'Roche',
  epave: 'Épave',
  mixte: 'Mixte',
};

const PHASE_LABELS: Record<TidePhase, string> = {
  montant:    'Montant',
  descendant: 'Descendant',
  etale:      'Étale',
  tous:       'Toutes phases',
};

const PHASE_ICONS: Record<TidePhase, React.ReactNode> = {
  montant:    <IArrowUp size={11} color={T.accent} />,
  descendant: <IArrowDown size={11} color={T.t3} />,
  etale:      null,
  tous:       null,
};

export default function SpotDetail({ spot, entry, onClose }: Props) {
  const visible = spot !== null;

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
      zIndex: 40,
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 300ms ease',
    }}>
      <div style={{
        background: T.l1,
        borderTop: `1px solid ${T.border}`,
        borderRadius: '16px 16px 0 0',
        maxHeight: '65dvh',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8,
          paddingBottom: 4,
          position: 'sticky',
          top: 0,
          background: T.l1,
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 9999, background: T.border2 }} />
        </div>

        {spot && (
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: T.t1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {spot.name}
                </h2>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: ZONE_COLORS[spot.zone] ?? T.accent,
                  background: `${ZONE_COLORS[spot.zone] ?? T.accent}18`,
                  border: `1px solid ${ZONE_COLORS[spot.zone] ?? T.accent}35`,
                  padding: '3px 10px',
                  borderRadius: 9999,
                }}>
                  {ZONE_LABELS[spot.zone]}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: T.l3,
                  border: 'none',
                  color: T.t3,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IX size={18} color={T.t3} />
              </button>
            </div>

            {entry && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: T.l2,
                borderRadius: 12,
                padding: '12px 16px',
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor(entry.best.total), fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                      {entry.best.total}
                    </span>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: scoreColor(entry.best.total), margin: 0 }}>
                        {entry.best.label}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>/100</p>
                    </div>
                  </div>
                  <InfoTooltip content="Score 0–100 pour ce spot maintenant : croise marées, vent, pression et solunaire pour la meilleure espèce en saison ciblant ce spot." />
                </div>
                {entry.top3.length > 0 && (
                  <div style={{ flex: 1, borderLeft: `1px solid ${T.border}`, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {entry.top3.map(({ species, score }) => (
                      <div key={species.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: T.t3 }}>{species.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: scoreColor(score.total), fontVariantNumeric: 'tabular-nums' }}>
                          {score.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: T.l2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IAnchor size={14} color={T.t4} />
                <div>
                  <p style={{ fontSize: '0.6875rem', color: T.t4, margin: 0 }}>Profondeur</p>
                  <p style={{ fontSize: '0.875rem', color: T.t1, fontWeight: 500, margin: 0 }}>{spot.depth.min}–{spot.depth.max} m</p>
                </div>
              </div>
              <div style={{ background: T.l2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ILayers size={14} color={T.t4} />
                <div>
                  <p style={{ fontSize: '0.6875rem', color: T.t4, margin: 0 }}>Fond</p>
                  <p style={{ fontSize: '0.875rem', color: T.t1, fontWeight: 500, margin: 0 }}>{BOTTOM_LABELS[spot.bottom] ?? spot.bottom}</p>
                </div>
              </div>
              <div style={{ background: T.l2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: '0.6875rem', color: T.t4, margin: '0 0 2px' }}>Phase optimale</p>
                <p style={{ fontSize: '0.875rem', color: T.t1, fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {PHASE_ICONS[spot.optimalTidePhase]}
                  {PHASE_LABELS[spot.optimalTidePhase]}
                </p>
              </div>
              <div style={{ background: T.l2, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: '0.6875rem', color: T.t4, margin: '0 0 2px' }}>Coeff optimal</p>
                <p style={{ fontSize: '0.875rem', color: T.t1, fontWeight: 500, margin: 0 }}>
                  {spot.optimalCoeffRange[0]}–{spot.optimalCoeffRange[1]}
                </p>
              </div>
            </div>

            {spot.danger && (
              <div style={{
                display: 'flex',
                gap: 8,
                background: 'rgba(127,29,29,.2)',
                border: `1px solid rgba(239,68,68,.25)`,
                borderRadius: 12,
                padding: '10px 12px',
                alignItems: 'flex-start',
              }}>
                <IAlertTri size={15} color={T.danger} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.8125rem', color: '#fca5a5', lineHeight: 1.5, margin: 0 }}>{spot.danger}</p>
              </div>
            )}

            <p style={{ fontSize: '0.875rem', color: T.t2, lineHeight: 1.6, margin: 0 }}>{spot.description}</p>

            <div style={{
              background: `${T.accent}08`,
              border: `1px solid ${T.accent}20`,
              borderRadius: 12,
              padding: '10px 12px',
            }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: T.accent, margin: '0 0 4px' }}>Conseil local</p>
              <p style={{ fontSize: '0.8125rem', color: T.t2, lineHeight: 1.55, margin: 0 }}>{spot.tips}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
