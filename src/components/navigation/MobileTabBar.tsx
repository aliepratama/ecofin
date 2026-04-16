"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanLine, Mic, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
    match: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/scan",
    label: "Scan",
    icon: ScanLine,
    match: (pathname) => pathname.startsWith("/scan"),
  },
  {
    href: "/chat",
    label: "Voice",
    icon: Mic,
    match: (pathname) => pathname.startsWith("/chat"),
  },
  {
    href: "/setup",
    label: "Profil",
    icon: UserRound,
    match: (pathname) => pathname.startsWith("/setup"),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
