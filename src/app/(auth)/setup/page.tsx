import { eq } from 'drizzle-orm';
import { Store } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { stakeholders, businesses } from '@/models/Schema';
import { BusinessProfileForm } from './BusinessProfileForm';

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const activeStakeholder = await db.query.stakeholders.findFirst({
    where: eq(stakeholders.userId, user.id),
  });

  if (activeStakeholder) {
    redirect('/stakeholder/dashboard');
  }

  const existingBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, user.id),
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 p-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <a
          href="/dashboard"
          className="inline-flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          Kembali ke dasbor
        </a>
      </div>

      <div className="w-full space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Profil usaha</h1>
          <p className="text-base text-muted-foreground">
            Lengkapi data usaha agar pencatatan dan analisis semakin akurat.
          </p>
        </div>

        <BusinessProfileForm initialName={existingBusiness?.name} />

        <form
          action={async () => {
            'use server';
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect('/login');
          }}
        >
          <Button type="submit" variant="outline" className="h-12 w-full">
            Keluar akun
          </Button>
        </form>
      </div>
    </div>
  );
}
