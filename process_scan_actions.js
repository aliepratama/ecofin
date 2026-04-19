const fs = require('fs');

let content = fs.readFileSync('src/app/(auth)/scan/actions.ts', 'utf8');

content = content.replace("import { GoogleGenAI, Type } from '@google/genai';", "import type { Schema } from '@google-cloud/vertexai';\nimport { generativeModel } from '@/libs/ai/gemini-service';");

content = content.replace("const ai = new GoogleGenAI({});", "");

const oldGenContent = /const result = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m;

const newGenContent = `
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const scanSchema = {
    type: 'OBJECT',
    properties: {
      type: { type: 'STRING', enum: ['EXPENSE', 'INCOME'] },
      totalAmount: { type: 'NUMBER' },
      items: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            quantity: { type: 'NUMBER' },
            price: { type: 'NUMBER' },
            subtotal: { type: 'NUMBER' },
          },
          required: ['name', 'quantity', 'price', 'subtotal'],
        },
      },
    },
    required: ['type', 'totalAmount', 'items'],
  } as unknown as Schema;

  const result = await generativeModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: file.type || 'image/jpeg',
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: scanSchema,
    },
  });`;

content = content.replace(oldGenContent, newGenContent);

content = content.replace("const { text } = result;", "const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;");

fs.writeFileSync('src/app/(auth)/scan/actions.ts', content);
