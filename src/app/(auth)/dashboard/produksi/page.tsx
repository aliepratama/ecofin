import { redirect } from 'next/navigation';
import { createClient } from '@/libs/supabase/server';
import { getProductionPlan } from './actions';
import { ProductionManager } from './ProductionManager';

export const metadata = {
  title: 'Rencana Masak & Produksi',
};

export default async function ProduksiPage(props: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const sp = await props.searchParams;
  // If undefined, default to today
  const targetDate = sp?.date ?? new Date().toISOString().split('T')[0]!;

  const planData = await getProductionPlan(targetDate);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Rencana Produksi
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Atur menu yang akan didisplay dan pantau jumlah terjual.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <ProductionManager initialData={planData} initialDate={targetDate} />
      </main>
    </div>
  );
}
