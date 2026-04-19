import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStakeholderPortfolioAnalyticsAction } from '@/app/(stakeholder)/analytics/actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/libs/supabase/server';
import { TrustScoreDetailChart } from './TrustScoreDetailChart';

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default async function StakeholderBusinessDetailPage(props: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  // We can fetch all for now and filter.
  // In a real production app, we would make a specific query by businessId.
  const analytics = await getStakeholderPortfolioAnalyticsAction();
  const business = analytics.linkedBusinesses.find((b) => b.businessId === id);

  if (!business) {
    return (
      <div className="mx-auto mt-12 min-h-screen w-full max-w-4xl px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">UMKM Tidak Ditemukan</h2>
        <p className="mt-2 text-muted-foreground">
          UMKM yang Anda cari tidak tersedia atau belum membagikan datanya.
        </p>
        <Link
          href="/stakeholder/dashboard"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const minMedium = analytics.minMediumTrustScore;
  const minHigh = analytics.minHighTrustScore;
  const tScore = business.trustScore;

  let categoryLabel = 'Lemah';
  let categoryColor: 'default' | 'destructive' | 'outline' | 'secondary' =
    'destructive';

  if (tScore !== null) {
    if (tScore >= minHigh) {
      categoryLabel = 'Dapat dipercaya';
      categoryColor = 'default';
    } else if (tScore >= minMedium) {
      categoryLabel = 'Menengah';
      categoryColor = 'secondary';
    }
  } else {
    categoryLabel = 'Sedang dikalkulasi';
    categoryColor = 'outline';
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <Link
          href="/stakeholder/dashboard"
          className="mb-2 -ml-4 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="mr-2" />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          {business.businessName}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary">Trust Score: {tScore ?? 'N/A'}</Badge>
          <Badge variant={categoryColor}>{categoryLabel}</Badge>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.transactionCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validasi AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.aiValidationRatio}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Arus Kas Bersih
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                business.netCashflow >= 0
                  ? 'text-emerald-600 dark:text-emerald-500'
                  : 'text-destructive'
              }`}
            >
              {formatCurrency(business.netCashflow)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status Aktivitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                business.transactionCount > 0 ? 'default' : 'destructive'
              }
            >
              {business.transactionCount > 0 ? 'Aktif' : 'Pasif'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Diagram Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center">
            {/*
                We will display the visual guage component here. 
                Will pass current score and thresholds to TrustScoreDetailChart 
            */}
            <TrustScoreDetailChart
              score={business.trustScore ?? 0}
              minMedium={minMedium}
              minHigh={minHigh}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Tren Penjualan 6 Bulan Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Same chart code from old LinkedBusinessesTable goes here: */}
            <div className="h-64 w-full">
              {business.monthlyTrend && business.monthlyTrend.length > 0 ? (
                <TrustScoreDetailChart
                  monthlyTrend={business.monthlyTrend}
                  showTrendOnly={true}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-background pb-4 text-sm text-muted-foreground">
                  Data transaksi belum tersedia.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
