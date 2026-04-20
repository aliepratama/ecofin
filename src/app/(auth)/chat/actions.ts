"use server";

import { eq } from "drizzle-orm";
import { parseTransactionFromText } from "@/libs/ai/gemini-service";
import { db } from "@/libs/DB";
import { createClient } from "@/libs/supabase/server";
import {
  businesses,
  transactions,
  products,
  transactionDetails,
} from "@/models/Schema";

export async function sendChatMessage(
  history: { role: "user" | "model"; text: string }[],
  input: string,
) {
  if (!input || input.trim() === "") {
    return { success: false, message: "Input tidak boleh kosong" };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return {
      success: false,
      message: "Sesi Anda telah berakhir, silakan login kembali.",
    };
  }

  const parsedData = await parseTransactionFromText(history, input);

  if (!parsedData) {
    return {
      success: false,
      message:
        "Gagal menguraikan maksud transaksi. Coba ulangi dengan kalimat yang lebih jelas.",
    };
  }

  if (parsedData.isAmbiguous || !parsedData.transaction) {
    return {
      success: true,
      message:
        parsedData.clarificationMessage ||
        "Maksud Anda kurang jelas, apakah bisa diulangi informasinya?",
    };
  }

  return {
    success: true,
    isConfirmation: true,
    transactionToConfirm: parsedData.transaction,
    message: `Harap konfirmasi pencatatan:\n\n* ${parsedData.transaction.type === "INCOME" ? "Pemasukan" : "Pengeluaran"} sebesar Rp. ${parsedData.transaction.amount.toLocaleString("id-ID")}\n* Keterangan: ${parsedData.transaction.description}\n\nApakah ini sudah benar?`,
  };
}

export async function confirmAndSaveTransaction(
  transaction: {
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    items?: any[];
  },
  location?: { latitude: string; longitude: string },
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return {
      success: false,
      message: "Sesi Anda telah berakhir, silakan login kembali.",
    };
  }

  const userId = authData.user.id;

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, userId),
  });

  if (!activeBusiness) {
    return {
      success: false,
      message: "Anda belum mendaftarkan Bisnis Anda.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      const [newTx] = await tx
        .insert(transactions)
        .values({
          businessId: activeBusiness.id,
          userId: userId,
          type: transaction.type,
          totalAmount: transaction.amount.toString(),
          inputMethod: "VOICE",
          latitudeCaptured: location?.latitude ?? null,
          longitudeCaptured: location?.longitude ?? null,
          syncStatus: "synced",
        })
        .returning();

      const items =
        transaction.items && transaction.items.length > 0
          ? transaction.items
          : [
              {
                itemName: transaction.description || "Pencatatan AI",
                quantity: 1,
                price: transaction.amount,
                unit: "pcs",
              },
            ];

      for (const item of items) {
        let activeProduct = await tx.query.products.findFirst({
          where: eq(products.name, item.itemName),
        });

        if (!activeProduct) {
          const [insertedProduct] = await tx
            .insert(products)
            .values({
              businessId: activeBusiness.id,
              name: item.itemName,
              price:
                item.price !== undefined
                  ? item.price.toString()
                  : transaction.amount.toString(),
              currentStock:
                transaction.type === "INCOME"
                  ? -item.quantity
                  : Math.max(0, item.quantity),
              unit: item.unit ?? "pcs",
            })
            .returning();
          activeProduct = insertedProduct;
        } else {
          const stockChange =
            transaction.type === "INCOME" ? -item.quantity : item.quantity;
          const newStock = Math.max(
            0,
            activeProduct.currentStock + stockChange,
          );
          await tx
            .update(products)
            .set({
              currentStock: newStock,
            })
            .where(eq(products.id, activeProduct.id));
        }

        if (!newTx) {
          throw new Error("Failed to insert transaction");
        }
        if (!activeProduct) {
          throw new Error("Failed to insert/find product");
        }

        const subtotal =
          item.price !== undefined
            ? item.price * item.quantity
            : transaction.amount;
        await tx.insert(transactionDetails).values({
          transactionId: newTx.id,
          productId: activeProduct.id,
          quantity: item.quantity,
          subtotal: subtotal.toString(),
        });
      }
    });

    return {
      success: true,
      message: `Sip! Transaksi ${transaction.type === "EXPENSE" ? "pengeluaran" : "pemasukan"} sebesar Rp ${transaction.amount.toLocaleString("id-ID")} berhasil dicatat.`,
    };
  } catch (dbError) {
    console.error("Insert error:", dbError);
    return {
      success: false,
      message: "Gagal menyimpan transaksi ke database. Periksa koneksi Anda.",
    };
  }
}
