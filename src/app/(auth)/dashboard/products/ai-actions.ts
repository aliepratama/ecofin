"use server";

import { GoogleGenAI, Type } from "@google/genai";

export async function generateRecipeWithAI(
  menuName: string,
  availableIngredients: string[] = [],
) {
  const ai = new GoogleGenAI({});

  const ingredientsContext =
    availableIngredients.length > 0
      ? `\nBahan baku yang tersedia saat ini: ${availableIngredients.join(", ")}. Prioritaskan penggunaan bahan baku ini jika relevan.`
      : "";

  const prompt = `Anda adalah asisten koki cerdas. Sebutkan bahan baku standar (maksimal 5 bahan utama saja) dan takarannya untuk membuat 1 porsi menu: "${menuName}".${ingredientsContext}
  Kembalikan hanya bahan mentah/baku dasarnya.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              description:
                "Daftar bahan baku yang paling masuk akal untuk menu ini beserta takaran standarnya per porsi",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description:
                      "Nama bahan baku, usahakan sama persis dengan yang ada di daftar bahan baku jika relevan.",
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: "Jumlah takaran per 1 porsi/penjualan",
                  },
                  unit: {
                    type: Type.STRING,
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

    if (!result.text) return null;
    return JSON.parse(result.text) as {
      ingredients: { name: string; amount: number; unit: string }[];
    };
  } catch (error) {
    console.error("Failed to generate recipe:", error);
    return null;
  }
}
