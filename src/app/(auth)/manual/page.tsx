import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/libs/supabase/server';
import { addManualTransactionAction } from './actions';
import { ManualTransactionForm } from './ManualTransactionForm';

export default async function ManualTransactionPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-5 shadow-sm sm:px-6">
        <div className="flex items-center space-x-3">
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
        </div>
        <Image
          src="/logo.png"
          alt="Ecofin Logo"
          width={32}
          height={32}
          className="object-contain"
        />
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <ManualTransactionForm action={addManualTransactionAction} />
      </main>
    </div>
  );
}
