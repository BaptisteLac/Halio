'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface Props {
  content: string;
}

export default function InfoTooltip({ content }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onOutsideClick);
    return () => document.removeEventListener('click', onOutsideClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-slate-500 hover:text-slate-400 transition-colors p-0.5 min-w-[24px] min-h-[24px] flex items-center justify-center"
        aria-label="En savoir plus"
        aria-expanded={open}
      >
        <Info size={13} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-slate-700 border border-slate-600 rounded-xl p-3 text-xs text-slate-300 leading-relaxed z-50 shadow-xl">
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"
            aria-hidden
          />
          {content}
        </div>
      )}
    </div>
  );
}
