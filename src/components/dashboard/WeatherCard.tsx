import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  getWindDirectionLabel,
  kmhToKnots,
  getBeaufortScale,
  getWeatherCodeLabel,
} from '@/lib/weather/weather-service';
import type { WeatherData } from '@/types';
import { T } from '@/design/tokens';
import { IWind, IGauge, ICloudRain, IWaves } from '@/design/icons';

interface Props {
  weather: WeatherData;
  compact?: boolean;
  onClick?: () => void;
}

function PressureIcon({ trend }: { trend: 'hausse' | 'stable' | 'baisse' }) {
  if (trend === 'hausse') return <TrendingUp size={13} color="#fb923c" />;
  if (trend === 'baisse') return <TrendingDown size={13} color="#4ade80" />;
  return <Minus size={13} color={T.t4} />;
}

export default function WeatherCard({ weather, compact = false, onClick }: Props) {
  const { current } = weather;
  const windKnots = kmhToKnots(current.windSpeed);
  const gustKnots = kmhToKnots(current.windGusts);
  const beaufort = getBeaufortScale(current.windSpeed);
  const windDir = getWindDirectionLabel(current.windDirection);
  const hasGusts = current.windGusts > current.windSpeed * 1.3;

  if (compact) {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? 'Afficher la météo complète' : undefined}
        style={{
          background: T.l2,
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'opacity 0.12s ease',
        }}
        className={onClick ? 'active:opacity-70' : ''}
      >
        <h3 style={{ fontSize: '0.75rem', fontWeight: 500, color: T.t3, margin: 0 }}>Météo</h3>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: T.t1, margin: 0 }}>
          {windDir} {windKnots.toFixed(0)} kt
        </p>
        <div style={{ fontSize: '0.75rem', color: T.t3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{Math.round(current.temperature)}°C</span>
            <span>·</span>
            <span>{Math.round(current.pressure)} hPa</span>
            <PressureIcon trend={current.pressureTrend} />
          </div>
          {current.waveHeight !== null && (
            <p style={{ margin: 0 }}>{current.waveHeight.toFixed(1)}m houle</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: T.l2,
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t2, margin: 0 }}>Météo</h3>
        <span style={{ fontSize: '0.75rem', color: T.t3 }}>{getWeatherCodeLabel(current.weatherCode)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Vent */}
        <div style={{
          background: T.l3,
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: T.t3, marginBottom: 6 }}>
            <IWind size={12} color={T.t3} />
            <span>Vent</span>
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: 0, lineHeight: 1 }}>{windKnots.toFixed(0)} kn</p>
          <p style={{ fontSize: '0.75rem', color: T.t3, marginTop: 4 }}>{windDir} · Bf {beaufort}</p>
          {hasGusts && (
            <p style={{ fontSize: '0.75rem', color: T.warn, marginTop: 2, margin: 0 }}>Rafales {gustKnots.toFixed(0)} kn</p>
          )}
        </div>

        {/* Pression */}
        <div style={{
          background: T.l3,
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: T.t3, marginBottom: 6 }}>
            <IGauge size={12} color={T.t3} />
            <span>Pression</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: 0, lineHeight: 1 }}>{Math.round(current.pressure)}</p>
            <PressureIcon trend={current.pressureTrend} />
          </div>
          <p style={{ fontSize: '0.75rem', color: T.t3, marginTop: 4 }}>hPa</p>
        </div>

        {/* Précipitations */}
        <div style={{
          background: T.l3,
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: T.t3, marginBottom: 6 }}>
            <ICloudRain size={12} color={T.t3} />
            <span>Pluie</span>
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: 0, lineHeight: 1 }}>{current.precipitationProbability}%</p>
          <p style={{ fontSize: '0.75rem', color: T.t3, marginTop: 4 }}>{current.precipitation.toFixed(1)} mm</p>
        </div>

        {/* Houle */}
        <div style={{
          background: T.l3,
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: T.t3, marginBottom: 6 }}>
            <IWaves size={12} color={T.t3} />
            <span>Houle</span>
          </div>
          {current.waveHeight !== null ? (
            <>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: T.t1, margin: 0, lineHeight: 1 }}>
                {current.waveHeight.toFixed(1)} m
              </p>
              {current.swellHeight !== null && (
                <p style={{ fontSize: '0.75rem', color: T.t3, marginTop: 4 }}>Swell {current.swellHeight.toFixed(1)} m</p>
              )}
            </>
          ) : (
            <p style={{ fontSize: '1rem', color: T.t3, marginTop: 4 }}>N/D</p>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: T.t3,
        paddingTop: 4,
        borderTop: `1px solid ${T.border}`,
      }}>
        <span>{Math.round(current.temperature)}°C (ressenti {Math.round(current.apparentTemperature)}°C)</span>
        <span>{current.cloudCover}% nuages</span>
      </div>
    </div>
  );
}
