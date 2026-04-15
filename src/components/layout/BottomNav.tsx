'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, CalendarDays, Fish, Map, Sparkles, User } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  activeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: "Aujourd'hui", icon: CalendarCheck },
  { href: '/semaine', label: 'Semaine', icon: CalendarDays },
  { href: '/carte', label: 'Carte', icon: Map },
  { href: '/especes', label: 'Espèces', icon: Fish },
  { href: '/coach', label: 'Coach', icon: Sparkles, activeColor: 'text-violet-400' },
  { href: '/moi', label: 'Moi', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, activeColor }) => {
          const active = pathname === href;
          const activeClass = activeColor ?? 'text-cyan-400';
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 min-h-[56px] transition-colors ${
                active ? activeClass : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
