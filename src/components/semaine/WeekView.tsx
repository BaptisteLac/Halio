'use client';

import { useState } from 'react';
import type { WeekDay } from '@/types';
import { T, scoreColor } from '@/design/tokens';
import DayDetail from './DayDetail';
import InfoTooltip from '@/components/ui/InfoTooltip';

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

function barColor(score: number): string {
  if (score >= 70) return T.accent;
  if (score >= 55) return '#4ade80';
  if (score >= 40) return '#facc15';
  return T.l3;
}

export default function WeekView({ days, bestDayDate, todayDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div style={{
      background: T.l2,
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.t2, margin: 0 }}>Prévisions 7 jours</h3>
        <InfoTooltip content="Score 0–100 du meilleur créneau de la journée : chaque heure est évaluée avec la prévision météo (vent, pression), les marées simulées et le solunaire. Le score affiché est le pic — pas les conditions actuelles." />
      </div>

      {days.map((day) => {
        const isToday = day.date.toDateString() === todayDate.toDateString();
        const isBest = day.date.toDateString() === bestDayDate.toDateString();
        const isSelected = selectedDate?.toDateString() === day.date.toDateString();
        const color = scoreColor(day.score);
        const dayNum = day.date.getDay();
        const dayName = SHORT_DAYS[dayNum] ?? '---';
        const dayOfMonth = day.date.getDate();
        const barWidth = Math.round((day.score / 100) * 72);

        const rowBg = isBest
          ? 'rgba(74,222,128,.08)'
          : isToday
          ? 'rgba(34,211,238,.06)'
          : 'transparent';

        const rowBorder = isBest
          ? '1px solid rgba(74,222,128,.2)'
          : isToday
          ? `1px solid rgba(34,211,238,.15)`
          : '1px solid transparent';

        return (
          <div key={day.date.toISOString()}>
            <button
              type="button"
              onClick={() => setSelectedDate((prev) =>
                prev?.toDateString() === day.date.toDateString() ? null : day.date
              )}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 8px',
                borderRadius: 10,
                background: rowBg,
                border: rowBorder,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.12s ease',
              }}
            >
              {/* Jour */}
              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                <p style={{
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  color: isBest ? '#4ade80' : isToday ? T.accent : T.t4,
                  margin: 0,
                }}>
                  {isBest ? '★' : dayName}
                </p>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: isBest ? '#4ade80' : isToday ? T.accent : T.t2,
                  margin: 0,
                }}>
                  {dayOfMonth}
                </p>
              </div>

              {/* Barre + infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    height: 8,
                    borderRadius: 999,
                    background: barColor(day.score),
                    width: `${barWidth}px`,
                    flexShrink: 0,
                  }} />
                  {day.bestWindowStart && (
                    <span style={{ fontSize: '0.75rem', color: T.t3 }}>
                      {fmt(day.bestWindowStart)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: T.t3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Coeff {day.coefficient} · {day.windDir} {day.windKnots.toFixed(0)} kt
                  {day.isHighWind && <span style={{ color: T.warn }}> ⚠</span>}
                  {' · '}
                  {day.topSpeciesName}
                </p>
              </div>

              {/* Score */}
              <span style={{
                fontWeight: 700,
                fontSize: '1rem',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
                color,
              }}>
                {day.score}
              </span>
            </button>

            {/* Détail inline animé */}
            <div style={{
              display: 'grid',
              gridTemplateRows: isSelected ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.2s ease',
            }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ marginTop: 4, marginBottom: 8 }}>
                  <DayDetail day={day} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
