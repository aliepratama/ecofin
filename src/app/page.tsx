import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { BaseTemplate } from '@/templates/BaseTemplate';

export default function Home() {
  return (
    <BaseTemplate
      leftNav={
        <>
          <li>
            <Link href="/" className="font-medium transition-colors hover:text-foreground">
              Beranda
            </Link>
          </li>
          <li>
            <Link
              href="/"
              className="font-medium transition-colors hover:text-foreground"
            >
              Fitur AI
            </Link>
          </li>
        </>
      }
      rightNav={
        <>
          <li>
            <Link
              href="/login"
              className={buttonVariants({ variant: 'ghost' })}
            >
              Masuk Akun
            </Link>
          </li>
          <li>
            <Link href="/dashboard" className={buttonVariants()}>
              Coba Sekarang
            </Link>
          </li>
        </>
      }
    >
      <div className="flex animate-in flex-col items-center justify-center space-y-8 py-24 text-center duration-500 fade-in zoom-in">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl text-foreground">
          Asisten Keuangan Pintar untuk <span className="text-muted-foreground border-b-4 border-foreground">UMKM</span> Anda
        </h1>
        <p className="max-w-[650px] text-xl text-muted-foreground leading-relaxed">
          Catat bon, tagihan, dan pengeluaran harian semudah chatting di WhatsApp. Tanpa ketik manual, biar AI kami yang mengurus pembukuannya.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className={buttonVariants({
              size: 'lg',
              className: 'px-8 text-md',
            })}
          >
            Mulai Percuma
          </Link>
          <Link
            href="/"
            className={buttonVariants({
              size: 'lg',
              variant: 'outline',
              className: 'px-8 text-md',
            })}
          >
            Lihat Cara Kerjanya
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left border-t border-border pt-16">
          <div className="space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold">Foto Nota Langsung Beres</h3>
            <p className="text-muted-foreground">Tinggal jepret bon belanja dari supplier, sistem akan mengenali otomatis apakah ini Pemasukan atau Pengeluaran.</p>
          </div>
          <div className="space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold">Catat Pakai Pesan Suara</h3>
            <p className="text-muted-foreground">Sedang sibuk melayani pelanggan? Cukup ucapkan "Hari ini laku 5 porsi ayam geprek total 100 ribu".</p>
          </div>
          <div className="space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-xl font-bold">Paham Untung-Rugi</h3>
            <p className="text-muted-foreground">Pahami kesehatan bisnis toko Anda. Lihat laporan transparan agar tak ada lagi uang yang "hilang" misterius.</p>
          </div>
        </div>
      </div>
    </BaseTemplate>
  );
}
