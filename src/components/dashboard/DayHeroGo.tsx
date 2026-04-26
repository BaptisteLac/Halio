'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BestWindow, SpeciesResult, FishingScore, ScoreFactors } from '@/types';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { ScoreArc } from '@/design/primitives';
import { IClock, IFish, IArrowUp, IArrowDown } from '@/design/icons';
import { T, scoreColor } from '@/design/tokens';

interface Props {
  bestWindow: BestWindow | null;
  topSpecies: SpeciesResult[];
  currentScore: FishingScore;
}

const FACTOR_LABELS: Record<keyof ScoreFactors, string> = {
  coeffScore: 'Coefficient',
  tideHourScore: 'Heure de marée',
  windScore: 'Force du vent',
  windDirScore: 'Direction vent',
  pressureScore: 'Pression',
  solunarScore: 'Solunaire',
  dawnDuskScore: 'Aube / crépuscule',
  tempScore: 'Temp. eau',
};

function FactorBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? '#4ade80' : value >= 40 ? '#facc15' : '#f87171';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: '0.75rem', color: T.t3 }}>{label}</span>
        <span style={{ fontSize: '0.75rem', color: T.t2, fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 6, background: T.l3, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          borderRadius: 999,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}

function verdict(score: number): string {
  if (score >= 85) return 'Conditions exceptionnelles';
  if (score >= 75) return 'Bonnes conditions';
  return 'Conditions correctes';
}

function gradientForScore(score: number): string {
  if (score >= 85) return 'linear-gradient(135deg, oklch(15% .025 200), oklch(7% .012 230))';
  if (score >= 75) return 'linear-gradient(135deg, oklch(15% .02 145), oklch(7% .012 230))';
  return 'linear-gradient(135deg, oklch(15% .02 60), oklch(7% .012 230))';
}

function borderForScore(score: number): string {
  const c = scoreColor(score);
  return `1px solid ${c}22`;
}

export default function DayHeroGo({ bestWindow, topSpecies, currentScore }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const [pressed, setPressed] = useState(false);
  const top = topSpecies[0];
  const topLure = top ? [...top.species.lures].sort((a, b) => a.priority - b.priority)[0]?.name : null;

  const detailPanel = (
    <div style={{
      display: 'grid',
      gridTemplateRows: showDetail ? '1fr' : '0fr',
      transition: 'grid-template-rows 0.3s ease',
    }}>
      <div style={{ overflow: 'hidden' }}>
        <div style={{ paddingTop: 12, marginTop: 12, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <p style={{ fontSize: '0.75rem', color: T.t3 }}>Conditions maintenant · espèce principale de saison</p>
            <InfoTooltip content="Score composite à l'instant T : croise marées, vent, pression, coefficient et période lunaire pour l'espèce principale en saison. Mis à jour chaque minute." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ScoreArc score={currentScore.total} size={160} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.entries(currentScore.factors) as [keyof ScoreFactors, number][]).map(([key, value]) => (
              <FactorBar key={key} label={FACTOR_LABELS[key]} value={value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const toggle = () => setShowDetail((v) => !v);
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  if (!bestWindow) {
    return (
      <div
        onClick={toggle}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          background: `linear-gradient(135deg, ${T.l2}, ${T.page})`,
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          padding: 16,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.12s ease, opacity 0.12s ease',
          transform: pressed ? 'scale(0.975)' : 'scale(1)',
          opacity: pressed ? 0.85 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.6875rem', color: T.t4, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Aujourd&apos;hui</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', lineHeight: 1.25 }}>Conditions difficiles</p>
            <p style={{ fontSize: '0.875rem', color: T.t3, marginTop: 4 }}>Aucune sortie optimale prévue</p>
            <Link
              href="/semaine"
              onClick={stopProp}
              style={{ display: 'inline-block', marginTop: 12, fontSize: '0.75rem', color: T.accent, textDecoration: 'none' }}
            >
              Voir les prochains jours →
            </Link>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: scoreColor(currentScore.total), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {currentScore.total}
              </p>
              <InfoTooltip content="Score instantané : conditions en ce moment (marées, vent, pression, solunaire). Aucun créneau optimal prévu aujourd'hui — ce score ne dépasse pas 65/100 sur la journée." />
            </div>
            <p style={{ fontSize: '0.75rem', color: T.t4 }}>/100</p>
            <p style={{ fontSize: '0.75rem', color: T.t4, marginTop: 2 }}>actuel</p>
          </div>
        </div>
        {detailPanel}
        <p style={{ marginTop: 12, textAlign: 'center', fontSize: '0.75rem', color: T.t4, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
          {showDetail ? '↑ Masquer le détail' : '↓ Conditions maintenant'}
        </p>
      </div>
    );
  }

  const accentColor = scoreColor(bestWindow.score);

  return (
    <div
      onClick={toggle}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: gradientForScore(bestWindow.score),
        borderRadius: 14,
        border: borderForScore(bestWindow.score),
        padding: 16,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.12s ease, opacity 0.12s ease',
        transform: pressed ? 'scale(0.975)' : 'scale(1)',
        opacity: pressed ? 0.85 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.6875rem', color: T.t4, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Aujourd&apos;hui</p>
          <p style={{ fontSize: '1.125rem', fontWeight: 700, color: accentColor, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {verdict(bestWindow.score)}
          </p>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t1, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IClock size={14} color={T.t3} />
            {fmt(bestWindow.start)} – {fmt(bestWindow.end)}
          </p>
          {top && (
            <p style={{ fontSize: '0.875rem', color: T.t2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <IFish size={14} color={T.t3} />
              {top.species.name}
              {top.spot && <span style={{ color: T.t3 }}>· {top.spot.name}</span>}
              {topLure && <span style={{ color: T.t3 }}>· {topLure}</span>}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: accentColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {bestWindow.score}
            </p>
            <InfoTooltip content="Pic de conditions sur la journée : chaque heure est scorée avec la prévision météo de cette heure, les marées simulées et le solunaire. Ce score correspond au meilleur créneau — pas aux conditions actuelles." />
          </div>
          <p style={{ fontSize: '0.75rem', color: T.t4 }}>/100</p>
          <p style={{ fontSize: '0.75rem', color: T.t4, marginTop: 2 }}>sortie</p>
        </div>
      </div>
      {detailPanel}
      <p style={{ marginTop: 12, textAlign: 'center', fontSize: '0.75rem', color: T.t4, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
        {showDetail ? '↑ Masquer le détail' : '↓ Conditions maintenant'}
      </p>
    </div>
  );
}
