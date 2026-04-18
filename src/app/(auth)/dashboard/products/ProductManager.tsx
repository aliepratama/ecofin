"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProduct, deleteProduct } from "./actions";
import { generateRecipeWithAI } from "./ai-actions";
import { Trash2, Wand2, Plus, X, Package, Utensils } from "lucide-react";
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

  const menus = products.filter((p) => !p.name.includes("[Bahan Baku]"));
  const bahanBaku = products.filter((p) => p.name.includes("[Bahan Baku]"));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateRecipe = async () => {
    if (!formData.name) {
      alert("Masukkan nama menu terlebih dahulu untuk di-generate resepnya.");
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateRecipeWithAI(formData.name);
      setRecipe(generated?.ingredients || []);
    } catch (error) {
      console.error(error);
      alert("Gagal mem-generate resep dari AI.");
    } finally {
      setIsGenerating(false);
    }
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
      };

      setProducts([newProduct, ...products]);
      setFormData({ name: "", price: "", currentStock: "", unit: "" });
      setRecipe(null);
    });
  };

  async function handleDelete(id: string) {
    if (!confirm("Hapus item ini?")) return;
    setProducts(products.filter((p) => p.id !== id));
    await deleteProduct(id);
  }

  return (
    <div className="space-y-6">
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
        <div className="lg:col-span-5">
          <Card>
            <CardHeader className="bg-card">
              <CardTitle>
                {activeTab === "menu"
                  ? "Tambah Menu Jualan"
                  : "Tambah Bahan Baku"}
              </CardTitle>
              <CardDescription>
                {activeTab === "menu"
                  ? "Ketik nama menu, lalu biarkan AI membuatkan daftar bahan bakunya."
                  : "Catat stok bahan mentah atau inventaris pendukung operasional."}
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

                {activeTab === "menu" && (
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateRecipe}
                      disabled={isGenerating || !formData.name}
                      className="w-full bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                    >
                      {isGenerating ? (
                        "Menganalisis..."
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Resep Otomatis (AI)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    Harga {activeTab === "menu" ? "Jual" : "Beli (Estimasi)"}
                  </Label>
                  <Input
                    type="number"
                    name="price"
                    min="0"
                    placeholder={
                      activeTab === "menu" ? "Contoh: 25000" : "Contoh: 15000"
                    }
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stok Awal</Label>
                    <Input
                      type="number"
                      name="currentStock"
                      min="0"
                      placeholder="0"
                      value={formData.currentStock}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      name="unit"
                      placeholder={
                        activeTab === "menu" ? "Porsi" : "Kg / Liter / Pcs"
                      }
                      value={formData.unit}
                      onChange={handleInputChange}
                    />
                  </div>
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
                      {recipe.map((ing, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center bg-background p-2 rounded border border-border text-sm shadow-sm group"
                        >
                          <span className="font-medium">{ing.ingredient}</span>
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
                        </li>
                      ))}
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
                      <p className="text-sm text-foreground/80 mt-1">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(parseFloat(p.price) || 0)}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            Number(p.currentStock) > 10
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : Number(p.currentStock) > 0
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          Stok: {p.currentStock}{" "}
                          {p.unit ||
                            (activeTab === "bahan_baku" ? "Kg" : "Porsi")}
                        </span>
                      </div>
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
