import type { FishingScore, BestWindow, SpeciesResult } from '@/types';

interface Props {
  score: FishingScore;
  bestWindow: BestWindow | null;
  topSpecies: SpeciesResult[];
}

// Correspondance entre les niveaux de score et les couleurs hexadécimales pour le SVG
const SCORE_HEX: Record<string, string> = {
  cyan: '#22d3ee',
  green: '#4ade80',
  yellow: '#facc15',
  orange: '#fb923c',
  red: '#f87171',
};

// Renvoie la couleur hexadécimale correspondant au score total (0-100)
function scoreToHex(total: number): string {
  if (total >= 85) return SCORE_HEX.cyan!;
  if (total >= 70) return SCORE_HEX.green!;
  if (total >= 55) return SCORE_HEX.yellow!;
  if (total >= 40) return SCORE_HEX.orange!;
  return SCORE_HEX.red!;
}

// Formate une date en heure locale française (HH:MM)
function fmt(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

// Jauge circulaire SVG affichant le score de 0 à 100
function MiniGauge({ score }: { score: number }) {
  const radius = 26;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = scoreToHex(score);

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      {/* Piste de fond gris foncé */}
      <circle cx="32" cy="32" r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
      {/* Arc de progression coloré selon le score */}
      <circle
        cx="32" cy="32" r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      {/* Valeur numérique au centre */}
      <text x="32" y="36" textAnchor="middle" fill={color} fontSize="14" fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

// Bloc héros affiché en haut du dashboard : score du jour, fenêtre optimale, espèce recommandée
export default function DayHero({ score, bestWindow, topSpecies }: Props) {
  const top = topSpecies[0];

  return (
    <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 rounded-xl border border-cyan-800/30 p-4">
      <p className="text-xs text-cyan-400/70 uppercase tracking-wide mb-3">
        Score de pêche · Aujourd&apos;hui
      </p>

      <div className="flex items-center gap-4">
        <MiniGauge score={score.total} />

        <div className="flex-1 min-w-0">
          {/* Label du score (ex : "Excellent", "Bon", "Moyen"…) */}
          <p className={`text-xl font-bold ${score.color}`}>{score.label}</p>

          {/* Fenêtre horaire optimale si disponible */}
          {bestWindow ? (
            <p className="text-sm text-slate-300 mt-1">
              ⏰ Optimal{' '}
              <span className="font-semibold text-white">
                {fmt(bestWindow.start)} → {fmt(bestWindow.end)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Aucune fenêtre optimale aujourd&apos;hui</p>
          )}

          {/* Espèce recommandée et leurre principal */}
          {top && (
            <p className="text-sm text-slate-400 mt-0.5">
              🐟{' '}
              <span className="text-slate-200 font-medium">{top.species.name}</span>
              {top.species.lures[0] && (
                <span className="text-slate-500"> · {top.species.lures[0].name}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
