// Halio Design System v2 — Primitive Components
// Copie ce fichier dans src/design/primitives.tsx
// Prérequis : DM Sans chargé via next/font/google, tokens.ts importé

'use client';

import React, { useState } from 'react';
import { T, RADIUS, SPACE } from './tokens';

// ─────────────────────────────────────────
// HEADER
// sticky, backdrop-blur, border-b
// ─────────────────────────────────────────
interface HeaderProps {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}

export function Header({ title, sub, right }: HeaderProps) {
  return (
    <header style={{
      background: T.l1,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${T.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 512,
        margin: '0 auto',
      }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: T.t1, letterSpacing: '-0.02em' }}>
            {title}
          </div>
          {sub && (
            <div style={{ fontSize: '0.6875rem', color: T.t3, marginTop: 1, textTransform: 'capitalize' }}>
              {sub}
            </div>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────
// CARD — surface L2
// ─────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, style = {}, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.l2,
        border: `1px solid ${T.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACE.lg,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// CELL — surface L3 (inner cells, no border)
// ─────────────────────────────────────────
export function Cell({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.l3,
      borderRadius: RADIUS.md,
      padding: SPACE.md,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// LABEL — section label uppercase
// ─────────────────────────────────────────
export function Label({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: '0.6875rem',
      fontWeight: 600,
      color: T.t4,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────
export function Divider({ my = 8 }: { my?: number }) {
  return <div style={{ height: 1, background: T.border, margin: `${my}px 0` }} />;
}

// ─────────────────────────────────────────
// PRESSABLE — tap-friendly with scale feedback
// Usage: wraps any element to give it press feedback
// ─────────────────────────────────────────
export function Pressable({
  children,
  onClick,
  style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.12s ease, opacity 0.12s ease',
        transform: pressed ? 'scale(0.975)' : 'scale(1)',
        opacity: pressed ? 0.85 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// BADGE — pill badge avec couleur sémantique
// ─────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  color?: string; // hex
  style?: React.CSSProperties;
}

export function Badge({ children, color = T.accent, style = {} }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: RADIUS.full,
      border: `1px solid ${color}33`,
      background: `${color}18`,
      color,
      fontSize: '0.6875rem',
      fontWeight: 500,
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────
// SCORE DOT — point coloré indiquant la saison
// Remplace les pill "En saison / Hors saison"
// ─────────────────────────────────────────
export function SeasonDot({ inSeason }: { inSeason: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: inSeason ? '#4ade80' : T.t4,
        flexShrink: 0,
      }} />
      <span style={{ fontSize: '0.6875rem', color: inSeason ? '#4ade80' : T.t4 }}>
        {inSeason ? 'En saison' : 'Hors saison'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────
// COEFFICIENT BADGE
// ─────────────────────────────────────────
export function CoeffBadge({ coeff }: { coeff: number }) {
  const color = coeff >= 70 ? T.accent : coeff >= 45 ? '#facc15' : T.t3;
  const label = coeff >= 70 ? 'Vives-eaux' : coeff >= 45 ? 'Moyennes' : 'Mortes-eaux';
  return (
    <div style={{
      background: T.l3,
      border: `1px solid ${T.border2}`,
      borderRadius: RADIUS.md,
      padding: '6px 12px',
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: '1.25rem', fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {coeff}
      </span>
      <span style={{ fontSize: '0.625rem', color: T.t4, marginTop: 2 }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────
// SCORE ARC — remplace la jauge circulaire
// Arc speedometer 220° sweep
// ─────────────────────────────────────────
import { scoreColor, scoreLabel } from './tokens';

interface ScoreArcProps {
  score: number;
  size?: number;
}

export function ScoreArc({ score, size = 160 }: ScoreArcProps) {
  const c = scoreColor(score);
  const R = 58, sw = 10;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const startDeg = 210, totalDeg = 240;
  const sweepDeg = (score / 100) * totalDeg;
  const cx = size / 2, cy = size / 2;

  const arcPath = (start: number, sweep: number) => {
    const s = toRad(start), e = toRad(start + sweep);
    const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s);
    const x2 = cx + R * Math.cos(e), y2 = cy + R * Math.sin(e);
    const large = sweep > 180 ? 1 : 0;
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R},0,${large},1,${x2.toFixed(2)},${y2.toFixed(2)}`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score ${score}/100`}>
      <path d={arcPath(startDeg, totalDeg)} fill="none" stroke={T.l3} strokeWidth={sw} strokeLinecap="round" />
      {score > 0 && (
        <path
          d={arcPath(startDeg, sweepDeg)}
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={c} fontSize="34" fontWeight="800" fontFamily="DM Sans">
        {score}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={T.t4} fontSize="12" fontFamily="DM Sans">
        {scoreLabel(score)}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────
// BOTTOM SHEET — slide-up panel
// ─────────────────────────────────────────
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}

export function BottomSheet({ visible, onClose, children, maxHeight = '70dvh' }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 39,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}
      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 56, // bottom nav height
        left: 0,
        right: 0,
        zIndex: 40,
        background: T.l1,
        borderTop: `1px solid ${T.border}`,
        borderRadius: '20px 20px 0 0',
        maxHeight,
        overflowY: 'auto',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: T.l3,
          margin: '10px auto 14px',
        }} />
        {children}
      </div>
    </>
  );
}

// ─────────────────────────────────────────
// TIP BOX & DANGER BOX
// ─────────────────────────────────────────
export function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(34,211,238,.05)',
      border: '1px solid rgba(34,211,238,.15)',
      borderRadius: RADIUS.lg,
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: T.accent, marginBottom: 3 }}>
        Conseil local
      </div>
      <div style={{ fontSize: '0.75rem', color: T.t2, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

export function DangerBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(127,29,29,.18)',
      border: '1px solid rgba(239,68,68,.25)',
      borderRadius: RADIUS.lg,
      padding: '10px 12px',
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '0.75rem', color: '#fca5a5', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────
// PRIMARY BUTTON
// ─────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

export function Button({ children, variant = 'primary', fullWidth = false, style = {}, ...props }: ButtonProps) {
  const variants = {
    primary: { background: T.accent, color: '#0f172a', border: 'none' },
    ghost:   { background: 'transparent', color: T.t3, border: `1px solid ${T.border}` },
    danger:  { background: 'rgba(127,29,29,.2)', color: T.danger, border: '1px solid rgba(239,68,68,.3)' },
  };
  const v = variants[variant];
  return (
    <button
      {...props}
      style={{
        ...v,
        borderRadius: RADIUS.lg,
        padding: '13px 20px',
        fontSize: '0.875rem',
        fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer',
        minHeight: 44,
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'opacity 0.15s ease',
        opacity: props.disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style = {}, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: '0.6875rem', color: T.t3, fontWeight: 500 }}>{label}</label>
      )}
      <input
        {...props}
        style={{
          background: T.l3,
          border: `1px solid ${T.border2}`,
          borderRadius: RADIUS.md,
          padding: '10px 12px',
          color: T.t1,
          fontSize: '0.875rem',
          fontFamily: 'DM Sans, sans-serif',
          outline: 'none',
          width: '100%',
          minHeight: 44,
          ...style,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// TOGGLE
// ─────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: T.l3, borderRadius: RADIUS.lg, padding: '12px 16px',
    }}>
      <span style={{ fontSize: '0.875rem', color: T.t1 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-label={label}
        style={{
          position: 'relative', width: 40, height: 24, borderRadius: 999,
          background: checked ? T.accent : T.l2,
          border: 'none', cursor: 'pointer',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 4,
          left: checked ? 20 : 4,
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          transition: 'left 0.2s ease',
        }} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// COACH FAB — floating action button violet
// ─────────────────────────────────────────
export function CoachFAB({ onClick }: { onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      aria-label="Ouvrir le Coach Halio"
      style={{
        position: 'fixed',
        bottom: 74, right: 16,
        width: 50, height: 50,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: pressed ? '0 2px 8px rgba(167,139,250,.3)' : '0 4px 16px rgba(167,139,250,.4)',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        transform: pressed ? 'scale(0.9)' : 'scale(1)',
        zIndex: 45,
      }}
    >
      {/* Sparkles icon */}
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
        <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/>
        <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/>
      </svg>
    </button>
  );
}
