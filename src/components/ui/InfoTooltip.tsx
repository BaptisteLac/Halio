'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { T } from '@/design/tokens';

interface Props {
  content: string;
}

function InfoDialog({ content, onClose }: { content: string; onClose: () => void }) {
  const handleBackdrop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return createPortal(
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={handleDialog}
        style={{
          width: '100%',
          maxWidth: 480,
          background: T.l1,
          border: `1px solid ${T.border2}`,
          borderRadius: 16,
          padding: '20px 20px 20px',
          position: 'relative',
          boxShadow: '0 25px 50px rgba(0,0,0,.5)',
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: T.t3,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
          }}
        >
          <X size={20} />
        </button>

        <p style={{
          fontSize: '1rem',
          lineHeight: 1.7,
          color: T.t2,
          paddingRight: 32,
          margin: 0,
        }}>
          {content}
        </p>
      </div>
    </div>,
    document.body
  );
}

export default function InfoTooltip({ content }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label="En savoir plus"
        style={{
          color: T.t4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          minWidth: 24,
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Info size={13} />
      </button>

      {open && <InfoDialog content={content} onClose={() => setOpen(false)} />}
    </>
  );
}
