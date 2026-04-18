"use server";

import { db } from "@/libs/DB";
import { businesses, products } from "@/models/Schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/libs/supabase/server";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: "Not authenticated" };

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, authData.user.id))
    .limit(1);

  if (userBusinesses.length === 0) return { error: "Business not found" };

  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const currentStock = parseInt(formData.get("currentStock") as string, 10);
  const unit = formData.get("unit") as string;
  const isRawMaterial = formData.get("isRawMaterial") === "true";
  const type = isRawMaterial ? "BAHAN_BAKU" : "MENU";

  let aiRecipe = [];
  try {
    const recipeRaw = formData.get("aiRecipe") as string;
    if (recipeRaw) {
      aiRecipe = JSON.parse(recipeRaw);
    }
  } catch (e) {
    console.error("Failed to parse AI recipe JSON", e);
  }

  // Mengakali pemisahan kategori untuk saat ini dengan menambah prefix [Bahan Baku] pada nama
  const finalName = isRawMaterial ? `[Bahan Baku] ${name}` : name;

  if (!name || isNaN(price)) {
    return { error: "Name and valid price are required" };
  }

  await db.insert(products).values({
    businessId: userBusinesses[0]?.id || "",
    name: finalName,
    price: price.toString(),
    currentStock: isNaN(currentStock) ? 0 : currentStock,
    unit: unit || (isRawMaterial ? "Kg/Liter" : "Porsi"),
    type,
    aiRecipe,
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: "Not authenticated" };

  await db.delete(products).where(eq(products.id, productId));

  revalidatePath("/dashboard/products");
  return { success: true };
}
