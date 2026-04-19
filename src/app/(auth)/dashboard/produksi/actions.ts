'use server';

import { eq, and, sql, gte, lt } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import {
  businesses,
  products,
  productionPlans,
  transactions,
  transactionDetails,
} from '@/models/Schema';

export async function getProductionPlan(dateStr: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, user.id));

  if (!userBusinesses.length) {
    redirect('/setup');
  }

  const businessId = userBusinesses[0]?.id ?? '';
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  const targetDateEnd = new Date(targetDate);
  targetDateEnd.setDate(targetDateEnd.getDate() + 1);

  // Get all active MENU products
  const menus = await db
    .select()
    .from(products)
    .where(and(eq(products.businessId, businessId), eq(products.type, 'MENU')));

  // Get planned production
  const plans = await db
    .select({
      productId: productionPlans.productId,
      plannedQuantity: productionPlans.plannedQuantity,
    })
    .from(productionPlans)
    .where(
      and(
        eq(productionPlans.businessId, businessId),
        // For exact date matching we use the same timestamp boundary if stored as datetime
        gte(productionPlans.date, targetDate),
        lt(productionPlans.date, targetDateEnd)
      )
    );

  // Get actual sales from transactions
  const sales = await db
    .select({
      productId: transactionDetails.productId,
      totalSold: sql<number>`sum(${transactionDetails.quantity})`.mapWith(
        Number
      ),
    })
    .from(transactionDetails)
    .innerJoin(
      transactions,
      eq(transactionDetails.transactionId, transactions.id)
    )
    .where(
      and(
        eq(transactions.businessId, businessId),
        eq(transactions.type, 'INCOME'),
        gte(transactions.date, targetDate),
        lt(transactions.date, targetDateEnd)
      )
    )
    .groupBy(transactionDetails.productId);

  // Combine into one summary object per product
  const summary = menus.map((menu) => {
    const plan = plans.find((p) => p.productId === menu.id);
    const sale = sales.find((s) => s.productId === menu.id);

    const planned = plan?.plannedQuantity ?? 0;
    const sold = sale?.totalSold ?? 0;
    const remaining = Math.max(0, planned - sold);

    return {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      planned,
      sold,
      remaining,
    };
  });

  return summary;
}

export async function saveProductionPlan(
  dateStr: string,
  productId: string,
  plannedQuantity: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, user.id));
  if (!userBusinesses.length) {
    return { error: 'No business' };
  }

  const businessId = userBusinesses[0]?.id ?? '';
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  // UPSERT
  await db.execute(sql`
    INSERT INTO ${productionPlans} (business_id, product_id, date, planned_quantity)
    VALUES (${businessId}, ${productId}, ${targetDate.toISOString()}, ${plannedQuantity})
    ON CONFLICT (business_id, product_id, date)
    DO UPDATE SET planned_quantity = EXCLUDED.planned_quantity, updated_at = NOW();
  `);

  return { success: true };
}
