"use server";

import { Env } from "@/libs/Env";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function generateRecipeWithAI(menuName: string) {
  const genAI = new GoogleGenerativeAI(
    Env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
  );
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          ingredients: {
            type: SchemaType.ARRAY,
            description:
              "Daftar bahan baku yang paling masuk akal untuk menu ini beserta takaran standarnya per porsi",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: {
                  type: SchemaType.STRING,
                  description:
                    "Nama bahan baku, misal: Beras, Ayam, Minyak Goreng",
                },
                amount: {
                  type: SchemaType.NUMBER,
                  description: "Jumlah takaran per 1 porsi/penjualan",
                },
                unit: {
                  type: SchemaType.STRING,
                  description: "Satuan takaran, misal: gram, ml, pcs",
                },
              },
              required: ["name", "amount", "unit"],
            },
          },
        },
        required: ["ingredients"],
      },
    },
  });

  const prompt = `Anda adalah asisten koki cerdas. Sebutkan bahan baku standar (maksimal 5 bahan utama saja) dan takarannya untuk membuat 1 porsi menu: "${menuName}".
  Kembalikan hanya bahan mentah/baku dasarnya.`;

  try {
    const result = await model.generateContent(prompt);
    if (!result.response || !result.response.text()) return null;
    return JSON.parse(result.response.text()) as {
      ingredients: { name: string; amount: number; unit: string }[];
    };
  } catch (error) {
    console.error("Failed to generate recipe:", error);
    return null;
  }
}
