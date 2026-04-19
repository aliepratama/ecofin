import { and, eq, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { businesses, transactions } from '@/models/Schema';

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activeBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, user.id),
  });

  if (!activeBusiness) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const txRows = await db.query.transactions.findMany({
    where: and(
      eq(transactions.businessId, activeBusiness.id),
      gte(transactions.date, twelveMonthsAgo)
    ),
    orderBy: (table, { asc }) => [asc(table.date)],
  });

  const monthlyMap = new Map<string, { income: number; expense: number }>();

  for (const tx of txRows) {
    const txDate = new Date(tx.date);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyMap.get(monthKey) ?? { income: 0, expense: 0 };
    const amount = Number(tx.totalAmount);

    if (tx.type === 'INCOME') {
      current.income += amount;
    } else {
      current.expense += amount;
    }

    monthlyMap.set(monthKey, current);
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const summary of monthlyMap.values()) {
    totalIncome += summary.income;
    totalExpense += summary.expense;
  }
  const netProfit = totalIncome - totalExpense;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (
    text: string,
    y: number,
    opts?: { size?: number; bold?: boolean; color?: [number, number, number] }
  ) => {
    page.drawText(text, {
      x: 50,
      y,
      size: opts?.size ?? 11,
      font: opts?.bold ? fontBold : font,
      color: rgb(
        opts?.color?.[0] ?? 0,
        opts?.color?.[1] ?? 0,
        opts?.color?.[2] ?? 0
      ),
    });
  };

  drawText('Laporan Ringkas KUR UMKM', 800, {
    size: 18,
    bold: true,
    color: [0, 0.19, 0.53],
  });
  drawText(`Nama usaha: ${activeBusiness.name}`, 775, { size: 12, bold: true });
  drawText(
    `Periode: ${twelveMonthsAgo.toLocaleDateString('id-ID')} - ${now.toLocaleDateString('id-ID')}`,
    758
  );

  drawText('Ringkasan', 728, { size: 13, bold: true });
  drawText(`Total pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`, 708);
  drawText(
    `Total pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`,
    690
  );
  drawText(`Laba bersih: Rp ${netProfit.toLocaleString('id-ID')}`, 672, {
    bold: true,
    color: netProfit >= 0 ? [0.1, 0.5, 0.2] : [0.8, 0.2, 0.2],
  });

  drawText('Detail per bulan', 640, { size: 13, bold: true });

  let cursorY = 620;
  const sortedEntries = [...monthlyMap.entries()].toSorted((a, b) =>
    a[0].localeCompare(b[0])
  );

  if (sortedEntries.length === 0) {
    drawText('Belum ada transaksi dalam periode 12 bulan terakhir.', cursorY);
  } else {
    for (const [month, summary] of sortedEntries) {
      if (cursorY < 80) {
        break;
      }

      const monthlyProfit = summary.income - summary.expense;
      drawText(
        `${month} | Masuk: Rp ${summary.income.toLocaleString('id-ID')} | Keluar: Rp ${summary.expense.toLocaleString('id-ID')} | Laba: Rp ${monthlyProfit.toLocaleString('id-ID')}`,
        cursorY,
        { size: 10 }
      );
      cursorY -= 18;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const fileName = `laporan-kur-${activeBusiness.name.toLowerCase().replaceAll(/\s+/g, '-')}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
