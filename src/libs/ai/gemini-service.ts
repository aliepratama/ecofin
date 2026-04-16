import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";
import { Env } from "@/libs/Env";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(Env.GEMINI_API_KEY ?? "");

// Define the schema for structured JSON output
const transactionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    type: {
      type: SchemaType.STRING,
      description:
        "Tipe transaksi: 'INCOME' (pemasukan/penjualan) atau 'EXPENSE' (pengeluaran/belanja)",
      enum: ["INCOME", "EXPENSE"],
      format: "enum",
    },
    amount: {
      type: SchemaType.NUMBER,
      description:
        "Nominal uang transaksi dalam angka mutlak (tanpa titik/koma/Rp). Misal: 15000",
    },
    description: {
      type: SchemaType.STRING,
      description:
        "Ringkasan teks transaksi/nama barang yang dibeli atau dijual. Singkat dan jelas. Misal: Beli Telur 2kg",
    },
    items: {
      type: SchemaType.ARRAY,
      description:
        "Daftar barang jika ada beberapa item. Jika tidak jelas, biarkan array kosong.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          itemName: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER },
          unit: {
            type: SchemaType.STRING,
            description: "Satuan (misal: kg, pcs, liter)",
          },
        },
        required: ["itemName", "quantity"],
      },
    },
  },
  required: ["type", "amount", "description"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: transactionSchema,
  },
});

export type AIChatResponse = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  items?: { itemName: string; quantity: number; unit?: string }[];
};

/**
 * Memproses teks input natural menjadi format transaksi terstruktur.
 * @param text input teks bebas dari pengguna
 * @returns objek JSON transaksi
 */
export async function parseTransactionFromText(
  text: string,
): Promise<AIChatResponse | null> {
  try {
    const prompt = `Anda adalah asisten keuangan AI untuk UMKM F&B.
    Ubah teks input pengguna berikut menjadi data transaksi terstruktur.
    Jika ada singkatan nominal, jabarkan (misal: "50rb" = 50000).
    Jika beli bahan baku, berarti pengeluaran (expense). Jika jual atau ada pemasukan, berarti income.
    
    Input pengguna: "${text}"`;

    const result = await model.generateContent(prompt);

    if (result.response && result.response.text()) {
      const jsonResponse = JSON.parse(result.response.text()) as AIChatResponse;
      return jsonResponse;
    }

    return null;
  } catch (error) {
    console.error("Error parsing transaction via Gemini:", error);
    return null;
  }
}
