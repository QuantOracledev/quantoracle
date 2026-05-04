'use client';

import {
  Area,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Point {
  price: number;
  pnl: number;
}

export function OptionsProfitChart({ data, spot }: { data: Point[]; spot: number }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#26324a" strokeDasharray="3 3" />
          <XAxis
            dataKey="price"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f1420',
              border: '1px solid #26324a',
              borderRadius: 6,
              fontSize: 12,
            }}
            labelFormatter={(l) => `Spot: $${Number(l).toFixed(2)}`}
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'P/L']}
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
          <ReferenceLine
            x={spot}
            stroke="#5eead4"
            strokeDasharray="4 4"
            label={{ value: 'spot', position: 'top', fill: '#5eead4', fontSize: 10 }}
          />
          <Area
            type="linear"
            dataKey="pnl"
            stroke="#34d399"
            fill="#34d399"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
