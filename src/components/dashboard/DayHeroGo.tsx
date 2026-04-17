'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BestWindow, SpeciesResult, FishingScore, ScoreFactors } from '@/types';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface Props {
  bestWindow: BestWindow | null;
  topSpecies: SpeciesResult[];
  currentScore: FishingScore;
}

const SCORE_HEX: Record<string, string> = {
  cyan: '#22d3ee', green: '#4ade80', yellow: '#facc15', orange: '#fb923c', red: '#f87171',
};

function hexColor(score: number): string {
  if (score >= 85) return SCORE_HEX.cyan!;
  if (score >= 70) return SCORE_HEX.green!;
  if (score >= 55) return SCORE_HEX.yellow!;
  if (score >= 40) return SCORE_HEX.orange!;
  return SCORE_HEX.red!;
}

function CircularGauge({ score }: { score: number }) {
  const radius = 54;
  const sw = 10;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color = hexColor(score);
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-lg">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e293b" strokeWidth={sw} />
      <circle
        cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="70" y="64" textAnchor="middle" fill={color} fontSize="30" fontWeight="700">{score}</text>
      <text x="70" y="82" textAnchor="middle" fill="#475569" fontSize="13">/100</text>
    </svg>
  );
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
  const color = value >= 70 ? 'bg-green-400' : value >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
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
  const [showDetail, setShowDetail] = useState(false);
  const top = topSpecies[0];
  const topLure = top ? [...top.species.lures].sort((a, b) => a.priority - b.priority)[0]?.name : null;

  const detailPanel = (
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${showDetail ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <div className="pt-3 mt-3 border-t border-slate-700/40 space-y-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-slate-400">Conditions maintenant · espèce principale de saison</p>
            <InfoTooltip content="Score composite à l'instant T : croise marées, vent, pression, coefficient et période lunaire pour l'espèce principale en saison. Mis à jour chaque minute." />
          </div>
          <div className="flex justify-center">
            <CircularGauge score={currentScore.total} />
          </div>
          <div className="space-y-2">
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
        className="bg-gradient-to-br from-slate-800/80 to-slate-900 rounded-xl border border-slate-700/50 p-4 cursor-pointer select-none active:scale-[0.99] transition-transform"
        onClick={toggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Aujourd&apos;hui</p>
            <p className="text-white font-bold text-lg leading-tight">Conditions difficiles</p>
            <p className="text-slate-400 text-sm mt-1">Aucune sortie optimale prévue</p>
            <Link
              href="/semaine"
              onClick={stopProp}
              className="inline-block mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Voir les prochains jours →
            </Link>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-3xl font-extrabold tabular-nums ${currentScore.color}`}>{currentScore.total}</p>
            <p className="text-slate-500 text-xs">/100</p>
            <p className="text-slate-500 text-xs mt-0.5">actuel</p>
          </div>
        </div>
        {detailPanel}
        <p className="mt-3 text-center text-xs text-slate-500 py-1 border-t border-slate-700/40">
          {showDetail ? '↑ Masquer le détail' : '↓ Conditions maintenant'}
        </p>
      </div>
    );
  }

  const theme = getTheme(bestWindow.score);

  return (
    <div
      className={`bg-gradient-to-br ${theme.gradient} rounded-xl border ${theme.border} p-4 cursor-pointer select-none active:scale-[0.99] transition-transform`}
      onClick={toggle}
    >
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
          <p className={`text-3xl font-extrabold tabular-nums ${theme.accent}`}>{bestWindow.score}</p>
          <p className="text-slate-500 text-xs">/100</p>
          <p className="text-slate-500 text-xs mt-0.5">sortie</p>
        </div>
      </div>
      {detailPanel}
      <p className="mt-3 text-center text-xs text-slate-500 py-1 border-t border-slate-700/40">
        {showDetail ? '↑ Masquer le détail' : '↓ Conditions maintenant'}
      </p>
    </div>
  );
}
