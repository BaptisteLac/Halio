import { getCoefficientColor } from '@/lib/tides/coefficient';
import { getFishingScoreColor } from '@/lib/scoring/fishing-score';
import { kmhToKnots } from '@/lib/weather/weather-service';
import type { DayForecast } from '@/types';

interface Props {
  forecasts: DayForecast[];
}

const WEATHER_EMOJIS: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '⛈',
  71: '🌨', 73: '🌨', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
};

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function getWeatherEmoji(code: number): string {
  return WEATHER_EMOJIS[code] ?? '🌡';
}

function getDayLabel(date: Date, index: number): string {
  if (index === 0) return 'Auj';
  if (index === 1) return 'Dem';
  return DAY_NAMES[date.getDay()] ?? '---';
}

export default function WeekForecast({ forecasts }: Props) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-3">
      <h3 className="text-slate-300 font-medium text-sm">Prévisions 7 jours</h3>
      <div className="space-y-1">
        {forecasts.map(({ date, daily, coefficient, score }, i) => {
          const windKn = kmhToKnots(daily.windSpeedMax);
          const coeffColor = getCoefficientColor(coefficient);
          const scoreColor = getFishingScoreColor(score);
          const isToday = i === 0;

          return (
            <div
              key={date.toISOString()}
              className={`flex items-center gap-2 text-sm rounded-lg px-2 py-2 ${
                isToday ? 'bg-slate-700/50' : ''
              }`}
            >
              {/* Jour */}
              <span
                className={`w-8 shrink-0 font-medium ${
                  isToday ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                {getDayLabel(date, i)}
              </span>

              {/* Météo */}
              <span className="text-base w-6 shrink-0">{getWeatherEmoji(daily.weatherCode)}</span>

              {/* Températures */}
              <span className="text-slate-300 w-14 shrink-0 tabular-nums text-xs">
                {Math.round(daily.temperatureMax)}° / {Math.round(daily.temperatureMin)}°
              </span>

              {/* Vent */}
              <span className="text-slate-400 text-xs grow">
                💨 {windKn.toFixed(0)} kn
              </span>

              {/* Coefficient */}
              <span className={`font-bold tabular-nums w-7 text-right ${coeffColor}`}>{coefficient}</span>

              {/* Score pêche */}
              <span className={`font-bold tabular-nums w-8 text-right ${scoreColor}`}>{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
