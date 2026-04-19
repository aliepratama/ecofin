"use server";

import type { Schema } from "@google-cloud/vertexai";
import { generativeModel } from "@/libs/ai/gemini-service";
import { createClient } from "@/libs/supabase/server";

export async function getDashboardInsights() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      type,
      total_amount,
      date,
      transaction_details(
        quantity, subtotal, products(name)
      )
    `,
    )
    .limit(30)
    .order("date", { ascending: false });

  if (!transactions || transactions.length === 0) {
    return null;
  }

  const prompt = `Anda adalah analis ahli keuangan AI untuk UMKM F&B. Buat 1) prediksi laba (P&L forecast), 2) prediksi permintaan (demand forecast), dan 3) estimasi progress bulanan dalam persentase (1-100) menggunakan data transaksi terbaru ini. Gunakan bahasa Indonesia santai namun profesional bagi penjual. \nData transaksi: ${JSON.stringify(transactions.map((t) => ({ total: t.total_amount, tipe: t.type, tgl: t.date, item: t.transaction_details?.map((d) => (d.products as any)?.name).join(", ") })))}`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const dashboardSchema = {
    type: "OBJECT",
    properties: {
      plForecastText: {
        type: "STRING",
        description:
          'Teks singkat perkiraan P&L, contoh: "Berdasarkan penjualan minggu ini, laba bersih akhir bulan diproyeksi mencapai Rp 4.500.000. Anda di jalur aman."',
      },
      plForecastProgress: {
        type: "NUMBER",
        description: "Angka 1-100 merepresentasikan progress target bulanan.",
      },
      demandForecastText: {
        type: "STRING",
        description:
          'Teks singkat prediksi permintaan, contoh: "Berdasarkan histori transaksi, ayam geprek akhir minggu berpotensi laris. Tingkatkan stok 20%."',
      },
    },
    required: ["plForecastText", "plForecastProgress", "demandForecastText"],
  } as unknown as Schema;

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: dashboardSchema,
      },
    });

    const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return JSON.parse(rawText) as {
      plForecastText: string;
      plForecastProgress: number;
      demandForecastText: string;
    };
  } catch (error) {
    console.error("Failed to get dashboard insights:", error);
    return null;
  }
}
