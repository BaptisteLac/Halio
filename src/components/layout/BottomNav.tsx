'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ICalCheck, ICalDays, IMap, IFish, IUser } from '@/design/icons';
import { T } from '@/design/tokens';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',        label: "Aujourd'hui", icon: ICalCheck },
  { href: '/semaine', label: 'Semaine',     icon: ICalDays  },
  { href: '/carte',   label: 'Carte',       icon: IMap      },
  { href: '/especes', label: 'Espèces',     icon: IFish     },
  { href: '/moi',     label: 'Moi',         icon: IUser     },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: T.l1,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${T.border}`,
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{ display: 'flex', maxWidth: 512, margin: '0 auto' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 10,
                paddingBottom: 10,
                gap: 4,
                minHeight: 56,
                position: 'relative',
                textDecoration: 'none',
                transition: 'opacity 0.12s ease',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 0,
                  left: '50%', transform: 'translateX(-50%)',
                  width: 24, height: 2,
                  background: T.accent,
                  borderRadius: '0 0 2px 2px',
                }} />
              )}
              <Icon
                size={20}
                color={active ? T.accent : T.t3}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: active ? 600 : 400,
                color: active ? T.accent : T.t3,
                lineHeight: 1,
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
