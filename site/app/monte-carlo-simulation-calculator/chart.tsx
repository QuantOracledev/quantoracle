'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Spaghetti chart for Monte Carlo simulation paths. Each path is a polyline;
 * we render up to 5 from the API for visual variety. The terminal-value
 * percentiles are overlaid as horizontal reference lines so the user sees
 * the band of outcomes at year-T.
 */

interface Path {
  values: number[];
}

interface Props {
  paths: number[][];
  yearsHorizon: number;
  initialValue: number;
  terminal: {
    p5: number;
    p25: number;
    median: number;
    p75: number;
    p95: number;
  };
}

const PATH_COLORS = ['#5eead4', '#34d399', '#a78bfa', '#fb923c', '#f472b6'];

export function MonteCarloChart({ paths, yearsHorizon, initialValue, terminal }: Props) {
  // Each sample path may have a different length; use the longest as the time axis.
  const longest = paths.reduce((m, p) => Math.max(m, p.length), 0);
  if (longest === 0) return null;

  // Build a wide-format dataset where each point is { t: <years>, p0: ..., p1: ..., p2: ... }.
  const data: Record<string, number>[] = [];
  for (let i = 0; i < longest; i++) {
    const row: Record<string, number> = {
      t: (i / (longest - 1)) * yearsHorizon,
    };
    for (let j = 0; j < paths.length; j++) {
      const v = paths[j][i];
      if (v !== undefined) row[`p${j}`] = v;
    }
    data.push(row);
  }

  const fmt = (v: number) =>
    `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
          <CartesianGrid stroke="#26324a" strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v.toFixed(0)}y`}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f1420',
              border: '1px solid #26324a',
              borderRadius: 6,
              fontSize: 12,
            }}
            labelFormatter={(l) => `Year ${Number(l).toFixed(2)}`}
            formatter={(v: number, key: string) => [fmt(v), key.replace('p', 'Path #')]}
          />

          {/* Reference lines for percentiles at the terminal */}
          <ReferenceLine
            y={initialValue}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{
              value: 'starting',
              position: 'right',
              fill: '#94a3b8',
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={terminal.median}
            stroke="#5eead4"
            strokeDasharray="6 4"
            label={{
              value: `median ${fmt(terminal.median)}`,
              position: 'right',
              fill: '#5eead4',
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={terminal.p5}
            stroke="#f87171"
            strokeDasharray="2 4"
            label={{
              value: `5th %ile`,
              position: 'right',
              fill: '#f87171',
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={terminal.p95}
            stroke="#34d399"
            strokeDasharray="2 4"
            label={{
              value: `95th %ile`,
              position: 'right',
              fill: '#34d399',
              fontSize: 10,
            }}
          />

          {/* Each sample path as a thin colored polyline */}
          {paths.map((_, j) => (
            <Line
              key={j}
              type="monotone"
              dataKey={`p${j}`}
              stroke={PATH_COLORS[j % PATH_COLORS.length]}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              opacity={0.7}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
