"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { saveProductionPlan } from "./actions";
import { CalendarDays, Save, Utensils, Info, Activity } from "lucide-react";

type ProductPlan = {
  id: string;
  name: string;
  price: string;
  planned: number;
  sold: number;
  remaining: number;
};

export function ProductionManager({
  initialData,
  initialDate,
}: {
  initialData: ProductPlan[];
  initialDate: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date(initialDate));
  const [plans, setPlans] = useState<Record<string, number>>(
    initialData.reduce(
      (acc, curr) => ({ ...acc, [curr.id]: curr.planned }),
      {},
    ),
  );
  const [isPending, startTransition] = useTransition();

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    setDate(newDate);
    // Localize the format back to YYYY-MM-DD
    const dateQuery = format(newDate, "yyyy-MM-dd");
    router.push(`/dashboard/produksi?date=${dateQuery}`);
  };

  const handlePlanChange = (productId: string, val: string) => {
    const planned = parseInt(val, 10);
    setPlans((prev) => ({
      ...prev,
      [productId]: isNaN(planned) ? 0 : planned,
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const dateStr = format(date, "yyyy-MM-dd");
      for (const product of initialData) {
        const plannedValue = plans[product.id];
        if (plannedValue !== undefined && plannedValue !== product.planned) {
          await saveProductionPlan(dateStr, product.id, plannedValue);
        }
      }
      router.refresh();
      alert("Rencana masak berhasil disimpan!");
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm max-w-sm">
        <CardContent className="p-4 pt-6">
          <Label className="text-muted-foreground font-medium flex items-center mb-2 text-xs uppercase tracking-wider">
            <CalendarDays className="w-4 h-4 mr-2" />
            Pilih Tanggal Rencana
          </Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    "flex items-center w-full justify-start text-left font-normal border border-input rounded-md px-3 h-12 bg-background",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "PPP", { locale: idLocale })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
                locale={idLocale}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <div className="bg-primary/5 border border-primary/20 text-primary-foreground p-4 rounded-xl flex items-start gap-4">
        <div className="bg-primary/20 p-2 rounded-full mt-0.5">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-bold text-primary">Informasi</h4>
          <p className="text-sm text-primary/80 mt-1">
            "Target Masak" adalah porsi yang Anda sediakan di etalase/dapur hari
            ini. Kolom "Terjual" akan naik otomatis saat terjadi transaksi
            (Pemasukan).
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center sm:px-6">
          <h2 className="font-bold text-lg flex items-center">
            <Utensils className="w-5 h-5 mr-2 text-muted-foreground" />
            Daftar Menu Makanan
          </h2>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Plan
              </>
            )}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Menu</th>
                <th className="px-6 py-4 font-semibold text-center w-36">
                  Target Masak (Porsi)
                </th>
                <th className="px-6 py-4 font-semibold text-center">Terjual</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Estimasi Sisa
                </th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialData.map((item) => {
                const currentPlanned = plans[item.id] ?? item.planned;
                const isSoldOut =
                  currentPlanned > 0 && item.sold >= currentPlanned;
                const sisa = Math.max(0, currentPlanned - item.sold);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-base text-foreground">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={plans[item.id] || ""}
                        onChange={(e) =>
                          handlePlanChange(item.id, e.target.value)
                        }
                        className="w-full text-center font-bold"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center text-lg font-bold">
                        {item.sold}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-lg font-bold ${sisa === 0 && currentPlanned > 0 ? "text-destructive" : "text-foreground"}`}
                      >
                        {sisa}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.planned === 0 && currentPlanned === 0 ? (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                          Libur / Kosong
                        </span>
                      ) : isSoldOut ? (
                        <span className="text-xs border-destructive text-destructive border px-2 py-1 rounded-full font-medium">
                          Habis (Sold Out)
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium flex items-center justify-end w-fit ml-auto">
                          <Activity className="w-3 h-3 mr-1" />
                          Tersedia
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {initialData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    Belum ada menu yang didaftarkan. Tambahkan menu di halaman
                    Produk & Bahan Baku.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
