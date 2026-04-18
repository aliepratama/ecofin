import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/libs/supabase/server";
import { getStakeholderPortfolioAnalyticsAction } from "@/app/(stakeholder)/analytics/actions";
import { LinkedBusinessesTable } from "./LinkedBusinessesTable";

export default async function StakeholderDashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const analytics = await getStakeholderPortfolioAnalyticsAction();

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

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total UMKM terhubung</CardDescription>
            <CardTitle>{analytics.linkedBusinesses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Rata-rata trust score</CardDescription>
            <CardTitle>{analytics.averageTrustScore ?? "Belum ada"}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Daftar UMKM terhubung
        </h2>
        <LinkedBusinessesTable
          businesses={analytics.linkedBusinesses}
          minMediumTrustScore={analytics.minMediumTrustScore}
          minHighTrustScore={analytics.minHighTrustScore}
        />
      </section>
    </div>
  );
}
