'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

type MonthlyAggregate = {
  month: string;
  revenue: number;
  expense: number;
};

type BusinessAggregate = {
  businessId: string;
  businessName: string;
  totalRevenue: number;
  totalExpense: number;
  netCashflow: number;
  transactionCount: number;
  aiValidationRatio: number;
  trustScore: number | null;
  monthlyTrend: MonthlyAggregate[];
};

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function LinkedBusinessesTable({
  businesses,
  minMediumTrustScore,
  minHighTrustScore,
}: {
  businesses: BusinessAggregate[];
  minMediumTrustScore: number;
  minHighTrustScore: number;
}) {
  const router = useRouter();

  if (businesses.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        Belum ada UMKM yang terhubung.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="relative w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-2 py-2">UMKM</th>
            <th className="px-2 py-2">Omzet</th>
            <th className="px-2 py-2">Pengeluaran</th>
            <th className="px-2 py-2">Arus kas bersih</th>
            <th className="px-2 py-2">Trust score</th>
            <th className="px-2 py-2">Kategori</th>
            <th className="px-2 py-2">Validasi AI</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((item) => {
            let categoryLabel = 'Lemah';
            let categoryColor = 'destructive';

            if (item.trustScore !== null) {
              if (item.trustScore >= minHighTrustScore) {
                categoryLabel = 'Dapat dipercaya';
                categoryColor = 'default';
              } else if (item.trustScore >= minMediumTrustScore) {
                categoryLabel = 'Menengah';
                categoryColor = 'secondary';
              }
            } else {
              categoryLabel = 'Sedang dikalkulasi';
              categoryColor = 'outline';
            }

            return (
              <tr
                key={item.businessId}
                className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50"
                onClick={() => {
                  router.push(`/stakeholder/dashboard/${item.businessId}`);
                }}
              >
                <td className="px-2 py-2 font-medium text-primary underline underline-offset-2">
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
                  <Badge variant="secondary">{item.trustScore ?? 'N/A'}</Badge>
                </td>
                <td className="px-2 py-2">
                  <Badge
                    variant={
                      categoryColor as
                        | 'default'
                        | 'destructive'
                        | 'outline'
                        | 'secondary'
                    }
                  >
                    {categoryLabel}
                  </Badge>
                </td>
                <td className="px-2 py-2">
                  <Badge variant="outline">{item.aiValidationRatio}%</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
