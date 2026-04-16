import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/libs/DB";
import { createClient } from "@/libs/supabase/server";
import { businesses, transactions } from "@/models/Schema";
import { ManualTransactionForm } from "./ManualTransactionForm";

export default async function ManualTransactionPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/login");
  }

  // Add the server action inside the page or extract it
  async function addManualTransaction(formData: FormData) {
    "use server";

    const supabaseServer = await createClient();
    const { data: serverAuthData } = await supabaseServer.auth.getUser();
    const serverUser = serverAuthData?.user;

    if (!serverUser) {
      throw new Error("Unauthorized");
    }

    const activeBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.ownerId, serverUser.id),
    });

    if (!activeBusiness) {
      throw new Error("Business not found");
    }

    const type = formData.get("type") as "INCOME" | "EXPENSE";
    const amount = formData.get("amount") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;

    if (!type || !amount) {
      return;
    }

    await db.insert(transactions).values({
      businessId: activeBusiness.id,
      userId: serverUser.id,
      type,
      totalAmount: amount,
      inputMethod: "MANUAL",
      syncStatus: "synced",
      latitudeCaptured: latitude || null,
      longitudeCaptured: longitude || null,
    });

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center space-x-3 border-b border-border bg-card px-4 py-5 shadow-sm sm:px-6">
        <a
          href="/dashboard"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </a>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catat manual</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Tambahkan data pemasukan/pengeluaran
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <ManualTransactionForm action={addManualTransaction} />
      </main>
    </div>
  );
}
