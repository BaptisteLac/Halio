'use client';

import { T } from '@/design/tokens';

interface Suggestion {
  title: string;
  subtitle: string;
}

const SUGGESTIONS: Suggestion[] = [
  { title: "Où sortir aujourd'hui ?",          subtitle: "Meilleur spot + espèce + créneau horaire" },
  { title: "Quel leurre pour ce coefficient ?", subtitle: "Recommandation adaptée aux conditions" },
  { title: "Réglementation du bar ?",           subtitle: "Tailles, quotas, marquage" },
  { title: "Comparer deux spots pour demain",   subtitle: "Passe Nord vs Rade d'Eyrac" },
];

interface SuggestionCardsProps {
  onSelect: (text: string) => void;
}

export default function SuggestionCards({ onSelect }: SuggestionCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {SUGGESTIONS.map((s) => (
        <button
          key={s.title}
          onClick={() => onSelect(s.title)}
          style={{
            textAlign: 'left',
            padding: '12px 14px',
            background: T.l2,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'background 0.12s ease',
          }}
        >
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: T.t2, lineHeight: 1.35, margin: '0 0 4px' }}>
            {s.title}
          </p>
          <p style={{ fontSize: '0.75rem', color: T.t4, lineHeight: 1.35, margin: 0 }}>
            {s.subtitle}
          </p>
        </button>
      ))}
    </div>
  );
}
