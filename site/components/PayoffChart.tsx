'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface PayoffPoint {
  spot: number;
  callPnl?: number;
  putPnl?: number;
}

interface Props {
  data: PayoffPoint[];
  strike?: number;
}

export function PayoffChart({ data, strike }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#26324a" strokeDasharray="3 3" />
          <XAxis
            dataKey="spot"
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
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'Value']}
          />
          {strike !== undefined && (
            <ReferenceLine x={strike} stroke="#f87171" strokeDasharray="4 4" />
          )}
          {data[0]?.callPnl !== undefined && (
            <Area
              type="monotone"
              dataKey="callPnl"
              stroke="#34d399"
              fill="#34d399"
              fillOpacity={0.18}
              name="Call P/L"
            />
          )}
          {data[0]?.putPnl !== undefined && (
            <Area
              type="monotone"
              dataKey="putPnl"
              stroke="#f87171"
              fill="#f87171"
              fillOpacity={0.18}
              name="Put P/L"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
