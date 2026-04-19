'use client';

import { usePathname } from 'next/navigation';
import { MobileTabBar } from '@/components/navigation/MobileTabBar';

export function AuthAppShell(props: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname === '/login';

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,oklch(0.99_0.01_245)_0%,oklch(1_0_0)_40%)]">
      <div className={hideChrome ? '' : 'pb-20 md:pb-0'}>{props.children}</div>
      <MobileTabBar />
    </div>
  );
}
