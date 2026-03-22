'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FavoritePickerProps {
  label: string;
  items: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function FavoritePicker({ label, items, selected, onChange }: FavoritePickerProps) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-sm text-slate-500">Aucune sélection</span>
          ) : (
            selected.map((id) => {
              const item = items.find((i) => i.id === id);
              return item ? (
                <span
                  key={id}
                  className="bg-cyan-400/15 text-cyan-400 border border-cyan-400/40 rounded-full px-2.5 py-0.5 text-xs"
                >
                  {item.name}
                </span>
              ) : null;
            })
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.length > 0 && (
            <span className="text-xs text-slate-500">({selected.length})</span>
          )}
          {open ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Sélecteur grid */}
      {open && (
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((item) => {
              const active = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] text-left ${
                    active
                      ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/40'
                      : 'bg-slate-900/50 text-slate-400 border border-transparent hover:border-slate-600'
                  }`}
                >
                  <span className={`text-xs shrink-0 ${active ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {active ? '✓' : '○'}
                  </span>
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
