import { redirect } from 'next/navigation';
import { claimStakeholderInviteAction } from '@/app/(stakeholder)/link/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/libs/supabase/server';

type PageProps = {
  searchParams: Promise<{
    linked?: string;
    error?: string;
    inviteCode?: string;
  }>;
};

export default async function StakeholderLinkPage(props: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { linked, error, inviteCode } = await props.searchParams;

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Hubungkan ke lender</CardTitle>
          <CardDescription>
            Masukkan kode dari bank/koperasi agar mereka bisa melihat ringkasan
            data usaha Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              'use server';
              try {
                const result = await claimStakeholderInviteAction(formData);
                redirect(`/stakeholder-link?linked=${result.linkedCount}`);
              } catch (submitError) {
                const message =
                  submitError instanceof Error
                    ? submitError.message
                    : 'Gagal menghubungkan kode';
                redirect(
                  `/stakeholder-link?error=${encodeURIComponent(message)}`
                );
              }
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="inviteCode">Kode undangan lender</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                placeholder="Contoh: 8B2F9A1C"
                defaultValue={inviteCode ?? ''}
                required
              />
            </div>
            <Button type="submit" className="h-12 w-full">
              Hubungkan sekarang
            </Button>
          </form>

          {linked ? (
            <p className="mt-4 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
              Berhasil terhubung. {linked} usaha Anda sudah masuk ke portofolio
              lender.
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
