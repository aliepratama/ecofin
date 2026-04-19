import path from 'node:path';
import { VertexAI } from '@google-cloud/vertexai';
import type { Schema } from '@google-cloud/vertexai';
import { Env } from '../Env';

const isDev = Env.NODE_ENV === 'development' || !Env.NODE_ENV;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authOptions: any = {};

if (isDev) {
  authOptions = {
    keyFilename: path.join(process.cwd(), 'gcp-service-account.json'),
  };
} else if (Env.GCP_SERVICE_ACCOUNT_JSON) {
  // Parsing the JSON string from the environment variable
  authOptions = {
    credentials: JSON.parse(Env.GCP_SERVICE_ACCOUNT_JSON),
  };
}

const vertexAI = new VertexAI({
  project: Env.VERTEX_PROJECT_ID,
  location: Env.VERTEX_LOCATION,
  googleAuthOptions: authOptions,
});

export const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
});

export type ChatItem = {
  itemName: string;
  price?: number;
  quantity: number;
  unit?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const transactionSchema = {
  type: 'OBJECT',
  properties: {
    type: { type: 'STRING', enum: ['INCOME', 'EXPENSE'] },
    amount: { type: 'NUMBER' },
    description: { type: 'STRING' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          itemName: { type: 'STRING' },
          price: { type: 'NUMBER' },
          quantity: { type: 'NUMBER' },
          unit: { type: 'STRING' },
        },
        required: ['itemName', 'quantity'],
      },
    },
  },
  required: ['type', 'amount', 'description'],
} as unknown as Schema;

export type AIChatResponse = {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  items?: ChatItem[];
};

export async function parseTransactionFromText(
  text: string
): Promise<AIChatResponse | null> {
  try {
    const prompt = `Anda adalah asisten keuangan AI untuk UMKM F&B. Ubah teks input menuju format JSON sesuai schema. Input: ${text}`;
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: transactionSchema,
      },
    });
    const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const parsed: unknown = JSON.parse(rawText);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return parsed as AIChatResponse;
    }
    return null;
  } catch {
    return null;
  }
}

export type ParsedMenu = { name: string; price: number };

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const menuListSchema = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      name: { type: 'STRING' },
      price: { type: 'NUMBER' },
    },
    required: ['name', 'price'],
  },
} as unknown as Schema;

export async function parseMenusFromImage(
  base64Image: string,
  mimeType: string
): Promise<ParsedMenu[] | null> {
  try {
    const p = 'Ekstrak daftar menu dan harga dari gambar ini.';
    const img = { inlineData: { data: base64Image, mimeType } };
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: p }, img] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: menuListSchema,
      },
    });
    const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const parsed: unknown = JSON.parse(rawText);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return parsed as ParsedMenu[];
    }
    return null;
  } catch {
    return null;
  }
}
