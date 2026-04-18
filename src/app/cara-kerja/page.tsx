import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BaseTemplate } from "@/templates/BaseTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cara Kerja - Ecofin",
  description:
    "Pelajari bagaimana Ecofin membantu mengelola keuangan UMKM Anda dengan mudah.",
};

export default function CaraKerjaPage() {
  return (
    <BaseTemplate
      leftNav={
        <>
          <li>
            <Link
              href="/"
              className="font-medium transition-colors hover:text-foreground"
            >
              Beranda
            </Link>
          </li>
          <li>
            <Link href="/cara-kerja" className="font-medium text-foreground">
              Cara Kerja
            </Link>
          </li>
        </>
      }
      rightNav={
        <>
          <li className="hidden sm:block">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost" })}
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
      <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl border-b-4 border-foreground inline-block pb-2">
            Cara Kerja Ecofin
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            3 Langkah mudah untuk mulai merapikan pembukuan UMKM Anda.
          </p>
        </div>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex flex-col sm:flex-row gap-8 items-center bg-muted/30 p-8 rounded-2xl border border-border">
            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-foreground text-background text-2xl font-bold">
              1
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-2">
                Daftar & Atur Profil Usaha
              </h2>
              <p className="text-muted-foreground">
                Buat akun secara gratis dalam waktu kurang dari semenit.
                Masukkan nama usaha Anda, dan Anda sudah siap menggunakan fitur
                pencatatan otomatis yang didukung AI.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col sm:flex-row-reverse gap-8 items-center bg-muted/30 p-8 rounded-2xl border border-border">
            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-foreground text-background text-2xl font-bold">
              2
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-2">
                Catat Transaksi Pakai Foto & Suara
              </h2>
              <p className="text-muted-foreground">
                Alih-alih mengetik nominal dan kategori satu per satu, cukup
                jepret nota pembelian atau kirim pesan suara singkat saat
                melayani pelanggan. AI kami yang akan memproses datanya!
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col sm:flex-row gap-8 items-center bg-muted/30 p-8 rounded-2xl border border-border">
            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-foreground text-background text-2xl font-bold">
              3
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-2">
                Pantau Laporan Secara Real-Time
              </h2>
              <p className="text-muted-foreground">
                Setiap akhir hari atau bulan, lihat ringkasan pendapatan,
                pengeluaran, dan profit bersih bisnis Anda pada dashboard yang
                mudah dipahami.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center space-y-6">
          <h3 className="text-xl font-semibold">
            Siap merapikan keuangan bisnis Anda?
          </h3>
          <Link
            href="/login"
            className={buttonVariants({
              size: "lg",
              className: "px-10 text-md",
            })}
          >
            Coba Sekarang Gratis
          </Link>
        </div>
      </div>
    </BaseTemplate>
  );
}
