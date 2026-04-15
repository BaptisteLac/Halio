'use client';

interface Suggestion {
  title: string;
  subtitle: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    title: "Où sortir aujourd'hui ?",
    subtitle: "Meilleur spot + espèce + créneau horaire",
  },
  {
    title: "Quel leurre pour ce coefficient ?",
    subtitle: "Recommandation adaptée aux conditions",
  },
  {
    title: "Réglementation du bar ?",
    subtitle: "Tailles, quotas, marquage",
  },
  {
    title: "Comparer deux spots pour demain",
    subtitle: "Passe Nord vs Rade d'Eyrac",
  },
];

interface SuggestionCardsProps {
  onSelect: (text: string) => void;
}

export default function SuggestionCards({ onSelect }: SuggestionCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.title}
          onClick={() => onSelect(s.title)}
          className="text-left px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all duration-150 active:scale-95 group"
        >
          <p className="text-slate-200 text-sm font-medium leading-snug group-hover:text-white transition-colors">
            {s.title}
          </p>
          <p className="text-slate-400 text-xs mt-1 leading-snug group-hover:text-slate-400 transition-colors">
            {s.subtitle}
          </p>
        </button>
      ))}
    </div>
  );
}
