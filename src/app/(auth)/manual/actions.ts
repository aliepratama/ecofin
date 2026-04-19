'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { businesses, transactions } from '@/models/Schema';

export async function addManualTransactionAction(
  _prevState: any,
  formData: FormData
) {
  try {
    const supabaseServer = await createClient();
    const { data: serverAuthData } = await supabaseServer.auth.getUser();
    const serverUser = serverAuthData?.user;

    if (!serverUser) {
      return { error: 'Sesi Anda telah berakhir, silakan login kembali.' };
    }

    const activeBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.ownerId, serverUser.id),
    });

    if (!activeBusiness) {
      return { error: 'Anda belum mendaftarkan Bisnis Anda.' };
    }

    const type = formData.get('type') as 'INCOME' | 'EXPENSE';
    const amount = formData.get('amount') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;

    if (!type || !amount) {
      return { error: 'Jenis transaksi dan nominal wajib diisi.' };
    }

    await db.insert(transactions).values({
      businessId: activeBusiness.id,
      userId: serverUser.id,
      type,
      totalAmount: amount,
      inputMethod: 'MANUAL',
      syncStatus: 'synced',
      latitudeCaptured: latitude || null,
      longitudeCaptured: longitude || null,
    });
  } catch (error: any) {
    console.error('Gagal menyimpan transaksi:', error);
    return {
      error: 'Gagal menyimpan transaksi ke database. Periksa koneksi Anda.',
    };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
