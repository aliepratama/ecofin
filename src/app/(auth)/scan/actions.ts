"use server";

import type { Schema } from "@google-cloud/vertexai";
import { generativeModel } from "@/libs/ai/gemini-service";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/libs/DB";
import { createClient } from "@/libs/supabase/server";
import {
  businesses,
  transactions,
  transactionDetails,
  products,
  receiptImages,
} from "@/models/Schema";

export type ParsedReceiptData = {
  type: "EXPENSE" | "INCOME";
  totalAmount: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    unit?: string;
    subtotal: number;
  }[];
};

export async function extractReceiptAction(
  formData: FormData,
): Promise<ParsedReceiptData> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, user.id),
  });

  if (!activeBusiness) {
    throw new Error("Business not found");
  }

  const file = formData.get("receipt") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString("base64");

  const listProducts = await db.query.products.findMany({
    where: eq(products.businessId, activeBusiness.id),
  });
  const bahanBakuList = listProducts
    .filter((p) => p.type === "BAHAN_BAKU" || p.name.includes("[Bahan Baku]"))
    .map((b) => b.name.replace("[Bahan Baku] ", ""));
  const bahanBakuStr =
    bahanBakuList.length > 0 ? bahanBakuList.join(", ") : "Kosong";

  const prompt = `Anda adalah asisten gudang. Saya memberikan gambar struk/nota belanja bahan baku (pengeluaran).

Penting: Kami memiliki daftar bahan baku di sistem sebagai berikut:
[${bahanBakuStr}]

Tolong ekstrak informasi dari nota. Jika nama barang di nota tersebut artinya sama, mirip, atau merupakan singkatan dari salah satu bahan di sistem (contoh: "C. Rawit" / "Cabai Rawit" -> "Cabe Rawit"), Anda WAJIB MENGGUNAKAN nama persis yang ada di daftar sistem tersebut. Jika benar-benar baru, gunakan teks asli nota.

Ekstrak ke format JSON yang valid (tanpa markdown):
{
  "totalAmount": angka total (hanya angka bulat, tanpa titik/koma/Rp),
  "items": [
    {
      "name": "nama bahan baku",
      "quantity": jumlah bahan (angka bulat, isi 1 jika kosong),
      "unit": "satuan barang (misal: Kg, Liter, Pcs, Ikat, Bal) jika ada. Jika tidak ada, kembalikan string kosong",
      "price": harga satuan,
      "subtotal": harga total item
    }
  ]
}`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const scanSchema = {
    type: "OBJECT",
    properties: {
      totalAmount: { type: "NUMBER" },
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            quantity: { type: "NUMBER" },
            unit: { type: "STRING" },
            price: { type: "NUMBER" },
            subtotal: { type: "NUMBER" },
          },
          required: ["name", "quantity", "unit", "price", "subtotal"],
        },
      },
    },
    required: ["totalAmount", "items"],
  } as unknown as Schema;

  const result = await generativeModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: file.type || "image/jpeg",
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: scanSchema,
    },
  });

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Tidak ada respon dari AI");
  }

  let parsed: ParsedReceiptData;

  try {
    const jsonStr = text.replaceAll(/```json\n?|\n?```/g, "").trim();
    const rawParsed = JSON.parse(jsonStr);
    parsed = {
      ...rawParsed,
      type: "EXPENSE",
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Gagal membaca nota. Pastikan gambar jelas.", {
      cause: error,
    });
  }

  if (!parsed.items || parsed.items.length === 0) {
    parsed.items = [
      {
        name: "Item dari Nota OCR",
        quantity: 1,
        price: parsed.totalAmount,
        subtotal: parsed.totalAmount,
        unit: "Pcs",
      },
    ];
  } else {
    parsed.items = parsed.items.map((it) => ({
      ...it,
      quantity: Math.max(1, Math.round(it.quantity || 1)),
      unit: it.unit || "Pcs",
    }));
  }

  return parsed;
}

export async function processReceiptAction(
  parsed: ParsedReceiptData,
  latitude: string | null,
  longitude: string | null,
) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, user.id),
  });

  if (!activeBusiness) {
    throw new Error("Business not found");
  }

  await db.transaction(async (tx) => {
    const [newTx] = await tx
      .insert(transactions)
      .values({
        businessId: activeBusiness.id,
        userId: user.id,
        type: parsed.type,
        totalAmount: parsed.totalAmount.toString(),
        inputMethod: "OCR",
        latitudeCaptured: latitude ?? null,
        longitudeCaptured: longitude ?? null,
        syncStatus: "synced",
      })
      .returning();

    for (const item of parsed.items) {
      const finalName = item.name.includes("[Bahan Baku]")
        ? item.name
        : `[Bahan Baku] ${item.name}`;

      let activeProduct = await tx.query.products.findFirst({
        where: and(
          eq(products.name, finalName),
          eq(products.businessId, activeBusiness.id),
        ),
      });

      if (!activeProduct) {
        const [insertedProduct] = await tx
          .insert(products)
          .values({
            businessId: activeBusiness.id,
            name: finalName,
            price: item.price.toString(),
            currentStock: item.quantity,
            unit: item.unit || "Kg/Liter",
            type: "BAHAN_BAKU",
          })
          .returning();
        activeProduct = insertedProduct;
      } else {
        await tx
          .update(products)
          .set({
            currentStock: activeProduct.currentStock + item.quantity,
          })
          .where(eq(products.id, activeProduct.id));
      }

      if (!newTx) {
        throw new Error("Transaction insert failed");
      }
      if (!activeProduct) {
        throw new Error("Product insert failed");
      }

      await tx.insert(transactionDetails).values({
        transactionId: newTx.id,
        productId: activeProduct.id,
        quantity: item.quantity,
        subtotal: item.subtotal.toString(),
      });
    }

    if (!newTx) {
      throw new Error("Transaction insert failed");
    }
    await tx.insert(receiptImages).values({
      transactionId: newTx.id,
      imageUrl: "pending_upload_" + Date.now(), // Placeholder
      ocrRawJson: parsed,
      confidenceScore: 0.85,
    });
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
