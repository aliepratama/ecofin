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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { saveProductionPlan } from "./actions";
import {
  CalendarDays,
  Save,
  Utensils,
  Info,
  Activity,
  Plus,
} from "lucide-react";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [targetPorsi, setTargetPorsi] = useState("");

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
      alert("Semua rencana masak berhasil diperbarui!");
    });
  };

  const handleAddPlan = () => {
    if (!selectedProductId || !targetPorsi) return;
    const val = parseInt(targetPorsi, 10);
    if (isNaN(val) || val <= 0) return;

    handlePlanChange(selectedProductId, val.toString());

    startTransition(async () => {
      const dateStr = format(date, "yyyy-MM-dd");
      await saveProductionPlan(dateStr, selectedProductId, val);
      router.refresh();
      setIsModalOpen(false);
      setSelectedProductId("");
      setTargetPorsi("");
      alert("Rencana masak berhasil ditambahkan!");
    });
  };

  const activePlans = initialData.filter(
    (item) => (plans[item.id] ?? item.planned) > 0 || item.sold > 0,
  );

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
            Manage Rencana Masak
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Rencana
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isPending}
              className="shadow-sm"
            >
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
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Buat Rencana Masak Baru</DialogTitle>
              <DialogDescription>
                Pilih menu yang belum direncanakan di hari ini beserta target
                porsinya.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pilih Menu</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="" disabled>
                    Pilih Menu...
                  </option>
                  {initialData
                    .filter(
                      (item) =>
                        (plans[item.id] ?? item.planned) === 0 &&
                        item.sold === 0,
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Jumlah Porsi</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Misal: 50"
                  value={targetPorsi}
                  onChange={(e) => setTargetPorsi(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button
                onClick={handleAddPlan}
                disabled={!selectedProductId || !targetPorsi || isPending}
              >
                {isPending ? "Menyimpan..." : "Tambahkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              {activePlans.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Belum ada rencana masak. Klik "Tambah Rencana" untuk
                    memulai.
                  </td>
                </tr>
              )}
              {activePlans.map((item) => {
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
