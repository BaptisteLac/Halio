import { Wind, Gauge, CloudRain, Waves, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  getWindDirectionLabel,
  kmhToKnots,
  getBeaufortScale,
  getWeatherCodeLabel,
} from '@/lib/weather/weather-service';
import type { WeatherData } from '@/types';

interface Props {
  weather: WeatherData;
  compact?: boolean;
}

function PressureIcon({ trend }: { trend: 'hausse' | 'stable' | 'baisse' }) {
  if (trend === 'hausse') return <TrendingUp size={13} className="text-orange-400" />;
  if (trend === 'baisse') return <TrendingDown size={13} className="text-green-400" />;
  return <Minus size={13} className="text-slate-500" />;
}

export default function WeatherCard({ weather, compact = false }: Props) {
  const { current } = weather;
  const windKnots = kmhToKnots(current.windSpeed);
  const gustKnots = kmhToKnots(current.windGusts);
  const beaufort = getBeaufortScale(current.windSpeed);
  const windDir = getWindDirectionLabel(current.windDirection);
  const hasGusts = current.windGusts > current.windSpeed * 1.3;

  // Affichage condensé pour les vues compactes (ex. grille du dashboard)
  if (compact) {
    return (
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3 space-y-1.5">
        <h3 className="text-slate-400 font-medium text-xs">Météo</h3>
        <p className="text-white font-bold text-sm">
          {windDir} {windKnots.toFixed(0)} kt
        </p>
        <div className="text-xs text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1">
            <span>🌡 {Math.round(current.temperature)}°C</span>
            <span>·</span>
            <span>{Math.round(current.pressure)} hPa</span>
            <PressureIcon trend={current.pressureTrend} />
          </div>
          {current.waveHeight !== null && (
            <p>🌊 {current.waveHeight.toFixed(1)}m</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-300 font-medium text-sm">Météo</h3>
        <span className="text-slate-500 text-xs">{getWeatherCodeLabel(current.weatherCode)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Vent */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
            <Wind size={12} />
            <span>Vent</span>
          </div>
          <p className="text-white font-bold text-xl leading-none">{windKnots.toFixed(0)} kn</p>
          <p className="text-slate-400 text-xs mt-1">{windDir} · Bf {beaufort}</p>
          {hasGusts && (
            <p className="text-orange-400 text-xs mt-0.5">Rafales {gustKnots.toFixed(0)} kn</p>
          )}
        </div>

        {/* Pression */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
            <Gauge size={12} />
            <span>Pression</span>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-white font-bold text-xl leading-none">{Math.round(current.pressure)}</p>
            <PressureIcon trend={current.pressureTrend} />
          </div>
          <p className="text-slate-400 text-xs mt-1">hPa</p>
        </div>

        {/* Précipitations */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
            <CloudRain size={12} />
            <span>Pluie</span>
          </div>
          <p className="text-white font-bold text-xl leading-none">{current.precipitationProbability}%</p>
          <p className="text-slate-400 text-xs mt-1">{current.precipitation.toFixed(1)} mm</p>
        </div>

        {/* Houle */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
            <Waves size={12} />
            <span>Houle</span>
          </div>
          {current.waveHeight !== null ? (
            <>
              <p className="text-white font-bold text-xl leading-none">
                {current.waveHeight.toFixed(1)} m
              </p>
              {current.swellHeight !== null && (
                <p className="text-slate-400 text-xs mt-1">Swell {current.swellHeight.toFixed(1)} m</p>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-base mt-1">N/D</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 border-t border-slate-700/50">
        <span>🌡 {Math.round(current.temperature)}°C (ressenti {Math.round(current.apparentTemperature)}°C)</span>
        <span>☁ {current.cloudCover}%</span>
      </div>
    </div>
  );
}
