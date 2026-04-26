'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Star, Bell, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SPECIES } from '@/data/species';
import { SPOTS } from '@/data/spots';
import { T } from '@/design/tokens';
import { IUser, IChevRight } from '@/design/icons';
import BottomNav from '@/components/layout/BottomNav';

interface MiniStats {
  catchCount: number;
  topSpeciesName: string | null;
  topSpotName: string | null;
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: T.t4,
  padding: '0 4px',
  marginBottom: 6,
};

export default function MoiClient() {
  const [user,  setUser]  = useState<SupabaseUser | null | undefined>(undefined);
  const [stats, setStats] = useState<MiniStats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setStats(null); return; }
    const supabase  = createClient();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

    supabase
      .from('catches')
      .select('species_id, spot_id')
      .eq('user_id', user.id)
      .gte('caught_at', yearStart)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setStats({ catchCount: 0, topSpeciesName: null, topSpotName: null });
          return;
        }
        const speciesCount: Record<string, number> = {};
        const spotCount:   Record<string, number> = {};
        for (const row of data) {
          speciesCount[row.species_id] = (speciesCount[row.species_id] ?? 0) + 1;
          spotCount[row.spot_id]       = (spotCount[row.spot_id]       ?? 0) + 1;
        }
        const topSpeciesId = Object.entries(speciesCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const topSpotId    = Object.entries(spotCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        setStats({
          catchCount:     data.length,
          topSpeciesName: topSpeciesId ? (SPECIES.find((s) => s.id === topSpeciesId)?.name ?? null) : null,
          topSpotName:    topSpotId    ? (SPOTS.find((s) => s.id === topSpotId)?.name    ?? null) : null,
        });
      });
  }, [user]);

  if (user === undefined) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: T.page }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 32px', textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>🎣</p>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: '0 0 8px' }}>Bienvenue sur Halio</h1>
            <p style={{ fontSize: '0.875rem', color: T.t3, lineHeight: 1.6, margin: 0 }}>
              Connectez-vous pour accéder à votre journal de pêche, vos préférences et vos alertes.
            </p>
          </div>
          <Link href="/journal" style={{ background: T.accent, color: '#0f172a', fontWeight: 600, borderRadius: 12, padding: '12px 32px', fontSize: '0.875rem', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.page, paddingBottom: 80 }}>
      <header style={{ background: T.l1, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: '12px 16px', maxWidth: 512, margin: '0 auto' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em', margin: 0 }}>Mon profil</h1>
        </div>
      </header>

      <main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 512, margin: '0 auto' }}>

        <div style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: `${T.accent}18`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IUser size={20} color={T.accent} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email ?? 'Utilisateur'}
            </p>
            <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0 }}>Pêcheur du Bassin</p>
          </div>
        </div>

        {stats !== null && (
          <div style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 16px' }}>
            {stats.catchCount === 0 ? (
              <p style={{ fontSize: '0.875rem', color: T.t3, textAlign: 'center', margin: 0 }}>
                Aucune prise —{' '}
                <Link href="/journal" style={{ color: T.accent }}>commencez votre journal</Link>
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', textAlign: 'center', gap: 8 }}>
                <div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: T.accent, margin: 0 }}>{stats.catchCount}</p>
                  <p style={{ fontSize: '0.6875rem', color: T.t3, margin: 0 }}>prises cette année</p>
                </div>
                {stats.topSpeciesName && (
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: T.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{stats.topSpeciesName}</p>
                    <p style={{ fontSize: '0.6875rem', color: T.t3, margin: 0 }}>espèce favorite</p>
                  </div>
                )}
                {stats.topSpotName && (
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: T.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{stats.topSpotName}</p>
                    <p style={{ fontSize: '0.6875rem', color: T.t3, margin: 0 }}>spot favori</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ background: T.l2, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          {[
            { href: '/journal',           icon: <BookOpen size={18} color={T.t3} />, label: 'Journal de pêche' },
            { href: '/moi/preferences',   icon: <Star     size={18} color={T.t3} />, label: 'Mes préférences' },
            { href: '/moi/notifications', icon: <Bell     size={18} color={T.t3} />, label: 'Notifications' },
            { href: '/moi/compte',        icon: <LogOut   size={18} color={T.t3} />, label: 'Mon compte' },
          ].map(({ href, icon, label }, i, arr) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                textDecoration: 'none',
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
              }}
            >
              {icon}
              <span style={{ fontSize: '0.875rem', color: T.t2, flex: 1 }}>{label}</span>
              <IChevRight size={16} color={T.t4} />
            </Link>
          ))}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
