"use server";
import { eq } from "drizzle-orm";
import { db } from "@/libs/DB";
import { createClient } from "@/libs/supabase/server";
import { businesses, products } from "@/models/Schema";

export async function getBahanBakuList() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return [];

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, user.id),
  });

  if (!activeBusiness) return [];

  const list = await db.query.products.findMany({
    where: eq(products.businessId, activeBusiness.id),
  });

  const bahanBaku = list.filter(
    (p) => p.type === "BAHAN_BAKU" || p.name.includes("[Bahan Baku]"),
  );

  return bahanBaku.map((b) => ({
    id: b.id,
    name: b.name.replace("[Bahan Baku] ", ""),
    price: Number(b.price),
    unit: b.unit || "Kg/Liter",
  }));
}
