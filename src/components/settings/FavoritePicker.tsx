'use client';

import { useState } from 'react';
import { T } from '@/design/tokens';
import { IChevDown, IChevUp } from '@/design/icons';

interface FavoritePickerProps {
  items:    { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function FavoritePicker({ items, selected, onChange }: FavoritePickerProps) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'left', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1, minWidth: 0 }}>
          {selected.length === 0 ? (
            <span style={{ fontSize: '0.875rem', color: T.t4 }}>Aucune sélection</span>
          ) : (
            selected.map((id) => {
              const item = items.find((i) => i.id === id);
              return item ? (
                <span key={id} style={{ fontSize: '0.75rem', color: T.accent, background: `${T.accent}15`, border: `1px solid ${T.accent}35`, borderRadius: 9999, padding: '2px 10px' }}>
                  {item.name}
                </span>
              ) : null;
            })
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {selected.length > 0 && <span style={{ fontSize: '0.75rem', color: T.t4 }}>({selected.length})</span>}
          {open ? <IChevUp size={16} color={T.t4} /> : <IChevDown size={16} color={T.t4} />}
        </div>
      </button>

      {open && (
        <div style={{ background: T.l2, borderRadius: 12, border: `1px solid ${T.border}`, padding: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {items.map((item) => {
              const active = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 8,
                    minHeight: 44,
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: `1px solid ${active ? `${T.accent}40` : 'transparent'}`,
                    background: active ? `${T.accent}15` : T.l3,
                    color: active ? T.accent : T.t3,
                    fontSize: '0.875rem',
                    transition: 'background 0.12s ease',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', flexShrink: 0, color: active ? T.accent : T.t4 }}>
                    {active ? '✓' : '○'}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
