import type { FishingScore, ScoreFactors } from '@/types';

interface Props {
  score: FishingScore;
  showFactors?: boolean;
}

const SCORE_COLORS: Record<string, string> = {
  cyan: '#22d3ee',
  green: '#4ade80',
  yellow: '#facc15',
  orange: '#fb923c',
  red: '#f87171',
};

function getHexColor(score: number): string {
  if (score >= 85) return SCORE_COLORS.cyan!;
  if (score >= 70) return SCORE_COLORS.green!;
  if (score >= 55) return SCORE_COLORS.yellow!;
  if (score >= 40) return SCORE_COLORS.orange!;
  return SCORE_COLORS.red!;
}

function CircularGauge({ score }: { score: number }) {
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = getHexColor(score);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-lg">
      {/* Track */}
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
      {/* Progress */}
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Score number */}
      <text x="70" y="64" textAnchor="middle" fill={color} fontSize="30" fontWeight="700">
        {score}
      </text>
      {/* /100 */}
      <text x="70" y="82" textAnchor="middle" fill="#475569" fontSize="13">
        /100
      </text>
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
  const barColor =
    value >= 70 ? 'bg-green-400' : value >= 40 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function FishingScoreCard({ score, showFactors = false }: Props) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-300 font-medium text-sm">Score de pêche</h3>
        <span className={`text-sm font-semibold ${score.color}`}>{score.label}</span>
      </div>

      <div className="flex justify-center my-1">
        <CircularGauge score={score.total} />
      </div>

      {showFactors && (
        <div className="space-y-2 mt-3 pt-3 border-t border-slate-700/50">
          {(Object.entries(score.factors) as [keyof ScoreFactors, number][]).map(([key, value]) => (
            <FactorBar key={key} label={FACTOR_LABELS[key]} value={value} />
          ))}
        </div>
      )}
    </div>
  );
}
