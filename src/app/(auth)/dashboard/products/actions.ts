'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { parseMenusFromImage } from '@/libs/ai/gemini-service';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { businesses, products } from '@/models/Schema';

export async function scanMenuFromImageAction(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file || !(file instanceof File)) {
    return { error: 'Gambar tidak ditemukan atau tidak valid' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Kirim ke Gemini
    const parsed = await parseMenusFromImage(base64, file.type);
    if (!parsed || parsed.length === 0) {
      return {
        error: 'AI tidak mendeteksi teks menu atau harga dari gambar ini.',
      };
    }

    return { success: true, menus: parsed };
  } catch (error) {
    console.error('Error reading image:', error);
    return { error: 'Terjadi kesalahan saat memproses gambar dengan AI.' };
  }
}

export async function bulkAddProducts(productsList: any[]) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    return { error: 'Not authenticated' };
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, authData.user.id))
    .limit(1);

  if (userBusinesses.length === 0) {
    return { error: 'Business not found' };
  }

  try {
    const values = productsList.map((p) => ({
      businessId: userBusinesses[0]?.id ?? '',
      name: p.name,
      price: String(p.price ?? 0),
      currentStock: 0,
      unit: 'Porsi', // default
      type: 'MENU' as const,
    }));

    if (values.length > 0) {
      await db.insert(products).values(values);
    }
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Bulk add error', error);
    return { error: 'Gagal menyimpan daftar menu ke database' };
  }
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    return { error: 'Not authenticated' };
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, authData.user.id))
    .limit(1);

  if (userBusinesses.length === 0) {
    return { error: 'Business not found' };
  }

  const name = formData.get('name') as string;
  const price = Number.parseFloat(formData.get('price') as string);
  const currentStock = Number.parseInt(
    formData.get('currentStock') as string,
    10
  );
  const unit = formData.get('unit') as string;
  const isRawMaterial = formData.get('isRawMaterial') === 'true';
  const type = isRawMaterial ? 'BAHAN_BAKU' : 'MENU';

  let aiRecipe = [];
  try {
    const recipeRaw = formData.get('aiRecipe') as string;
    if (recipeRaw) {
      aiRecipe = JSON.parse(recipeRaw);
    }
  } catch (error) {
    console.error('Failed to parse AI recipe JSON', error);
  }

  // Mengakali pemisahan kategori untuk saat ini dengan menambah prefix [Bahan Baku] pada nama
  const finalName = isRawMaterial ? `[Bahan Baku] ${name}` : name;

  if (!name || isNaN(price)) {
    return { error: 'Name and valid price are required' };
  }

  await db.insert(products).values({
    businessId: userBusinesses[0]?.id ?? '',
    name: finalName,
    price: price.toString(),
    currentStock: isNaN(currentStock) ? 0 : currentStock,
    unit: unit || (isRawMaterial ? 'Kg/Liter' : 'Porsi'),
    type,
    aiRecipe,
  });

  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    return { error: 'Not authenticated' };
  }

  await db.delete(products).where(eq(products.id, productId));

  revalidatePath('/dashboard/products');
  return { success: true };
}
