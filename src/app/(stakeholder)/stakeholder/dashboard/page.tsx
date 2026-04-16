import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Env } from "@/libs/Env";
import { createClient } from "@/libs/supabase/server";
import { getStakeholderPortfolioAnalyticsAction } from "@/app/(stakeholder)/analytics/actions";
import { createStakeholderInviteCodeAction } from "@/app/(stakeholder)/link/actions";

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default async function StakeholderDashboardPage(props: {
  readonly searchParams: Promise<{
    code?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const [{ code }, analytics] = await Promise.all([
    props.searchParams,
    getStakeholderPortfolioAnalyticsAction(),
  ]);

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost || requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProto || "https";
  const fallbackAppUrl = host ? `${protocol}://${host}` : "";
  const appUrl = Env.NEXT_PUBLIC_APP_URL || fallbackAppUrl;

  const inviteLink = code
    ? `${appUrl}/stakeholder-link?inviteCode=${encodeURIComponent(code)}`
    : "";

  const inviteQrDataUrl = code
    ? await QRCode.toDataURL(inviteLink || code, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: "M",
      })
    : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-6">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Dashboard stakeholder
        </h1>
        <p className="text-base text-muted-foreground">
          Pantau performa bisnis UMKM secara agregat tanpa melihat data
          transaksi mentah.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total omzet</CardDescription>
            <CardTitle>{formatCurrency(analytics.portfolioRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total pengeluaran</CardDescription>
            <CardTitle>{formatCurrency(analytics.portfolioExpense)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Arus kas bersih</CardDescription>
            <CardTitle>
              {formatCurrency(analytics.portfolioNetCashflow)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Rata-rata trust score</CardDescription>
            <CardTitle>{analytics.averageTrustScore ?? "Belum ada"}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate kode link</CardTitle>
            <CardDescription>
              Buat kode sekali pakai agar merchant bisa berbagi data agregat ke
              institusi Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                const result =
                  await createStakeholderInviteCodeAction(formData);
                redirect(`/stakeholder/dashboard?code=${result.code}`);
              }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="institutionName">Nama institusi</Label>
                <Input
                  id="institutionName"
                  name="institutionName"
                  defaultValue={analytics.institutionName}
                  placeholder="Contoh: Koperasi Mitra UMKM"
                />
              </div>
              <Button type="submit" className="h-12 w-full md:w-fit">
                Buat kode undangan
              </Button>
            </form>

            {code ? (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm text-muted-foreground">
                  Kode aktif terbaru
                </p>
                <p className="mt-1 text-3xl font-bold tracking-wide text-primary">
                  {code}
                </p>

                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                  {inviteQrDataUrl ? (
                    <img
                      src={inviteQrDataUrl}
                      alt="QR code undangan stakeholder"
                      className="size-40 rounded-lg border border-border bg-background p-2"
                    />
                  ) : null}

                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Merchant bisa scan QR ini untuk membuka halaman link
                      dengan kode terisi otomatis.
                    </p>
                    <p className="mt-2 truncate rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                      {inviteLink || code}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan validasi data</CardTitle>
            <CardDescription>
              Persentase rata-rata transaksi yang tervalidasi AI (VOICE/OCR).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-4xl font-bold text-foreground">
                {analytics.averageAiValidationRatio}%
              </p>
              <p className="text-sm text-muted-foreground">
                Rata-rata validasi AI portofolio
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              Data yang ditampilkan sudah difilter ke level agregat sesuai
              prinsip privasi.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Tren 6 bulan terakhir
        </h2>
        {analytics.monthlyTrend.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-130 text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">Bulan</th>
                  <th className="px-2 py-2">Omzet</th>
                  <th className="px-2 py-2">Pengeluaran</th>
                  <th className="px-2 py-2">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyTrend.map((item) => {
                  const delta = item.revenue - item.expense;
                  return (
                    <tr key={item.month} className="border-b border-border/60">
                      <td className="px-2 py-2 font-medium">{item.month}</td>
                      <td className="px-2 py-2">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-2 py-2">
                        {formatCurrency(item.expense)}
                      </td>
                      <td className="px-2 py-2">{formatCurrency(delta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada data transaksi dari merchant yang terhubung.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Daftar merchant terhubung
        </h2>
        {analytics.linkedBusinesses.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">UMKM</th>
                  <th className="px-2 py-2">Omzet</th>
                  <th className="px-2 py-2">Pengeluaran</th>
                  <th className="px-2 py-2">Arus kas</th>
                  <th className="px-2 py-2">Trust score</th>
                  <th className="px-2 py-2">AI ratio</th>
                </tr>
              </thead>
              <tbody>
                {analytics.linkedBusinesses.map((item) => (
                  <tr
                    key={item.businessId}
                    className="border-b border-border/60"
                  >
                    <td className="px-2 py-2 font-medium">
                      {item.businessName}
                    </td>
                    <td className="px-2 py-2">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                    <td className="px-2 py-2">
                      {formatCurrency(item.totalExpense)}
                    </td>
                    <td className="px-2 py-2">
                      {formatCurrency(item.netCashflow)}
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="secondary">
                        {item.trustScore ?? "N/A"}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="outline">{item.aiValidationRatio}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada merchant yang terhubung.
          </p>
        )}
      </section>
    </div>
  );
}
