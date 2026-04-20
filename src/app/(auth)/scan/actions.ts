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
    category: "BAHAN_BAKU" | "OPERASIONAL";
    name: string;
    rawName?: string;
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

  const operasionalList = listProducts
    .filter((p) => p.type === "OPERASIONAL")
    .map((b) => b.name);
  const operasionalStr =
    operasionalList.length > 0
      ? operasionalList.join(", ")
      : "Sewa, Listrik, Gas, Transportasi, Air, Internet, Lainnya";

  const prompt = `Anda adalah asisten keuangan pintar. Saya memberikan gambar struk/nota/kuitansi pengeluaran.
Pengeluaran bisa terdiri dari 2 kategori:
1. BAHAN_BAKU (terkait erat dengan masakan/bumbu/daging/sayur/kemasan).
2. OPERASIONAL (tagihan, sewa, listrik, gas, gaji, transportasi, dsb).

Penting: Kami memiliki daftar item di sistem sebagai berikut:
Daftar Bahan Baku: [${bahanBakuStr}]
Daftar Operasional: [${operasionalStr}]

Tolong ekstrak informasi dari nota.
Aturan Penamaan:
- Jika nama barang di nota tersebut artinya sama atau mirip dengan bahan baku tercatat (contoh "C. Rawit" -> "Cabe Rawit"), gunakan nama persis dari Daftar Bahan Baku dan set category "BAHAN_BAKU".
- Jika item tersebut identik dengan tagihan listrik/gas/sewa, klasifikasikan sebagai "OPERASIONAL" dan cocokkan juga ke Daftar Operasional jika mirip.
- Jika item benar-benar baru, gunakan teks asli nota dan tentukan secara mandiri apakah itu masuk "BAHAN_BAKU" atau "OPERASIONAL".

Ekstrak ke format JSON yang valid (tanpa markdown):
{
  "totalAmount": angka total (hanya angka bulat, tanpa titik/koma/Rp),
  "items": [
    {
      "category": "BAHAN_BAKU | OPERASIONAL",
      "name": "nama item",
      "quantity": jumlah unit/bulan/barang (angka bulat, isi 1 jika kosong/layanan),
      "unit": "satuan (Kg, Pcs, Bln, Lb, dll) jika ada. Jika tidak, kosongkan",
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
            category: { type: "STRING" },
            name: { type: "STRING" },
            quantity: { type: "NUMBER" },
            unit: { type: "STRING" },
            price: { type: "NUMBER" },
            subtotal: { type: "NUMBER" },
          },
          required: [
            "category",
            "name",
            "quantity",
            "unit",
            "price",
            "subtotal",
          ],
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
        category: "OPERASIONAL",
        name: "Item dari Nota OCR",
        rawName: "Item dari Nota OCR",
        quantity: 1,
        price: parsed.totalAmount,
        subtotal: parsed.totalAmount,
        unit: "Pcs",
      },
    ];
  } else {
    parsed.items = parsed.items.map((it) => ({
      ...it,
      category: it.category === "BAHAN_BAKU" ? "BAHAN_BAKU" : "OPERASIONAL",
      rawName: it.name,
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
      const isBahanBaku = item.category === "BAHAN_BAKU";
      const catPrefix = isBahanBaku ? "[Bahan Baku] " : "[Operasional] ";
      const catType = isBahanBaku ? "BAHAN_BAKU" : "OPERASIONAL";

      let cleanName = item.name
        .replace("[Bahan Baku] ", "")
        .replace("[Operasional] ", "")
        .trim();
      const finalName = `${catPrefix}${cleanName}`;

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
            unit: item.unit || (isBahanBaku ? "Kg/Liter" : "Bulan"),
            type: catType,
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
