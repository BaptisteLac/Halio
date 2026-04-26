import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getSpeciesBySlug, SPECIES } from '@/data/species';
import ScoreBlock from '@/components/species/ScoreBlock';
import BottomNav from '@/components/layout/BottomNav';
import SpeciesViewTracker from '@/components/species/SpeciesViewTracker';
import { T } from '@/design/tokens';
import { IFish, IWind, IAlertTri, IArrowUp, IArrowDown } from '@/design/icons';

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

const PHASE_LABELS: Record<string, string> = {
  montant:    'Montant',
  descendant: 'Descendant',
  etale:      'Étale',
  tous:       'Toutes phases',
};

const PHASE_ICONS: Record<string, React.ReactNode> = {
  montant:    <IArrowUp size={11} color={T.accent} />,
  descendant: <IArrowDown size={11} color={T.t3} />,
  etale:      null,
  tous:       null,
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

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t1, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: T.l3, borderRadius: 10, padding: '8px 10px' }}>
      <p style={{ fontSize: '0.6875rem', color: T.t4, margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: accent ? T.accent : T.t1, margin: 0 }}>{value}</p>
    </div>
  );
}

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
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
      <SpeciesViewTracker speciesId={species.id} speciesName={species.name} />

      <header style={{
        flexShrink: 0,
        background: T.l1,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 512, margin: '0 auto' }}>
          <Link
            href="/especes"
            style={{ padding: 6, marginLeft: -6, borderRadius: 8, color: T.t3, display: 'flex', transition: 'color 0.12s ease' }}
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {species.name}
            </h1>
            <p style={{ fontSize: '0.75rem', color: T.t3, fontStyle: 'italic', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {species.scientificName}
            </p>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 512, margin: '0 auto' }}>

          {species.localNames.length > 0 && (
            <p style={{ fontSize: '0.875rem', color: T.t3, margin: 0 }}>
              Aussi appelé : <span style={{ color: T.t2 }}>{species.localNames.join(', ')}</span>
            </p>
          )}

          <ScoreBlock species={species} />

          {/* Réglementation */}
          <Section title="Réglementation" icon={<IFish size={14} color={T.accent} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoCell label="Taille min" value={species.minSize ? `${species.minSize} cm` : 'Aucune'} />
              <InfoCell label="Quota journalier" value={species.dailyQuota ? `${species.dailyQuota} / jour` : 'Illimité'} />
              <InfoCell label="Marquage" value={species.markingRequired ? 'Obligatoire' : 'Non requis'} />
              <InfoCell label="Fermeture" value={species.closedPeriod ?? 'Aucune'} />
            </div>
          </Section>

          {/* Saison */}
          <Section title="Saison">
            <div style={{ display: 'flex', gap: 3 }}>
              {MONTH_LABELS.map((label, i) => {
                const month = i + 1;
                const inSeason = seasonMonths.includes(month);
                const isPeak = species.peakMonths.includes(month);
                return (
                  <div key={month} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      height: 20,
                      borderRadius: 4,
                      background: isPeak ? T.accent : inSeason ? `${T.accent}40` : T.l3,
                    }} />
                    <p style={{ fontSize: '0.5rem', color: T.t4, marginTop: 2 }}>{label}</p>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>Cyan plein = pic d&apos;activité</p>
          </Section>

          {/* Conditions optimales */}
          <Section title="Conditions optimales" icon={<IWind size={14} color={T.accent} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoCell label="Coefficient" value={`${species.optimalCoeffRange[0]}–${species.optimalCoeffRange[1]}`} />
              <div style={{ background: T.l3, borderRadius: 10, padding: '8px 10px' }}>
                <p style={{ fontSize: '0.6875rem', color: T.t4, margin: '0 0 2px' }}>Phase marée</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t1, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {PHASE_ICONS[species.optimalTidePhase]}
                  {PHASE_LABELS[species.optimalTidePhase]}
                </p>
              </div>
              <InfoCell label="Heures de marée" value={species.optimalTideHours.map((h) => `H${h}`).join(', ')} />
              <InfoCell label="Temp. eau" value={`${species.optimalWaterTemp.min}–${species.optimalWaterTemp.max} °C`} />
            </div>
          </Section>

          {/* Techniques */}
          <Section title="Techniques">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {species.techniques.map((t) => (
                <span key={t} style={{
                  fontSize: '0.75rem',
                  color: T.accent,
                  background: `${T.accent}15`,
                  border: `1px solid ${T.accent}30`,
                  padding: '4px 10px',
                  borderRadius: 9999,
                }}>
                  {TECHNIQUE_LABELS[t] ?? t}
                </span>
              ))}
            </div>

            {species.lures.length > 0 && (
              <div style={{ paddingTop: 8, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: T.t3, margin: '0 0 4px' }}>Leurres recommandés</p>
                {species.lures.slice(0, 5).map((lure) => (
                  <div key={lure.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    padding: '6px 0',
                    borderBottom: `1px solid ${T.border}`,
                  }}
                  className="last:border-0"
                  >
                    <div>
                      <span style={{ color: T.t1 }}>{lure.name}</span>
                      <span style={{ color: T.t3, marginLeft: 6 }}>{lure.brand}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ color: T.t3 }}>{lure.weight}</span>
                      <span style={{ color: T.t3, background: T.l3, padding: '2px 6px', borderRadius: 4 }}>{lure.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {species.baits.length > 0 && (
              <div style={{ paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: T.t3, margin: '0 0 8px' }}>Appâts naturels</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {species.baits.map((bait) => (
                    <span key={bait} style={{
                      fontSize: '0.75rem',
                      color: T.t2,
                      background: T.l3,
                      padding: '4px 10px',
                      borderRadius: 9999,
                    }}>
                      {bait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {species.colors.length > 0 && (
              <div style={{ paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: T.t3, margin: '0 0 8px' }}>Couleurs</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {species.colors.map((color) => (
                    <li key={color} style={{ fontSize: '0.75rem', color: T.t2, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ color: T.accent, marginTop: 1 }}>·</span>
                      {color}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {/* Description */}
          <p style={{ fontSize: '0.875rem', color: T.t2, lineHeight: 1.6, margin: 0 }}>{species.description}</p>

          {/* Conseil local */}
          <div style={{
            background: `${T.accent}08`,
            border: `1px solid ${T.accent}20`,
            borderRadius: 14,
            padding: '10px 12px',
          }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: T.accent, margin: '0 0 4px' }}>Conseil local</p>
            <p style={{ fontSize: '0.8125rem', color: T.t2, lineHeight: 1.55, margin: 0 }}>{species.tips}</p>
          </div>

          {/* Alerte fermeture */}
          {species.closedPeriod && (
            <div style={{
              display: 'flex',
              gap: 8,
              background: 'rgba(127,29,29,.2)',
              border: `1px solid rgba(239,68,68,.25)`,
              borderRadius: 14,
              padding: '10px 12px',
              alignItems: 'flex-start',
            }}>
              <IAlertTri size={15} color={T.danger} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.8125rem', color: '#fca5a5', lineHeight: 1.5, margin: 0 }}>
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
