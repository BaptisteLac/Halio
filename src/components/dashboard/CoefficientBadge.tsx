import { getCoefficientLabel, getCoefficientColor } from '@/lib/tides/coefficient';

interface Props {
  coefficient: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function CoefficientBadge({ coefficient, size = 'md' }: Props) {
  const color = getCoefficientColor(coefficient);
  const label = getCoefficientLabel(coefficient);

  const sizes = {
    sm: { container: 'px-2 py-0.5', number: 'text-base', sub: 'text-xs' },
    md: { container: 'px-3 py-1.5', number: 'text-xl', sub: 'text-xs' },
    lg: { container: 'px-4 py-2', number: 'text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center rounded-lg bg-slate-800 border border-slate-700 ${sizes.container}`}>
      <span className={`font-bold leading-none ${color} ${sizes.number}`}>{coefficient}</span>
      <span className={`text-slate-400 mt-0.5 ${sizes.sub}`}>{label}</span>
    </div>
  );
}
