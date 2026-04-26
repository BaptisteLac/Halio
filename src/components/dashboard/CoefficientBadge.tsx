'use client';

import { getCoefficientLabel, getCoefficientColor } from '@/lib/tides/coefficient';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { T } from '@/design/tokens';

interface Props {
  coefficient: number;
  size?: 'sm' | 'md' | 'lg';
}

const TOOLTIP = "Coefficient de marée (20–120) : mesure l'amplitude des marées. Vives-eaux (> 70) = forts courants. Mortes-eaux (< 45) = eau calme. Chaque espèce a ses préférences.";

export default function CoefficientBadge({ coefficient, size = 'md' }: Props) {
  const color = getCoefficientColor(coefficient);
  const label = getCoefficientLabel(coefficient);

  const sizes = {
    sm: { padding: '2px 8px', numberSize: '1rem', subSize: '0.75rem' },
    md: { padding: '6px 12px', numberSize: '1.25rem', subSize: '0.75rem' },
    lg: { padding: '8px 16px', numberSize: '1.875rem', subSize: '0.875rem' },
  }[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 10,
        background: T.l3,
        border: `1px solid ${T.border2}`,
        padding: sizes.padding,
      }}>
        <span style={{
          fontWeight: 700,
          lineHeight: 1,
          fontSize: sizes.numberSize,
          color,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {coefficient}
        </span>
        <span style={{
          fontSize: sizes.subSize,
          color: T.t4,
          marginTop: 2,
        }}>
          {label}
        </span>
      </div>
      <InfoTooltip content={TOOLTIP} />
    </div>
  );
}
