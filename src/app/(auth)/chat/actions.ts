'use server';

import { eq } from 'drizzle-orm';
import { parseTransactionFromText } from '@/libs/ai/gemini-service';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import {
  businesses,
  transactions,
  products,
  transactionDetails,
} from '@/models/Schema';

export async function sendChatMessage(
  input: string,
  location?: { latitude: string; longitude: string }
) {
  if (!input || input.trim() === '') {
    return { success: false, message: 'Input tidak boleh kosong' };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return {
      success: false,
      message: 'Sesi Anda telah berakhir, silakan login kembali.',
    };
  }

  const userId = authData.user.id;

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, userId),
  });

  if (!activeBusiness) {
    return {
      success: false,
      message: 'Anda belum mendaftarkan Bisnis Anda.',
    };
  }

  const parsedData = await parseTransactionFromText(input);

  if (!parsedData) {
    return {
      success: false,
      message:
        'Gagal menguraikan maksud transaksi. Coba ulangi dengan kalimat yang lebih jelas.',
    };
  }

  try {
    await db.transaction(async (tx) => {
      const [newTx] = await tx
        .insert(transactions)
        .values({
          businessId: activeBusiness.id,
          userId: userId,
          type: parsedData.type,
          totalAmount: parsedData.amount.toString(),
          inputMethod: 'VOICE', // Or 'MANUAL' actually since they type it, but the AI parses it. 'VOICE' is matching our intent.
          latitudeCaptured: location?.latitude ?? null,
          longitudeCaptured: location?.longitude ?? null,
          syncStatus: 'synced',
        })
        .returning();

      const items =
        parsedData.items && parsedData.items.length > 0
          ? parsedData.items
          : [
              {
                itemName: parsedData.description || 'Pencatatan AI',
                quantity: 1,
                price: parsedData.amount,
                unit: 'pcs',
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
                  : parsedData.amount.toString(),
              currentStock:
                parsedData.type === 'INCOME'
                  ? -item.quantity
                  : Math.max(0, item.quantity),
              unit: item.unit ?? 'pcs',
            })
            .returning();
          activeProduct = insertedProduct;
        } else {
          const stockChange =
            parsedData.type === 'INCOME' ? -item.quantity : item.quantity;
          const newStock = Math.max(
            0,
            activeProduct.currentStock + stockChange
          );
          await tx
            .update(products)
            .set({
              currentStock: newStock,
            })
            .where(eq(products.id, activeProduct.id));
        }

        if (!newTx) {
          throw new Error('Failed to insert transaction');
        }
        if (!activeProduct) {
          throw new Error('Failed to insert/find product');
        }

        const subtotal =
          item.price !== undefined
            ? item.price * item.quantity
            : parsedData.amount;
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
      data: parsedData,
      message: `Sip! Transaksi ${parsedData.type === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'} sebesar Rp ${parsedData.amount.toLocaleString('id-ID')} berhasil dicatat.`,
    };
  } catch (dbError) {
    console.error('Insert error:', dbError);
    return {
      success: false,
      message: 'Gagal menyimpan transaksi ke database. Periksa koneksi Anda.',
    };
  }
}
