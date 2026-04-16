"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type DashboardChartsProps = {
  transactions: any[];
  trustScore: number;
};

export function DashboardCharts({
  transactions,
  trustScore,
}: Readonly<DashboardChartsProps>) {
  const [chartWidth, setChartWidth] = useState(320);

  useEffect(() => {
    const updateChartWidth = () => {
      const viewportWidth = globalThis.innerWidth || 360;
      const availableWidth = viewportWidth - 56;
      setChartWidth(Math.max(260, Math.min(availableWidth, 900)));
    };

    updateChartWidth();
    globalThis.addEventListener("resize", updateChartWidth);

    return () => {
      globalThis.removeEventListener("resize", updateChartWidth);
    };
  }, []);

  // Aggregate revenue and expenses by date (for the last 7 days roughly)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  });

  const dailyData = last7Days.map((label) => ({
    name: label,
    Pemasukan: 0,
    Pengeluaran: 0,
  }));

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t) => {
    const rawAmount = Number(t.totalAmount) || 0;
    const dt = new Date(t.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    if (t.type === "INCOME") totalIncome += rawAmount;
    if (t.type === "EXPENSE") totalExpense += rawAmount;

    const dayEntry = dailyData.find((d) => d.name === dt);
    if (dayEntry) {
      if (t.type === "INCOME") dayEntry.Pemasukan += rawAmount;
      if (t.type === "EXPENSE") dayEntry.Pengeluaran += rawAmount;
    }
  });

  const donutData = [
    { name: "Pemasukan", value: totalIncome, fill: "#003087" },
    { name: "Pengeluaran", value: totalExpense, fill: "#ef4444" },
  ];

  let trustBadgeClassName = "bg-red-500";
  let trustBadgeText = "Belum Siap";

  if (trustScore >= 80) {
    trustBadgeClassName = "bg-green-500";
    trustBadgeText = "Siap Pinjam";
  } else if (trustScore >= 50) {
    trustBadgeClassName = "bg-yellow-500";
    trustBadgeText = "Perlu Konsistensi";
  }

  const trustGaugeData = [
    { name: "Score", value: trustScore, fill: "#003087" },
    {
      name: "Remaining",
      value: Math.max(0, 100 - trustScore),
      fill: "#e5e5e5",
    },
  ];

  const gaugeChartWidth = Math.min(chartWidth, 560);
  const barChartWidth = Math.min(chartWidth, 860);
  const donutChartWidth = Math.min(chartWidth, 420);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Chart 1: Trust Score Gauge / Speedometer */}
      <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-2 text-center text-lg font-bold text-foreground">
          Trust Score (Kesiapan Finansial)
        </h3>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Semakin tinggi skor, semakin siap meminjam KUR
        </p>

        <div className="relative flex h-52 w-full min-w-0 items-center justify-center overflow-hidden">
          <PieChart width={gaugeChartWidth} height={208}>
            <Pie
              data={trustGaugeData}
              cx="50%"
              cy="70%"
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
              dataKey="value"
              stroke="none"
            />
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-16">
            <span className="text-4xl font-extrabold text-foreground">
              {trustScore}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              / 100
            </span>
            <span
              className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${trustBadgeClassName}`}
            >
              {trustBadgeText}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 2: Pemasukan Harian */}
      <div className="min-w-0 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-foreground">
          Arus Kas 7 Hari Terakhir
        </h3>
        <div className="flex h-64 w-full min-w-0 items-center justify-center overflow-x-auto">
          <BarChart width={barChartWidth} height={256} data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              dy={10}
            />
            <YAxis
              hide
              domain={[
                0,
                (dataMax: number) => (dataMax === 0 ? 100000 : dataMax * 1.2),
              ]}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) =>
                `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`
              }
            />
            <Bar
              dataKey="Pemasukan"
              fill="#003087"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="Pengeluaran"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </div>
      </div>

      {/* Chart 3: Proporsi (Donut Chart) */}
      <div className="min-w-0 rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-6 text-lg font-bold text-foreground">
          Proporsi Pemasukan vs Pengeluaran
        </h3>
        <div className="mx-auto flex h-64 w-full min-w-0 max-w-sm items-center justify-center overflow-hidden">
          <PieChart width={donutChartWidth} height={256}>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            />
            <Tooltip
              formatter={(value) =>
                `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`
              }
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
          </PieChart>
        </div>
      </div>
    </div>
  );
}
