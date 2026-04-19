import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { Env } from "../Env";

const getAuthOptions = () => {
  // Jika di Vercel (menggunakan string JSON dari env)
  if (Env.GCP_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(Env.GCP_SERVICE_ACCOUNT_JSON);
    return {
      vertexai: true,
      project: Env.VERTEX_PROJECT_ID,
      location: Env.VERTEX_LOCATION,
      googleAuthOptions: { credentials },
    };
  }

  // Jika di Local (menggunakan path fail)
  return {
    vertexai: true,
    project: Env.VERTEX_PROJECT_ID,
    location: Env.VERTEX_LOCATION,
  };
};

// Initialize the Google Gen AI client via Vertex AI
const ai = new GoogleGenAI(getAuthOptions());

// Define the schema for structured JSON output
const transactionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      description:
        "Tipe transaksi: 'INCOME' (pemasukan/penjualan) atau 'EXPENSE' (pengeluaran/belanja)",
      enum: ["INCOME", "EXPENSE"],
    },
    amount: {
      type: Type.NUMBER,
      description:
        "Nominal uang transaksi dalam angka mutlak (tanpa titik/koma/Rp). Misal: 15000",
    },
    description: {
      type: Type.STRING,
      description:
        "Ringkasan teks transaksi/nama barang yang dibeli atau dijual. Singkat dan jelas. Misal: Beli Telur 2kg",
    },
    items: {
      type: Type.ARRAY,
      description:
        "Daftar barang jika ada beberapa item. Jika tidak jelas, biarkan array kosong.",
      items: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          price: {
            type: Type.NUMBER,
            description:
              "Harga satuan untuk barang ini. Hitung berdasarkan total jika tidak disebutkan langsung.",
          },
          unit: {
            type: Type.STRING,
            description: "Satuan (misal: kg, pcs, liter)",
          },
        },
        required: ["itemName", "quantity", "price"],
      },
    },
  },
  required: ["type", "amount", "description"],
};

export type AIChatResponse = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  items?: {
    itemName: string;
    quantity: number;
    price: number;
    unit?: string;
  }[];
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

    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      },
    });

    if (result.text) {
      const jsonResponse = JSON.parse(result.text) as AIChatResponse;
      return jsonResponse;
    }

    return null;
  } catch (error) {
    console.error("Error parsing transaction via Gemini:", error);
    return null;
  }
}

export type ParsedMenu = {
  name: string;
  price: number;
};

const menuListSchema: Schema = {
  type: Type.ARRAY,
  description: "Daftar menu beserta harganya",
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "Nama menu makanan atau minuman",
      },
      price: {
        type: Type.NUMBER,
        description: "Harga menu tersebut (dalam Rupiah bulat)",
      },
    },
    required: ["name", "price"],
  },
};

export async function parseMenusFromImage(
  base64Image: string,
  mimeType: string,
): Promise<ParsedMenu[] | null> {
  try {
    const prompt =
      "Ekstrak daftar menu dan harga dari gambar ini. Kembalikan dalam format list nama dan harga. Jika tidak ada harga, asumsikan 0.";
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    // In @google/genai, inline data is passed in the contents array either as a string or part object
    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [prompt, imagePart],
      config: {
        responseMimeType: "application/json",
        responseSchema: menuListSchema,
      },
    });

    if (result.text) {
      return JSON.parse(result.text) as ParsedMenu[];
    }
    return null;
  } catch (error) {
    console.error("Error parsing menus from image:", error);
    return null;
  }
}
