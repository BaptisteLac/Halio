import type { Spot, ZoneType } from '@/types';

interface Props {
  spot: Spot;
  score?: number;
  isSelected: boolean;
}

const SCORE_COLOR: [number, string, string][] = [
  [85, '#083344', '#22d3ee'], // cyan
  [70, '#052e16', '#4ade80'], // green
  [55, '#422006', '#facc15'], // yellow
  [40, '#431407', '#fb923c'], // orange
  [0,  '#450a0a', '#f87171'], // red
];

const ZONE_COLOR: Record<ZoneType, string> = {
  passes:       '#22d3ee',
  bancs:        '#4ade80',
  fosses:       '#a78bfa',
  parcs:        '#fbbf24',
  chenaux:      '#fb923c',
  'cap-ferret': '#f472b6',
  plages:       '#94a3b8',
};

function getScoreColors(score: number): { bg: string; border: string } {
  for (const [threshold, bg, border] of SCORE_COLOR) {
    if (score >= threshold) return { bg, border };
  }
  return { bg: '#1e293b', border: '#475569' };
}

export default function SpotMarker({ spot, score, isSelected }: Props) {
  const hasScore = score !== undefined;
  const { bg, border } = hasScore ? getScoreColors(score) : { bg: '#1e293b', border: '#475569' };
  const size = isSelected ? 42 : 32;

  return (
    <div
      style={{
        width: size,
        height: size,
        background: bg,
        border: `2px solid ${isSelected ? '#ffffff' : border}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${border}44, 0 4px 12px rgba(0,0,0,0.5)`
          : '0 2px 6px rgba(0,0,0,0.4)',
        transition: 'all 0.15s ease',
      }}
      className={`rounded-full flex items-center justify-center cursor-pointer select-none hover:scale-110 ${
        !isSelected ? 'animate-[marker-pulse_3s_ease-in-out_infinite]' : ''
      }`}
    >
      {hasScore ? (
        <span
          style={{ color: border, fontSize: isSelected ? 13 : 11 }}
          className="font-bold tabular-nums leading-none"
        >
          {score}
        </span>
      ) : (
        <span
          style={{ background: ZONE_COLOR[spot.zone], width: 8, height: 8 }}
          className="rounded-full"
        />
      )}
    </div>
  );
}
