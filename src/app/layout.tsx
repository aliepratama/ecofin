import type { Metadata, Viewport } from 'next';
import '@/styles/global.css';
import { Geist } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Ecofin',
  description: 'Manage your expenses and financial tracking with ease.',
  manifest: '/icons_and_manifest/manifest.json',
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/icons_and_manifest/icons/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/icons_and_manifest/icons/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/icons_and_manifest/icons/favicon-16x16.png',
    },
    { rel: 'icon', url: '/icons_and_manifest/icons/favicon.ico' },
  ],
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
      data-theme="light"
    >
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
