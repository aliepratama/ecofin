'use server';

import type { Schema } from '@google-cloud/vertexai';
import { generativeModel } from '@/libs/ai/gemini-service';

export async function generateRecipeWithAI(
  menuName: string,
  availableIngredients: string[] = []
) {
  const ingredientsContext =
    availableIngredients.length > 0
      ? `\nBahan baku yang tersedia saat ini: ${availableIngredients.join(', ')}. Prioritaskan penggunaan bahan baku ini jika relevan.`
      : '';

  const prompt = `Anda adalah asisten koki cerdas. Sebutkan bahan baku standar (maksimal 5 bahan utama saja) dan takarannya untuk membuat 1 porsi menu: "${menuName}".${ingredientsContext}
  Kembalikan hanya bahan mentah/baku dasarnya.`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const recipeSchema = {
    type: 'OBJECT',
    properties: {
      ingredients: {
        type: 'ARRAY',
        description:
          'Daftar bahan baku yang paling masuk akal untuk menu ini beserta takaran standarnya per porsi',
        items: {
          type: 'OBJECT',
          properties: {
            name: {
              type: 'STRING',
              description:
                'Nama bahan baku, usahakan sama persis dengan yang ada di daftar bahan baku jika relevan.',
            },
            amount: {
              type: 'NUMBER',
              description: 'Jumlah takaran per 1 porsi/penjualan',
            },
            unit: {
              type: 'STRING',
              description: 'Satuan takaran, misal: gram, ml, pcs',
            },
          },
          required: ['name', 'amount', 'unit'],
        },
      },
    },
    required: ['ingredients'],
  } as unknown as Schema;

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: recipeSchema,
      },
    });

    const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return JSON.parse(rawText) as {
      ingredients: { name: string; amount: number; unit: string }[];
    };
  } catch (error) {
    console.error('Failed to generate recipe:', error);
    return null;
  }
}
