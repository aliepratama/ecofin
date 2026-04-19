import { eq, desc } from 'drizzle-orm';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { calculateTrustScore } from '@/libs/scoring/TrustScore';
import { createClient } from '@/libs/supabase/server';
import { transactions, businesses, stakeholders } from '@/models/Schema';
import { DashboardCharts } from './DashboardCharts';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, userId),
  });

  // Cek apakah ybs adalah stakeholder
  const activeStakeholder = await db.query.stakeholders.findFirst({
    where: eq(stakeholders.userId, userId),
  });

  // Jika bukan owner, dan dia stakeholder, maka arahkan ke stakeholder dashboard.
  // Jika dia punya business (owner) tapi kebetulan dia juga stakeholder (misal diundang teman),
  // prioritas kita tetap tampilkan dashboard owner dia sendiri di sini.
  if (!activeBusiness && activeStakeholder) {
    redirect('/stakeholder/dashboard');
  }

  if (!activeBusiness) {
    redirect('/setup');
  }

  // Ambil transaksi terbaru (10 terakhir)
  const recentTransactions = await db.query.transactions.findMany({
    where: eq(transactions.businessId, activeBusiness.id),
    orderBy: [desc(transactions.date)],
    limit: 10,
  });

  // Hitung Pemasukan dan Pengeluaran sederhana (Demo)
  const totalIncome = recentTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

  const totalExpense = recentTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

  const netProfit = totalIncome - totalExpense;
  const trustScore = calculateTrustScore(
    recentTransactions as any,
    activeBusiness
  );

  // Jangan blokir render awal dengan call AI. Pindahkan fetching AI ke komponen Client (SWR/React Query) atau buang await di atas.
  // Untuk sementara, kita berikan default loading atau disable call AI di server agar tidak delay 5-10 detik:

  // let insights = null;
  // try {
  //   insights = await getDashboardInsights(); // INI PENYEBAB DELAY
  // } catch (err) {
  //   console.error(err);
  // }

  // const insights = null; // AI Insight dimatikan sementara di SSR agar login instan

  const plText =
    'Berdasarkan penjualan minggu ini, laba bersih akhir bulan diproyeksi stabil. Anda berada di jalur aman.';
  const plProgress = 80;
  const demandText =
    'Prediksi cuaca cerah dan histori penjualan baik. Tingkatkan stok untuk menghadapi potensi keramaian.';

  const getTransactionLabel = (inputMethod: string) => {
    if (inputMethod === 'OCR') {
      return 'Nota/Struk';
    }

    if (inputMethod === 'VOICE') {
      return 'Pencatatan AI';
    }

    return 'Manual';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-5 shadow-sm sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Ecofin Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                Ringkasan usaha
              </h1>
              <p className="mt-1 text-base text-muted-foreground">
                Pantau omzet, pengeluaran, dan skor pinjaman harian
              </p>
            </div>
          </div>

          <div className="hidden items-center space-x-3 md:flex">
            <a
              href="/setup"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary/20 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Profil usaha
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:space-y-8 lg:px-8">
        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-5 sm:gap-4">
          <a
            href="/chat"
            className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <svg
              className="h-6 w-6 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span className="mt-2 text-center text-sm font-semibold text-foreground">
              Chat & Suara (AI)
            </span>
          </a>
          <a
            href="/scan"
            className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <svg
              className="h-6 w-6 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="mt-2 text-center text-sm font-semibold text-foreground">
              Scan Nota (AI)
            </span>
          </a>
          <a
            href="/dashboard/products"
            className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <svg
              className="h-6 w-6 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span className="mt-2 text-center text-sm font-semibold text-foreground">
              Menu & Bahan
            </span>
          </a>
          <a
            href="/dashboard/produksi"
            className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <svg
              className="h-6 w-6 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="mt-2 text-center text-sm font-semibold text-foreground">
              Rencana Masak
            </span>
          </a>
          <a
            href="/manual"
            className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <svg
              className="h-6 w-6 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span className="mt-2 text-center text-sm font-semibold text-foreground">
              Manual
            </span>
          </a>
          <a
            href="/stakeholder-link"
            className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <svg
              className="h-6 w-6 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14L21 3m0 0h-7m7 0v7M3 10h4a2 2 0 012 2v4a2 2 0 01-2 2H3a2 2 0 01-2-2v-4a2 2 0 012-2z"
              />
            </svg>
            <span className="mt-2 text-center text-sm font-semibold text-foreground">
              Link Lender
            </span>
          </a>
        </div>

        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Income Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                Pemasukan (Bulan Ini)
              </h3>
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
          </div>
          {/* Expense Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                Pengeluaran (Bulan Ini)
              </h3>
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Rp {totalExpense.toLocaleString('id-ID')}
            </p>
          </div>
          {/* Net Profit Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                Laba Bersih / Net (Bulan Ini)
              </h3>
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Rp {netProfit.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Insert Dashboard Charts Here */}
        <DashboardCharts
          transactions={recentTransactions as any}
          trustScore={trustScore}
        />

        {/* AI Insights & Demand Forecasting */}
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
          {/* Dynamic P&L Forecast */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/20">
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">
                Dynamic P&L Forecast (AI)
              </h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {plText}
            </p>
            <div className="mt-6 flex items-center justify-between text-sm font-medium text-foreground">
              <span className="text-muted-foreground">Awal Bulan</span>
              <span>Proyeksi Laba</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full border border-border bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${plProgress}%` }}
              />
            </div>
          </div>

          {/* Demand Forecasting Warning */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/20">
            <div>
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-foreground">
                  Demand Forecasting (AI)
                </h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                <span className="font-bold text-foreground">
                  Rekomendasi AI:
                </span>{' '}
                {demandText}
              </p>
            </div>
            <button className="mt-6 inline-flex w-fit items-center justify-center rounded-lg border border-border bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90">
              Restok Otomatis (Draft)
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-6">
            <h3 className="text-lg font-bold text-foreground">
              Riwayat Transaksi Terakhir
            </h3>
            <button className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Lihat Semua
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Sumber
                  </th>
                  <th className="px-6 py-4 text-right font-semibold tracking-wider">
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((trx) => (
                    <tr
                      key={trx.id}
                      className="group transition-colors hover:bg-muted/50"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {getTransactionLabel(trx.inputMethod)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {trx.date.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            trx.type === 'INCOME'
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-muted text-foreground'
                          }`}
                        >
                          {trx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                          {trx.inputMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">
                        {trx.type === 'INCOME' ? '+' : '-'}Rp{' '}
                        {Number(trx.totalAmount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      Belum ada transaksi. Gunakan menu Chat AI untuk mencatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
