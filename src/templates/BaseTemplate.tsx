import { ModeToggle } from '@/components/ModeToggle';
import { AppConfig } from '@/utils/AppConfig';

export const BaseTemplate = (props: {
  leftNav: React.ReactNode;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex min-h-screen flex-col bg-background text-foreground">
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {AppConfig.name}
          </h1>
          <nav className="hidden md:block">
            <ul className="flex flex-wrap items-center gap-x-6 text-sm font-medium text-muted-foreground">
              {props.leftNav}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <nav>
            <ul className="flex flex-wrap items-center gap-x-4 text-sm font-medium">
              {props.rightNav}
            </ul>
          </nav>
          <ModeToggle />
        </div>
      </div>
    </header>

    <main className="container mx-auto flex-1 px-4 py-8">{props.children}</main>

    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-14 md:flex-row">
        <p className="text-sm leading-loose text-muted-foreground">
          © {new Date().getFullYear()} {AppConfig.name}. Dibuat untuk memajukan UMKM Indonesia.
        </p>
      </div>
    </footer>
  </div>
);
