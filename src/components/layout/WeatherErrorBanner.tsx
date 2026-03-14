import { WifiOff } from 'lucide-react';

export default function WeatherErrorBanner() {
  return (
    <div className="bg-amber-900/30 border-b border-amber-700/40 px-4 py-2 flex items-center gap-2 shrink-0">
      <WifiOff size={14} className="text-amber-400 shrink-0" />
      <p className="text-amber-300 text-xs">
        Données météo indisponibles — scores de pêche non calculés
      </p>
    </div>
  );
}
