'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/libs/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Beranda
      </Link>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-card-foreground shadow-lg relative">
        <h2 className="mb-6 text-center text-3xl font-bold tracking-tight">
          Masuk ke Ecofin
        </h2>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="text-md h-12 w-full"
            onClick={handleGoogleLogin}
          >
            Masuk Cepat dengan Google
          </Button>

          <div className="relative flex items-center py-5">
            <div className="grow border-t border-border" />
            <span className="shrink px-6 text-sm text-muted-foreground">
              atau
            </span>
            <div className="grow border-t border-border" />
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email atau No. Handphone
              </Label>
              <Input
                id="email"
                type="text"
                className="h-12"
                placeholder="08123xxx / email@anda.com"
              />
            </div>

            <Button type="button" className="text-md h-12 w-full font-semibold">
              Lanjutkan dengan OTP
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
