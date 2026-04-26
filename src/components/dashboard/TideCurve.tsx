'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import type { TideCurvePoint, TideExtreme } from '@/types';
import { mslToZH } from '@/lib/tides/tide-utils';
import { T } from '@/design/tokens';

interface Props {
  curve: TideCurvePoint[];
  extremes: TideExtreme[];
  now: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.l2,
      border: `1px solid ${T.border2}`,
      borderRadius: 10,
      padding: '6px 12px',
      fontSize: '0.875rem',
      boxShadow: '0 4px 16px rgba(0,0,0,.4)',
    }}>
      <p style={{ color: T.t3, fontSize: '0.75rem' }}>{payload[0]?.payload?.label}</p>
      <p style={{ color: T.accent, fontWeight: 700 }}>{Number(payload[0]?.value).toFixed(2)} m</p>
    </div>
  );
};

export default function TideCurve({ curve, extremes, now }: Props) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  const todayStr = now.toDateString();
  const todayExtremes = extremes.filter((e) => e.time.toDateString() === todayStr);

  const data = curve.map((p) => ({
    time: p.time.getTime(),
    height: mslToZH(p.height),
    label: p.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
  }));

  if (data.length === 0) return null;

  const heights = data.map((d) => d.height);
  const minH = Math.min(...heights) - 0.15;
  const maxH = Math.max(...heights) + 0.15;

  const xTicks = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
    const d = new Date(midnight);
    d.setHours(h);
    return d.getTime();
  });

  return (
    <div style={{ height: 176, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
          <defs>
            <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.accent} stopOpacity={0.22} />
              <stop offset="95%" stopColor={T.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.l3} vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={xTicks}
            tickFormatter={(t: number) =>
              new Date(t).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Paris',
              })
            }
            tick={{ fill: T.t4, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minH, maxH]}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: T.t4, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={now.getTime()}
            stroke={T.t3}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <Area
            type="monotone"
            dataKey="height"
            stroke={T.accent}
            strokeWidth={2}
            fill="url(#tideGrad)"
            dot={false}
            activeDot={{ r: 4, fill: T.accent, stroke: T.page, strokeWidth: 2 }}
          />
          {todayExtremes.map((e, i) => (
            <ReferenceDot
              key={i}
              x={e.time.getTime()}
              y={mslToZH(e.height)}
              r={4}
              fill={e.type === 'high' ? T.accent : T.t3}
              stroke={T.page}
              strokeWidth={2}
              label={{
                value: `${e.type === 'high' ? 'PM' : 'BM'} ${mslToZH(e.height).toFixed(2)}m`,
                position: e.type === 'high' ? 'insideTop' : 'insideBottom',
                fill: T.t3,
                fontSize: 9,
                dy: e.type === 'high' ? -10 : 12,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
