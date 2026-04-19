import { LogOut, Settings, LayoutDashboard } from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/app/(stakeholder)/analytics/actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/libs/supabase/server';

export default async function StakeholderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  // Optional: Verify if user is actually a stakeholder role.
  // For now, assuming they are allowed.

  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/stakeholder/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <NextImage
              src="/logo.png"
              alt="Ecofin Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="hidden sm:inline-block">Ecofin Stakeholder</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-6 text-sm font-medium md:flex">
            <Link
              href="/stakeholder/dashboard"
              className="text-foreground transition-colors hover:text-foreground/80"
            >
              Dashboard
            </Link>
            <Link
              href="/stakeholder/settings"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Pengaturan
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick mobile nav links */}
          <div className="mr-2 flex items-center gap-1 md:hidden">
            <Link
              href="/stakeholder/dashboard"
              aria-label="Dashboard"
              className="mr-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="size-5" />
            </Link>
            <Link
              href="/stakeholder/settings"
              aria-label="Pengaturan"
              className="mr-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
            >
              <Settings className="size-5" />
            </Link>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <LogOut className="size-4" />
              <span className="hidden sm:inline-block">Keluar</span>
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
