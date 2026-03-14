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

interface Props {
  curve: TideCurvePoint[];
  extremes: TideExtreme[];
  now: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm shadow-lg">
      <p className="text-slate-400 text-xs">{payload[0]?.payload?.label}</p>
      <p className="text-cyan-400 font-bold">{Number(payload[0]?.value).toFixed(2)} m</p>
    </div>
  );
};

export default function TideCurve({ curve, extremes, now }: Props) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  // Extrêmes du jour uniquement
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
    <div className="h-44 w-full -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minH, maxH]}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={now.getTime()}
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <Area
            type="monotone"
            dataKey="height"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#tideGrad)"
            dot={false}
            activeDot={{ r: 3, fill: '#22d3ee', stroke: '#0f172a', strokeWidth: 2 }}
          />
          {todayExtremes.map((e, i) => (
            <ReferenceDot
              key={i}
              x={e.time.getTime()}
              y={mslToZH(e.height)}
              r={4}
              fill={e.type === 'high' ? '#22d3ee' : '#475569'}
              stroke="#0f172a"
              strokeWidth={2}
              label={{
                value: `${e.type === 'high' ? 'PM' : 'BM'} ${mslToZH(e.height).toFixed(2)}m`,
                position: e.type === 'high' ? 'insideTop' : 'insideBottom',
                fill: '#94a3b8',
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
