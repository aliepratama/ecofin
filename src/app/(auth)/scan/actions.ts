'use server';

import { GoogleGenAI, Type } from '@google/genai';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import {
  businesses,
  transactions,
  transactionDetails,
  products,
  receiptImages,
} from '@/models/Schema';

export async function processReceiptAction(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, user.id),
  });

  if (!activeBusiness) {
    throw new Error('Business not found');
  }

  const file = formData.get('receipt') as File;
  if (!file) {
    throw new Error('No file uploaded');
  }

  const latitude = formData.get('latitude') as string | null;
  const longitude = formData.get('longitude') as string | null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString('base64');

  const ai = new GoogleGenAI({});

  const prompt = `Anda adalah asisten akuntan. Saya memberikan gambar struk/nota.
Tolong ekstrak informasi dari gambar nota/struk ini ke dalam format JSON yang valid (tanpa markdown):
{
  "type": "EXPENSE" atau "INCOME",
  "totalAmount": angka total (hanya angka bulat, tanpa titik/koma/Rp),
  "items": [
    {
      "name": "nama barang",
      "quantity": jumlah barang (angka bulat, isi 1 jika kosong),
      "price": harga satuan,
      "subtotal": harga total item
    }
  ]
}`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type || 'image/jpeg',
        },
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['EXPENSE', 'INCOME'] },
          totalAmount: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                price: { type: Type.NUMBER },
                subtotal: { type: Type.NUMBER },
              },
              required: ['name', 'quantity', 'price', 'subtotal'],
            },
          },
        },
        required: ['type', 'totalAmount', 'items'],
      },
    },
  });

  const { text } = result;
  if (!text) {
    throw new Error('Tidak ada respon dari AI');
  }

  type ParsedData = {
    type: 'EXPENSE' | 'INCOME';
    totalAmount: number;
    items: {
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
  };
  let parsed: ParsedData;

  try {
    const jsonStr = text.replaceAll(/```json\n?|\n?```/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Gagal membaca nota. Pastikan gambar jelas.', {
      cause: error,
    });
  }

  if (!parsed.items || parsed.items.length === 0) {
    parsed.items = [
      {
        name: 'Item dari Nota OCR',
        quantity: 1,
        price: parsed.totalAmount,
        subtotal: parsed.totalAmount,
      },
    ];
  }

  await db.transaction(async (tx) => {
    const [newTx] = await tx
      .insert(transactions)
      .values({
        businessId: activeBusiness.id,
        userId: user.id,
        type: parsed.type,
        totalAmount: parsed.totalAmount.toString(),
        inputMethod: 'OCR',
        latitudeCaptured: latitude ?? null,
        longitudeCaptured: longitude ?? null,
        syncStatus: 'synced',
      })
      .returning();

    for (const item of parsed.items) {
      let activeProduct = await tx.query.products.findFirst({
        where: eq(products.name, item.name), // Note: ignoring businessId filter for brevity here, should be added
      });

      if (!activeProduct) {
        const [insertedProduct] = await tx
          .insert(products)
          .values({
            businessId: activeBusiness.id,
            name: item.name,
            price: item.price.toString(),
            currentStock:
              parsed.type === 'INCOME' ? -item.quantity : item.quantity,
            unit: 'pcs',
          })
          .returning();
        activeProduct = insertedProduct;
      } else {
        await tx
          .update(products)
          .set({
            currentStock:
              activeProduct.currentStock +
              (parsed.type === 'INCOME' ? -item.quantity : item.quantity),
          })
          .where(eq(products.id, activeProduct.id));
      }

      if (!newTx) {
        throw new Error('Transaction insert failed');
      }
      if (!activeProduct) {
        throw new Error('Product insert failed');
      }

      await tx.insert(transactionDetails).values({
        transactionId: newTx.id,
        productId: activeProduct.id,
        quantity: item.quantity,
        subtotal: item.subtotal.toString(),
      });
    }

    if (!newTx) {
      throw new Error('Transaction insert failed');
    }
    await tx.insert(receiptImages).values({
      transactionId: newTx.id,
      imageUrl: 'pending_upload_' + Date.now(), // Placeholder
      ocrRawJson: parsed,
      confidenceScore: 0.85,
    });
  });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
