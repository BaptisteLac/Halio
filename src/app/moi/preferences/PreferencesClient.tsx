'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import { T } from '@/design/tokens';
import { IChevRight } from '@/design/icons';
import BottomNav from '@/components/layout/BottomNav';
import FavoritePicker from '@/components/settings/FavoritePicker';

const PORTS = [
  { id: 'arcachon',  label: 'Arcachon' },
  { id: 'andernos',  label: 'Andernos' },
  { id: 'gujan',     label: 'Gujan-Mestras' },
  { id: 'lege',      label: 'Lège-Cap-Ferret' },
  { id: 'la-teste',  label: 'La Teste-de-Buch' },
];

const TECHNIQUES = [
  'Leurre souple', 'Leurre dur', 'Vif', 'Surfcasting', 'Verticale', 'Mouche', 'Jigging',
];

const sectionLabel: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: T.t4,
  marginBottom: 4,
};

export default function PreferencesClient() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.push('/moi');
  }

  const [user,        setUser]        = useState<User | null | undefined>(undefined);
  const [favSpecies,  setFavSpecies]  = useState<string[]>([]);
  const [favSpots,    setFavSpots]    = useState<string[]>([]);
  const [homePort,    setHomePort]    = useState<string>('arcachon');
  const [techniques,  setTechniques]  = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) return;
      supabase
        .from('user_settings')
        .select('favorite_species, favorite_spots, home_port, preferred_techniques')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: s }) => {
          if (s) {
            setFavSpecies(s.favorite_species ?? []);
            setFavSpots(s.favorite_spots ?? []);
            setHomePort(s.home_port ?? 'arcachon');
            setTechniques(s.preferred_techniques ?? []);
          }
        });
    });
  }, []);

  useEffect(() => {
    if (user === null) router.push('/moi');
  }, [user, router]);

  async function saveAll(species = favSpecies, spots = favSpots, port = homePort, techs = techniques) {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id, favorite_species: species, favorite_spots: spots, home_port: port, preferred_techniques: techs,
      });
      if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  }

  function toggleTechnique(tech: string) {
    const next = techniques.includes(tech) ? techniques.filter((t) => t !== tech) : [...techniques, tech];
    setTechniques(next);
    saveAll(favSpecies, favSpots, homePort, next);
  }

  if (user === undefined || !user) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
      <header style={{ background: T.l1, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: '12px 16px', maxWidth: 512, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} aria-label="Retour" style={{ padding: 6, marginLeft: -6, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <IChevRight size={22} color={T.t3} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0, flex: 1 }}>Mes préférences</h1>
          {saving && <span style={{ fontSize: '0.75rem', color: T.t4 }}>Enregistrement…</span>}
          {saved  && <span style={{ fontSize: '0.75rem', color: T.ok, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Sauvegardé</span>}
        </div>
      </header>

      <main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 512, margin: '0 auto' }}>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <p style={sectionLabel}>Mes espèces</p>
            <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>Affichées en priorité sur le dashboard</p>
          </div>
          <FavoritePicker
            items={SPECIES.map((s) => ({ id: s.id, name: s.name }))}
            selected={favSpecies}
            onChange={(updated) => { setFavSpecies(updated); saveAll(updated, favSpots, homePort, techniques); }}
          />
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <p style={sectionLabel}>Mes spots</p>
            <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>Mis en avant sur la carte</p>
          </div>
          <FavoritePicker
            items={SPOTS.map((s) => ({ id: s.id, name: s.name }))}
            selected={favSpots}
            onChange={(updated) => { setFavSpots(updated); saveAll(favSpecies, updated, homePort, techniques); }}
          />
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <p style={sectionLabel}>Port de départ</p>
            <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>Calcul des distances vers les spots</p>
          </div>
          <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            {PORTS.map((port, i) => (
              <button
                key={port.id}
                onClick={() => { setHomePort(port.id); saveAll(favSpecies, favSpots, port.id, techniques); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < PORTS.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.875rem', color: T.t2 }}>{port.label}</span>
                {homePort === port.id ? (
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={10} color="#0f172a" strokeWidth={3} />
                  </span>
                ) : (
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${T.border2}` }} />
                )}
              </button>
            ))}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <p style={sectionLabel}>Techniques préférées</p>
            <p style={{ fontSize: '0.75rem', color: T.t4, margin: 0 }}>Filtres par défaut sur la carte et les espèces</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TECHNIQUES.map((tech) => {
              const active = techniques.includes(tech);
              return (
                <button
                  key={tech}
                  onClick={() => toggleTechnique(tech)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: `1px solid ${active ? `${T.accent}40` : T.border}`,
                    background: active ? `${T.accent}15` : T.l2,
                    color: active ? T.accent : T.t3,
                    transition: 'background 0.12s ease',
                  }}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
