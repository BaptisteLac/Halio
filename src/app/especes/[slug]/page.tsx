import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle, Fish, Thermometer, Wind } from 'lucide-react';
import { getSpeciesBySlug, SPECIES } from '@/data/species';
import ScoreBlock from '@/components/species/ScoreBlock';
import BottomNav from '@/components/layout/BottomNav';

export function generateStaticParams() {
  return SPECIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const species = getSpeciesBySlug(slug);
  if (!species) return { title: 'Espèce introuvable — Halioapp' };
  return { title: `${species.name} — Halioapp` };
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  montant:    '↑ Montant',
  descendant: '↓ Descendant',
  etale:      '⇒ Étale',
  tous:       'Toutes phases',
};

const TECHNIQUE_LABELS: Record<string, string> = {
  'leurre-souple':  'Leurre souple',
  'leurre-surface': 'Surface',
  'poisson-nageur': 'Poisson nageur',
  vif:              'Vif',
  verticale:        'Verticale',
  traine:           'Traîne',
  mouche:           'Mouche',
  surf:             'Surfcasting',
  jigging:          'Jigging',
  posé:             'Posé',
  palangrotte:      'Palangrotte',
  casier:           'Casier',
  sèche:            'Sèche (seiche)',
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ─── Composant ────────────────────────────────────────────────────────────────

export default async function SpeciesSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const species = getSpeciesBySlug(slug);
  if (!species) notFound();

  const seasonMonths = (() => {
    const months: number[] = [];
    const { start, end } = species.season;
    if (start <= end) {
      for (let m = start; m <= end; m++) months.push(m);
    } else {
      for (let m = start; m <= 12; m++) months.push(m);
      for (let m = 1; m <= end; m++) months.push(m);
    }
    return months;
  })();

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950">
      {/* Header */}
      <header className="shrink-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
          <Link
            href="/especes"
            className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate">{species.name}</h1>
            <p className="text-xs text-slate-500 italic truncate">{species.scientificName}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

          {/* Noms locaux */}
          {species.localNames.length > 0 && (
            <p className="text-slate-400 text-sm">
              Aussi appelé : <span className="text-slate-300">{species.localNames.join(', ')}</span>
            </p>
          )}

          {/* Score actuel */}
          <ScoreBlock species={species} />

          {/* Réglementation */}
          <section className="bg-slate-800 rounded-xl p-4 space-y-2">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <Fish size={14} className="text-cyan-400" />
              Réglementation
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400">Taille min</p>
                <p className="text-white font-medium mt-0.5">
                  {species.minSize ? `${species.minSize} cm` : 'Aucune'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400">Quota journalier</p>
                <p className="text-white font-medium mt-0.5">
                  {species.dailyQuota ? `${species.dailyQuota} / jour` : 'Illimité'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400">Marquage</p>
                <p className="text-white font-medium mt-0.5">
                  {species.markingRequired ? 'Obligatoire' : 'Non requis'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400">Fermeture</p>
                <p className="text-white font-medium mt-0.5">
                  {species.closedPeriod ?? 'Aucune'}
                </p>
              </div>
            </div>
          </section>

          {/* Saison */}
          <section className="bg-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-white font-semibold text-sm">Saison</h2>
            <div className="flex gap-1">
              {MONTH_LABELS.map((label, i) => {
                const month = i + 1;
                const inSeason = seasonMonths.includes(month);
                const isPeak = species.peakMonths.includes(month);
                return (
                  <div key={month} className="flex-1 text-center">
                    <div
                      className={`h-5 rounded-sm ${
                        isPeak
                          ? 'bg-cyan-400'
                          : inSeason
                          ? 'bg-cyan-400/30'
                          : 'bg-slate-700'
                      }`}
                    />
                    <p className="text-[8px] text-slate-500 mt-0.5">{label}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">
              Cyan foncé = pic d&apos;activité
            </p>
          </section>

          {/* Conditions optimales */}
          <section className="bg-slate-800 rounded-xl p-4 space-y-2">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <Wind size={14} className="text-cyan-400" />
              Conditions optimales
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400">Coefficient</p>
                <p className="text-white font-medium mt-0.5">
                  {species.optimalCoeffRange[0]}–{species.optimalCoeffRange[1]}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400">Phase marée</p>
                <p className="text-white font-medium mt-0.5">
                  {PHASE_LABELS[species.optimalTidePhase]}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400">Heures de marée</p>
                <p className="text-white font-medium mt-0.5">
                  {species.optimalTideHours.map((h) => `H${h}`).join(', ')}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2.5">
                <p className="text-slate-400 flex items-center gap-1">
                  <Thermometer size={10} />
                  Temp. eau
                </p>
                <p className="text-white font-medium mt-0.5">
                  {species.optimalWaterTemp.min}–{species.optimalWaterTemp.max} °C
                </p>
              </div>
            </div>
          </section>

          {/* Techniques */}
          <section className="bg-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-white font-semibold text-sm">Techniques</h2>
            <div className="flex flex-wrap gap-1.5">
              {species.techniques.map((t) => (
                <span
                  key={t}
                  className="text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-1 rounded-full"
                >
                  {TECHNIQUE_LABELS[t] ?? t}
                </span>
              ))}
            </div>

            {/* Leurres */}
            {species.lures.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs font-medium">Leurres recommandés</p>
                {species.lures.slice(0, 5).map((lure) => (
                  <div
                    key={lure.name}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-700/50 last:border-0"
                  >
                    <div>
                      <span className="text-slate-200">{lure.name}</span>
                      <span className="text-slate-500 ml-1.5">{lure.brand}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400">{lure.weight}</span>
                      <span className="text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        {lure.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Appâts */}
            {species.baits.length > 0 && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs font-medium mb-1.5">Appâts naturels</p>
                <div className="flex flex-wrap gap-1.5">
                  {species.baits.map((bait) => (
                    <span
                      key={bait}
                      className="text-xs text-slate-300 bg-slate-700/60 px-2 py-1 rounded-full"
                    >
                      {bait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Couleurs */}
            {species.colors.length > 0 && (
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs font-medium mb-1.5">Couleurs</p>
                <ul className="space-y-1">
                  {species.colors.map((color) => (
                    <li key={color} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5">·</span>
                      {color}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Description */}
          <section className="space-y-2">
            <p className="text-slate-300 text-sm leading-relaxed">{species.description}</p>
          </section>

          {/* Tips */}
          <section className="bg-cyan-400/5 border border-cyan-400/20 rounded-xl p-3">
            <p className="text-cyan-400 text-xs font-medium mb-1">💡 Conseil local</p>
            <p className="text-slate-300 text-xs leading-relaxed">{species.tips}</p>
          </section>

          {/* Alerte période fermée */}
          {species.closedPeriod && (
            <div className="flex gap-2 bg-red-900/20 border border-red-500/30 rounded-xl p-3">
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">
                Période de fermeture : {species.closedPeriod}
              </p>
            </div>
          )}

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
