'use server';

import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@/libs/supabase/server';

export async function getDashboardInsights() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select(
      `
      type,
      total_amount,
      date,
      transaction_details(
        quantity, subtotal, products(name)
      )
    `
    )
    .limit(30)
    .order('date', { ascending: false });

  if (!transactions || transactions.length === 0) {
    return null;
  }

  const ai = new GoogleGenAI({});

  const prompt = `Anda adalah analis ahli keuangan AI untuk UMKM F&B. Buat 1) prediksi laba (P&L forecast), 2) prediksi permintaan (demand forecast), dan 3) estimasi progress bulanan dalam persentase (1-100) menggunakan data transaksi terbaru ini. Gunakan bahasa Indonesia santai namun profesional bagi penjual. \nData transaksi: ${JSON.stringify(transactions.map((t) => ({ total: t.total_amount, tipe: t.type, tgl: t.date, item: t.transaction_details?.map((d) => (d.products as any)?.name).join(', ') })))}`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plForecastText: {
              type: Type.STRING,
              description:
                'Teks singkat perkiraan P&L, contoh: "Berdasarkan penjualan minggu ini, laba bersih akhir bulan diproyeksi mencapai Rp 4.500.000. Anda di jalur aman."',
            },
            plForecastProgress: {
              type: Type.NUMBER,
              description:
                'Angka 1-100 merepresentasikan progress target bulanan.',
            },
            demandForecastText: {
              type: Type.STRING,
              description:
                'Teks singkat prediksi permintaan, contoh: "Berdasarkan histori transaksi, ayam geprek akhir minggu berpotensi laris. Tingkatkan stok 20%."',
            },
          },
          required: [
            'plForecastText',
            'plForecastProgress',
            'demandForecastText',
          ],
        },
      },
    });

    if (!result.text) {
      return null;
    }
    return JSON.parse(result.text) as {
      plForecastText: string;
      plForecastProgress: number;
      demandForecastText: string;
    };
  } catch (error) {
    console.error('Failed to get dashboard insights:', error);
    return null;
  }
}
