import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/libs/DB";
import { createClient } from "@/libs/supabase/server";
import {
  businesses,
  products,
  transactionDetails,
  transactions,
  receiptImages,
} from "@/models/Schema";
import { ProductManager } from "./ProductManager";
import type { ParsedReceiptData } from "../../scan/actions";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/login");
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, user.id))
    .limit(1);

  const activeBusinessId = userBusinesses[0]?.id;

  if (!activeBusinessId) {
    redirect("/setup");
  }

  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.businessId, activeBusinessId));

  const historyQuery = await db
    .select({
      productId: transactionDetails.productId,
      subtotal: transactionDetails.subtotal,
      quantity: transactionDetails.quantity,
      date: transactions.date,
      ocrRawJson: receiptImages.ocrRawJson,
    })
    .from(transactionDetails)
    .innerJoin(
      transactions,
      eq(transactions.id, transactionDetails.transactionId),
    )
    .leftJoin(receiptImages, eq(receiptImages.transactionId, transactions.id))
    .where(eq(transactions.businessId, activeBusinessId))
    .orderBy(asc(transactions.date));

  const priceHistoryData: Record<
    string,
    {
      timeline: { date: string; price: number }[];
      typos: string[];
      delta: number;
    }
  > = {};

  historyQuery.forEach((row) => {
    if (!row.productId || !row.date) return;
    if (!priceHistoryData[row.productId]) {
      priceHistoryData[row.productId] = { timeline: [], typos: [], delta: 0 };
    }

    const pricePerUnit = Number(row.subtotal) / Number(row.quantity);
    const dateStr = row.date.toISOString().split("T")[0];

    // Only add if not same date (simplification) or calculate average
    const history = priceHistoryData[row.productId];
    if (!history) return;

    const timeline = history.timeline;
    const lastEntry = timeline[timeline.length - 1];

    if (lastEntry && lastEntry.date === dateStr) {
      lastEntry.price = pricePerUnit; // update to latest of the day
    } else {
      timeline.push({ date: dateStr || "", price: pricePerUnit });
    }

    if (row.ocrRawJson) {
      const parsed = row.ocrRawJson as ParsedReceiptData;
      const matchedProd = userProducts.find((p) => p.id === row.productId);
      if (matchedProd && parsed.items) {
        const item = parsed.items.find((it) => it.name === matchedProd.name);
        if (item?.rawName && item.rawName !== matchedProd.name) {
          if (!history.typos.includes(item.rawName)) {
            history.typos.push(item.rawName);
          }
        }
      }
    }
  });

  Object.values(priceHistoryData).forEach((data) => {
    if (data.timeline.length >= 2) {
      const latest = data.timeline[data.timeline.length - 1]?.price || 0;
      const previous = data.timeline[data.timeline.length - 2]?.price || 0;
      data.delta = latest - previous;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-5 shadow-sm sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Manajemen Stok Menu
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Detail menu dan bahan baku
            </p>
          </div>
          <div className="hidden items-center space-x-3 md:flex">
            <a
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductManager
          initialProducts={userProducts}
          priceHistoryData={priceHistoryData}
        />
      </main>
    </div>
  );
}
