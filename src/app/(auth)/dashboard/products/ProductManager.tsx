"use client";

import {
  Trash2,
  Wand2,
  Plus,
  X,
  Package,
  Utensils,
  ScanText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addProduct,
  deleteProduct,
  scanMenuFromImageAction,
  bulkAddProducts,
} from "./actions";
import { generateRecipeWithAI } from "./ai-actions";

type ProductType = {
  id: string;
  name: string;
  price: string;
  currentStock: number;
  unit: string | null;
  aiRecipe?: any;
};

export function ProductManager({
  initialProducts,
  priceHistoryData = {},
}: {
  initialProducts: ProductType[];
  priceHistoryData?: Record<
    string,
    {
      timeline: { date: string; price: number }[];
      typos: string[];
      delta: number;
    }
  >;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState<
    "menu" | "bahan_baku" | "operasional"
  >("menu");
  const [isLoading, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    currentStock: "",
    unit: "",
  });

  // AI Recipe State (for current menu)
  const [recipe, setRecipe] = useState<any[] | null>(null);

  // Bulk Add parsed State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMenus, setScannedMenus] = useState<any[] | null>(null);
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  const menus = products.filter(
    (p) =>
      !p.name.includes("[Bahan Baku]") && !p.name.includes("[Operasional]"),
  );
  const bahanBaku = products.filter((p) => p.name.includes("[Bahan Baku]"));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (activeTab !== "menu" || !formData.name || formData.name.length < 3) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsGenerating(true);
      try {
        const bahanBakuNames = bahanBaku.map((b) =>
          b.name.replace("[Bahan Baku] ", ""),
        );
        const generated = await generateRecipeWithAI(
          formData.name,
          bahanBakuNames,
        );
        if (generated?.ingredients) {
          setRecipe(generated.ingredients);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsGenerating(false);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [formData.name, activeTab, bahanBaku]);

  const handleAddIngredientToBahanBaku = async (ing: any) => {
    const isExists = bahanBaku.find(
      (b) =>
        b.name.replace("[Bahan Baku] ", "").toLowerCase() ===
        (ing.name ?? ing.ingredient).toLowerCase(),
    );
    if (isExists) {
      alert(`${ing.name ?? ing.ingredient} sudah ada di daftar bahan baku!`);
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.append("name", ing.name ?? ing.ingredient);
      form.append("price", "0");
      form.append("currentStock", "0");
      form.append("unit", ing.unit ?? "Gram");
      form.append("isRawMaterial", "true");

      const result = await addProduct(form);
      if (result?.error) {
        alert(result.error);
        return;
      }

      const newProduct: ProductType = {
        id: Date.now().toString(),
        name: `[Bahan Baku] ${ing.name ?? ing.ingredient}`,
        price: "0",
        currentStock: 0,
        unit: ing.unit ?? "Gram",
        aiRecipe: null,
      };
      setProducts([newProduct, ...products]);
      alert(
        `${ing.name ?? ing.ingredient} berhasil ditambahkan ke daftar Bahan Baku!`,
      );
    });
  };

  const handleRemoveIngredient = (index: number) => {
    if (recipe) {
      const newRecipe = [...recipe];
      newRecipe.splice(index, 1);
      setRecipe(newRecipe);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const form = new FormData(e.currentTarget);
      if (activeTab === "bahan_baku") {
        form.append("isRawMaterial", "true");
      } else if (activeTab === "operasional") {
        form.append("isOperasional", "true");
      }
      // AI Recipe
      if (recipe) {
        form.append("aiRecipe", JSON.stringify(recipe));
      }

      const result = await addProduct(form);
      if (result?.error) {
        alert(result.error);
        return;
      }

      // Reload is simpler to get actual IDs, but Optimistic:
      const finalName =
        activeTab === "bahan_baku"
          ? `[Bahan Baku] ${formData.name}`
          : formData.name;
      const newProduct: ProductType = {
        id: Date.now().toString(),
        name: finalName,
        price: formData.price,
        currentStock: Number(formData.currentStock) || 0,
        unit:
          formData.unit || (activeTab === "bahan_baku" ? "Kg/Liter" : "Porsi"),
        aiRecipe: activeTab === "menu" ? recipe : null,
      };

      setProducts([...products, newProduct]);

      setFormData({ name: "", price: "", currentStock: "", unit: "" });
      setRecipe(null);
      e.currentTarget.reset();
    });
  };

  async function handleDelete(id: string) {
    if (!confirm("Hapus item ini?")) {
      return;
    }
    setProducts(products.filter((p) => p.id !== id));
    await deleteProduct(id);
  }

  async function handleImageScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsScanning(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await scanMenuFromImageAction(fd);

      if (res.error) {
        alert(res.error);
        setScannedMenus(null);
      } else if (res.menus) {
        setScannedMenus(res.menus);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal scan gambar.");
    } finally {
      setIsScanning(false);
      e.target.value = ""; // reset
    }
  }

  async function confirmBulkAdd() {
    if (!scannedMenus || scannedMenus.length === 0) {
      return;
    }
    setIsBulkAdding(true);

    try {
      const res = await bulkAddProducts(scannedMenus);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Berhasil menambahkan banyak menu!");
        setScannedMenus(null);
        // hard refresh or optimistic update?
        // Let's do a hard window reload for absolute consistency after a bulk update since we don't have accurate IDs
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsBulkAdding(false);
    }
  }

  return (
    <div className="relative space-y-6">
      {/* Modal Konfirmasi Tambah Massal */}
      {scannedMenus !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Konfirmasi Menu dari Foto</h3>
              <button
                onClick={() => {
                  setScannedMenus(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              AI mendeteksi daftar menu berikut. Anda bisa mengedit nama atau
              harga sebelum disimpan.
            </p>

            <div className="mb-6 space-y-3">
              {scannedMenus.map((menu, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Input
                    value={menu.name}
                    onChange={(e) => {
                      const updated = [...scannedMenus];
                      updated[idx].name = e.target.value;
                      setScannedMenus(updated);
                    }}
                    placeholder="Nama Menu"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={menu.price}
                    onChange={(e) => {
                      const updated = [...scannedMenus];
                      updated[idx].price = Number.parseInt(e.target.value) || 0;
                      setScannedMenus(updated);
                    }}
                    placeholder="Harga"
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mb-0 text-destructive"
                    onClick={() => {
                      const updated = [...scannedMenus];
                      updated.splice(idx, 1);
                      setScannedMenus(updated);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed text-xs"
                onClick={() => {
                  setScannedMenus([
                    ...scannedMenus,
                    { name: "Menu Baru", price: 0 },
                  ]);
                }}
              >
                <Plus className="mr-2 h-3 w-3" />
                Tambah Baris Kosong
              </Button>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setScannedMenus(null);
                }}
                disabled={isBulkAdding}
              >
                Batal
              </Button>
              <Button
                onClick={confirmBulkAdd}
                disabled={isBulkAdding || scannedMenus.length === 0}
              >
                {isBulkAdding
                  ? "Menyimpan..."
                  : `Simpan ${scannedMenus.length} Menu`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex w-full max-w-md rounded-lg bg-muted p-1">
        <button
          onClick={() => {
            setActiveTab("menu");
            setRecipe(null);
            setFormData({ name: "", price: "", currentStock: "", unit: "" });
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
            activeTab === "menu"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Utensils className="h-4 w-4" />
          Menu Jualan
        </button>
        <button
          onClick={() => {
            setActiveTab("bahan_baku");
            setRecipe(null);
            setFormData({ name: "", price: "", currentStock: "", unit: "" });
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
            activeTab === "bahan_baku"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          Bahan Baku
        </button>
        <button
          onClick={() => {
            setActiveTab("operasional");
            setRecipe(null);
            setFormData({ name: "", price: "", currentStock: "", unit: "" });
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
            activeTab === "operasional"
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingDown className="h-4 w-4" />
          Operasional
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          {activeTab === "menu" && (
            <Card className="border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="text-sm font-bold text-primary">
                    Isi Semua Menu dari Foto
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload foto daftar menu untuk di-scan
                  </p>
                </div>
                <Label
                  htmlFor="scan-image"
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground hover:bg-primary/90"
                >
                  {isScanning ? (
                    "Scanning..."
                  ) : (
                    <>
                      <ScanText className="mr-2 h-4 w-4" />
                      Scan Menu
                    </>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    id="scan-image"
                    className="hidden"
                    onChange={handleImageScan}
                    disabled={isScanning}
                  />
                </Label>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader className="bg-card">
              <CardTitle>
                {activeTab === "menu"
                  ? "Tambah Menu Jualan Otomatis (AI)"
                  : activeTab === "bahan_baku"
                    ? "Tambah Bahan Baku Manual"
                    : "Tambah Operasional Manual"}
              </CardTitle>
              <CardDescription>
                {activeTab === "menu"
                  ? "Ketik nama menu, lalu biarkan AI membuatkan daftar bahan bakunya."
                  : activeTab === "bahan_baku"
                    ? "Catat bahan mentah sebagai acuan resep dan pencatatan pengeluaran."
                    : "Catat tagihan operasional seperti Sewa, Listrik, Gas, Transportasi."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Nama{" "}
                    {activeTab === "menu"
                      ? "Menu"
                      : activeTab === "bahan_baku"
                        ? "Bahan Baku"
                        : "Operasional"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      name="name"
                      placeholder={
                        activeTab === "menu"
                          ? "Contoh: Nasi Goreng Spesial"
                          : activeTab === "bahan_baku"
                            ? "Contoh: Beras Premium"
                            : "Contoh: Tagihan Listrik / Gas"
                      }
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {activeTab === "menu" && isGenerating && (
                  <div className="flex animate-pulse items-center justify-center rounded-md border border-primary/20 bg-primary/5 p-2 text-sm text-primary">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Memprediksi Resep (AI)...
                  </div>
                )}

                {activeTab === "menu" ? (
                  <div className="space-y-2">
                    <Label>Harga Jual</Label>
                    <Input
                      type="number"
                      name="price"
                      min="0"
                      placeholder="Contoh: 25000"
                      required
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <input type="hidden" name="price" value="0" />
                )}

                <div className="space-y-2">
                  <Label>Unit / Satuan Acuan</Label>
                  {activeTab === "menu" ? (
                    <select
                      name="unit"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.unit || "Porsi"}
                      onChange={(e) => {
                        setFormData({ ...formData, unit: e.target.value });
                      }}
                    >
                      <option value="Porsi">Porsi</option>
                      <option value="Gelas">Gelas</option>
                    </select>
                  ) : activeTab === "bahan_baku" ? (
                    <select
                      name="unit"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.unit || "Gram"}
                      onChange={(e) => {
                        setFormData({ ...formData, unit: e.target.value });
                      }}
                    >
                      <option value="Gram">Gram</option>
                      <option value="Kg">Kg</option>
                      <option value="Liter">Liter</option>
                      <option value="Ml">Ml</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                    </select>
                  ) : (
                    <select
                      name="unit"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.unit || "Bulan"}
                      onChange={(e) => {
                        setFormData({ ...formData, unit: e.target.value });
                      }}
                    >
                      <option value="Bulan">Per Bulan</option>
                      <option value="Tahun">Per Tahun</option>
                      <option value="Lembar">Lembar / Pcs</option>
                      <option value="Hari">Harian</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  )}
                </div>

                {/* AI Recipe Section */}
                {activeTab === "menu" && recipe && (
                  <div className="mt-4 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center text-sm font-semibold text-primary">
                        <Wand2 className="mr-1.5 h-4 w-4" />
                        Estimasi Bahan Baku (1 Porsi)
                      </h4>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                        AI Generated
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {recipe.map((ing, idx) => {
                        const ingredientName = ing.name ?? ing.ingredient;
                        const isNew = !bahanBaku.some(
                          (b) =>
                            b.name
                              .replace("[Bahan Baku] ", "")
                              .toLowerCase() === ingredientName.toLowerCase(),
                        );

                        return (
                          <li
                            key={idx}
                            className="group flex flex-col gap-2 rounded border border-border bg-background p-2 text-sm shadow-sm"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="flex items-center gap-2 font-medium">
                                {ingredientName}
                                {isNew && (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-yellow-800 uppercase dark:bg-yellow-900/30 dark:text-yellow-400">
                                    Baru
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="rounded bg-muted px-2 py-1 text-xs">
                                  {ing.amount} {ing.unit}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRemoveIngredient(idx);
                                  }}
                                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {isNew && (
                              <button
                                type="button"
                                onClick={async () =>
                                  handleAddIngredientToBahanBaku(ing)
                                }
                                className="w-fit rounded bg-primary/10 px-2 py-1.5 text-left text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                              >
                                + Simpan ke Bahan Baku (Klik 1x)
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="text-xs text-muted-foreground italic">
                      Daftar bahan di atas otomatis akan disimpan. Hapus yang
                      tidak perlu.
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Simpan {activeTab === "menu" ? "Menu" : "Bahan Baku"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <div className="h-full w-full rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h3 className="text-xl font-bold">
                Daftar {activeTab === "menu" ? "Menu Jualan" : "Bahan Baku"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Semua item aktif di inventaris Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {(activeTab === "menu" ? menus : bahanBaku).length === 0 ? (
                <div className="col-span-full rounded-lg border-2 border-dashed border-border bg-muted/30 py-12 text-center text-muted-foreground">
                  <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p>
                    Belum ada {activeTab === "menu" ? "menu" : "bahan baku"}.
                  </p>
                  <p className="mt-1 text-sm">
                    Silakan tambahkan di sebelah kiri.
                  </p>
                </div>
              ) : (
                (activeTab === "menu" ? menus : bahanBaku).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between rounded-xl border border-border bg-background p-4 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div>
                      <p className="text-lg leading-tight font-bold">
                        {p.name.replace("[Bahan Baku] ", "")}
                      </p>
                      {activeTab === "menu" && (
                        <p className="mt-1 text-sm text-foreground/80">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(Number.parseFloat(p.price) || 0)}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Satuan Acuan:{" "}
                          {p.unit ??
                            (activeTab === "bahan_baku" ? "Kg" : "Porsi")}
                        </span>
                      </div>{" "}
                      {activeTab === "bahan_baku" &&
                        priceHistoryData[p.id] &&
                        (() => {
                          const hist = priceHistoryData[p.id]!;
                          return (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <p className="mb-2 text-xs font-semibold text-muted-foreground flex justify-between items-center">
                                History Harga (per satuan)
                                {hist.delta !== 0 && (
                                  <span
                                    className={`flex items-center gap-1 ${hist.delta > 0 ? "text-destructive" : "text-green-600"}`}
                                  >
                                    {hist.delta > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {new Intl.NumberFormat("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                    }).format(Math.abs(hist.delta))}
                                  </span>
                                )}
                              </p>
                              <div className="h-[60px] w-full mt-1">
                                {hist.timeline.length > 1 ? (
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <LineChart data={hist.timeline}>
                                      <YAxis domain={["auto", "auto"]} hide />
                                      <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke={
                                          hist.delta > 0 ? "#ef4444" : "#16a34a"
                                        }
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        isAnimationActive={false}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic h-full flex items-center">
                                    Data history belum cukup untuk grafik.
                                  </p>
                                )}
                              </div>
                              {hist.typos.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                                    Dikenali juga sebagai OCR (Aliasses):
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {hist.typos.map((typo, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground border border-border"
                                      >
                                        {typo}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}{" "}
                      {activeTab === "menu" &&
                        Array.isArray(p.aiRecipe) &&
                        p.aiRecipe.length > 0 && (
                          <div className="mt-3 text-xs text-muted-foreground">
                            <p className="mb-1 font-semibold">
                              Bahan Baku (1 porsi):
                            </p>
                            <ul className="list-disc space-y-1 pl-4">
                              {p.aiRecipe.map((ing: any, i: number) => (
                                <li key={i}>
                                  {ing.name ?? ing.ingredient} ({ing.amount}{" "}
                                  {ing.unit})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}{" "}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <button
                        onClick={async () => handleDelete(p.id)}
                        className="rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10"
                        title="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
