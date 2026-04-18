"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addProduct,
  deleteProduct,
  scanMenuFromImageAction,
  bulkAddProducts,
} from "./actions";
import { generateRecipeWithAI } from "./ai-actions";
import {
  Trash2,
  Wand2,
  Plus,
  X,
  Package,
  Utensils,
  ScanText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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
}: {
  initialProducts: ProductType[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState<"menu" | "bahan_baku">("menu");
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

  const menus = products.filter((p) => !p.name.includes("[Bahan Baku]"));
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

    return () => clearTimeout(timer);
  }, [formData.name, activeTab, bahanBaku]);

  const handleAddIngredientToBahanBaku = async (ing: any) => {
    const isExists = bahanBaku.find(
      (b) =>
        b.name.replace("[Bahan Baku] ", "").toLowerCase() ===
        (ing.name || ing.ingredient).toLowerCase(),
    );
    if (isExists) {
      alert(`${ing.name || ing.ingredient} sudah ada di daftar bahan baku!`);
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.append("name", ing.name || ing.ingredient);
      form.append("price", "0");
      form.append("currentStock", "0");
      form.append("unit", ing.unit || "Gram");
      form.append("isRawMaterial", "true");

      const result = await addProduct(form);
      if (result?.error) {
        alert(result.error);
        return;
      }

      const newProduct: ProductType = {
        id: Date.now().toString(),
        name: `[Bahan Baku] ${ing.name || ing.ingredient}`,
        price: "0",
        currentStock: 0,
        unit: ing.unit || "Gram",
        aiRecipe: null,
      };
      setProducts([newProduct, ...products]);
      alert(
        `${ing.name || ing.ingredient} berhasil ditambahkan ke daftar Bahan Baku!`,
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
    if (!confirm("Hapus item ini?")) return;
    setProducts(products.filter((p) => p.id !== id));
    await deleteProduct(id);
  }

  async function handleImageScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
    } catch (err) {
      console.error(err);
      alert("Gagal scan gambar.");
    } finally {
      setIsScanning(false);
      e.target.value = ""; // reset
    }
  }

  async function confirmBulkAdd() {
    if (!scannedMenus || scannedMenus.length === 0) return;
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
    <div className="space-y-6 relative">
      {/* Modal Konfirmasi Tambah Massal */}
      {scannedMenus !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Konfirmasi Menu dari Foto</h3>
              <button
                onClick={() => setScannedMenus(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI mendeteksi daftar menu berikut. Anda bisa mengedit nama atau
              harga sebelum disimpan.
            </p>

            <div className="space-y-3 mb-6">
              {scannedMenus.map((menu, idx) => (
                <div key={idx} className="flex gap-3 items-center">
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
                      updated[idx].price = parseInt(e.target.value) || 0;
                      setScannedMenus(updated);
                    }}
                    placeholder="Harga"
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive mb-0"
                    onClick={() => {
                      const updated = [...scannedMenus];
                      updated.splice(idx, 1);
                      setScannedMenus(updated);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full text-xs border-dashed"
                onClick={() =>
                  setScannedMenus([
                    ...scannedMenus,
                    { name: "Menu Baru", price: 0 },
                  ])
                }
              >
                <Plus className="w-3 h-3 mr-2" />
                Tambah Baris Kosong
              </Button>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setScannedMenus(null)}
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
      <div className="flex bg-muted p-1 rounded-lg w-full max-w-md">
        <button
          onClick={() => {
            setActiveTab("menu");
            setRecipe(null);
            setFormData({ name: "", price: "", currentStock: "", unit: "" });
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "menu"
              ? "bg-background shadow-sm text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Utensils className="w-4 h-4" />
          Menu Jualan
        </button>
        <button
          onClick={() => {
            setActiveTab("bahan_baku");
            setRecipe(null);
            setFormData({ name: "", price: "", currentStock: "", unit: "" });
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "bahan_baku"
              ? "bg-background shadow-sm text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="w-4 h-4" />
          Bahan Baku
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          {activeTab === "menu" && (
            <Card className="bg-primary/5 border border-primary/20">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-primary">
                    Isi Semua Menu dari Foto
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload foto daftar menu untuk di-scan
                  </p>
                </div>
                <Label
                  htmlFor="scan-image"
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2"
                >
                  {isScanning ? (
                    "Scanning..."
                  ) : (
                    <>
                      <ScanText className="w-4 h-4 mr-2" />
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
                  : "Tambah Bahan Baku Manual"}
              </CardTitle>
              <CardDescription>
                {activeTab === "menu"
                  ? "Ketik nama menu, lalu biarkan AI membuatkan daftar bahan bakunya."
                  : "Catat bahan mentah sebagai acuan resep dan pencatatan pengeluaran."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Nama {activeTab === "menu" ? "Menu" : "Bahan Baku"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      name="name"
                      placeholder={
                        activeTab === "menu"
                          ? "Contoh: Nasi Goreng Spesial"
                          : "Contoh: Beras Premium"
                      }
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {activeTab === "menu" && isGenerating && (
                  <div className="flex items-center justify-center p-2 text-sm text-primary animate-pulse bg-primary/5 rounded-md border border-primary/20">
                    <Wand2 className="w-4 h-4 mr-2" />
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
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.unit || "Porsi"}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                    >
                      <option value="Porsi">Porsi</option>
                      <option value="Gelas">Gelas</option>
                    </select>
                  ) : (
                    <select
                      name="unit"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.unit || "Gram"}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                    >
                      <option value="Gram">Gram</option>
                      <option value="Kg">Kg</option>
                      <option value="Liter">Liter</option>
                      <option value="Ml">Ml</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                    </select>
                  )}
                </div>

                {/* AI Recipe Section */}
                {activeTab === "menu" && recipe && (
                  <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-primary flex items-center">
                        <Wand2 className="w-4 h-4 mr-1.5" />
                        Estimasi Bahan Baku (1 Porsi)
                      </h4>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        AI Generated
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {recipe.map((ing, idx) => {
                        const ingredientName = ing.name || ing.ingredient;
                        const isNew = !bahanBaku.find(
                          (b) =>
                            b.name
                              .replace("[Bahan Baku] ", "")
                              .toLowerCase() === ingredientName.toLowerCase(),
                        );

                        return (
                          <li
                            key={idx}
                            className="flex flex-col gap-2 bg-background p-2 rounded border border-border text-sm shadow-sm group"
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-medium flex items-center gap-2">
                                {ingredientName}
                                {isNew && (
                                  <span className="text-[10px] bg-amber-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Baru
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {ing.amount} {ing.unit}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredient(idx)}
                                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {isNew && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddIngredientToBahanBaku(ing)
                                }
                                className="w-fit text-[11px] text-primary font-medium hover:bg-primary/20 bg-primary/10 px-2 py-1.5 rounded transition-colors text-left"
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
                      <Plus className="w-4 h-4 mr-2" />
                      Simpan {activeTab === "menu" ? "Menu" : "Bahan Baku"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-card w-full h-full rounded-xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold text-xl">
                Daftar {activeTab === "menu" ? "Menu Jualan" : "Bahan Baku"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Semua item aktif di inventaris Anda.
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeTab === "menu" ? menus : bahanBaku).length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/30">
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>
                    Belum ada {activeTab === "menu" ? "menu" : "bahan baku"}.
                  </p>
                  <p className="text-sm mt-1">
                    Silakan tambahkan di sebelah kiri.
                  </p>
                </div>
              ) : (
                (activeTab === "menu" ? menus : bahanBaku).map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-start p-4 bg-background border border-border shadow-sm rounded-xl hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-lg leading-tight">
                        {p.name.replace("[Bahan Baku] ", "")}
                      </p>
                      {activeTab === "menu" && (
                        <p className="text-sm text-foreground/80 mt-1">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(parseFloat(p.price) || 0)}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          Satuan Acuan:{" "}
                          {p.unit ||
                            (activeTab === "bahan_baku" ? "Kg" : "Porsi")}
                        </span>
                      </div>
                      {activeTab === "menu" &&
                        Array.isArray(p.aiRecipe) &&
                        p.aiRecipe.length > 0 && (
                          <div className="mt-3 text-xs text-muted-foreground">
                            <p className="font-semibold mb-1">
                              Bahan Baku (1 porsi):
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              {p.aiRecipe.map((ing: any, i: number) => (
                                <li key={i}>
                                  {ing.name || ing.ingredient} ({ing.amount}{" "}
                                  {ing.unit})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}{" "}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Hapus item"
                      >
                        <Trash2 className="w-4 h-4" />
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
