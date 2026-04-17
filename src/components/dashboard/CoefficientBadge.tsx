'use client';

import { getCoefficientLabel, getCoefficientColor } from '@/lib/tides/coefficient';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface Props {
  coefficient: number;
  size?: 'sm' | 'md' | 'lg';
}

const TOOLTIP = "Coefficient de marée (20–120) : mesure l'amplitude des marées. Vives-eaux (> 70) = forts courants. Mortes-eaux (< 45) = eau calme. Chaque espèce a ses préférences.";

export default function CoefficientBadge({ coefficient, size = 'md' }: Props) {
  const color = getCoefficientColor(coefficient);
  const label = getCoefficientLabel(coefficient);

  const sizes = {
    sm: { container: 'px-2 py-0.5', number: 'text-base', sub: 'text-xs' },
    md: { container: 'px-3 py-1.5', number: 'text-xl', sub: 'text-xs' },
    lg: { container: 'px-4 py-2', number: 'text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <div className="flex items-center gap-1">
      <div className={`inline-flex flex-col items-center rounded-lg bg-slate-800 border border-slate-700 ${sizes.container}`}>
        <span className={`font-bold leading-none ${color} ${sizes.number}`}>{coefficient}</span>
        <span className={`text-slate-400 mt-0.5 ${sizes.sub}`}>{label}</span>
      </div>
      <InfoTooltip content={TOOLTIP} />
    </div>
  );
}
