import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { businesses, products } from '@/models/Schema';
import { ProductManager } from './ProductManager';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect('/login');
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, user.id))
    .limit(1);

  if (userBusinesses.length === 0) {
    redirect('/setup');
  }

  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.businessId, userBusinesses[0]?.id ?? ''));

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
        <ProductManager initialProducts={userProducts} />
      </main>
    </div>
  );
}
