'use client';

import { useState } from 'react';
import type { WeekDay } from '@/types';
import { getFishingScoreColor } from '@/lib/scoring/fishing-score';
import DayDetail from './DayDetail';

interface Props {
  days: WeekDay[];
  bestDayDate: Date;
  todayDate: Date;
}

function fmt(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

const SHORT_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function WeekView({ days, bestDayDate, todayDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 space-y-1">
      <h3 className="text-slate-300 font-medium text-sm mb-3">Prévisions 7 jours</h3>

      {days.map((day) => {
        const isToday = day.date.toDateString() === todayDate.toDateString();
        const isBest = day.date.toDateString() === bestDayDate.toDateString();
        const isSelected = selectedDate?.toDateString() === day.date.toDateString();
        const scoreColor = getFishingScoreColor(day.score);
        const dayNum = day.date.getDay();
        const dayName = SHORT_DAYS[dayNum] ?? '---';
        const dayOfMonth = day.date.getDate();

        // Largeur de la barre de fenêtre proportionnelle au score (max ~80px)
        const barWidth = Math.round((day.score / 100) * 72);

        return (
          <div key={day.date.toISOString()}>
            <button
              type="button"
              onClick={() => setSelectedDate((prev) =>
                prev?.toDateString() === day.date.toDateString() ? null : day.date
              )}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors text-left ${
                isBest
                  ? 'bg-green-950/50 border border-green-800/40'
                  : isToday
                  ? 'bg-slate-700/30 border border-cyan-800/30'
                  : 'hover:bg-slate-700/20 border border-transparent'
              }`}
            >
              {/* Jour */}
              <div className="w-9 text-center shrink-0">
                <p className={`text-[10px] uppercase ${isBest ? 'text-green-400' : isToday ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {isBest ? '⭐' : dayName}
                </p>
                <p className={`text-base font-bold leading-tight ${isBest ? 'text-green-300' : isToday ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {dayOfMonth}
                </p>
              </div>

              {/* Barre + fenêtre */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div
                    className={`h-2 rounded-full ${day.score >= 70 ? 'bg-cyan-500' : day.score >= 55 ? 'bg-green-500/80' : day.score >= 40 ? 'bg-yellow-500/60' : 'bg-slate-600/40'}`}
                    style={{ width: `${barWidth}px` }}
                  />
                  {day.bestWindowStart && (
                    <span className="text-[10px] text-slate-400">
                      {fmt(day.bestWindowStart)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Coeff {day.coefficient} · {day.windDir} {day.windKnots.toFixed(0)} kt
                  {day.isHighWind && ' ⚠️'}
                  {' · '}
                  {day.topSpeciesName}
                </p>
              </div>

              {/* Score */}
              <span className={`font-bold text-base tabular-nums shrink-0 ${scoreColor}`}>
                {day.score}
              </span>
            </button>

            {/* Détail inline */}
            {isSelected && (
              <div className="mt-1 mb-2">
                <DayDetail day={day} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
