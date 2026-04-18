"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

type Props = {
  score?: number;
  minMedium?: number;
  minHigh?: number;
  monthlyTrend?: Array<{ month: string; revenue: number; expense: number }>;
  showTrendOnly?: boolean;
};

export function TrustScoreDetailChart({
  score = 0,
  minMedium = 40,
  minHigh = 70,
  monthlyTrend = [],
  showTrendOnly = false,
}: Props) {
  if (showTrendOnly) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={monthlyTrend}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="month"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={80}
            tickFormatter={(val: number) =>
              val >= 1000000
                ? `Rp ${(val / 1000000).toFixed(0)} Jt`
                : val >= 1000
                  ? `Rp ${(val / 1000).toFixed(0)} K`
                  : `Rp ${val}`
            }
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            formatter={(value: any, name: any) => [
              formatCurrency(Number(value)),
              name,
            ]}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          <Bar
            dataKey="revenue"
            name="Omzet"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="expense"
            name="Pengeluaran"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Dial / Gauge Chart for Trust Score
  const remain = 100 - score;
  const data = [
    { name: "Score", value: score },
    { name: "Sisa", value: remain > 0 ? remain : 0 },
  ];

  let color = "#ef4444"; // red
  if (score >= minHigh)
    color = "#10b981"; // green
  else if (score >= minMedium) color = "#f59e0b"; // yellow

  return (
    <div className="relative flex items-center justify-center h-48 py-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            paddingAngle={0}
            stroke="none"
          >
            <Cell key="cell-0" fill={color} />
            <Cell key="cell-1" fill="#f1f5f9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-1 font-semibold">
          / 100
        </span>
      </div>
    </div>
  );
}
