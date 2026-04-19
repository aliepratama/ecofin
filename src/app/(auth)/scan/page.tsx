"use client";

import { Camera, ImagePlus, RefreshCw, Trash2, Plus } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { getCurrentLocation } from "@/utils/Geolocation";
import {
  extractReceiptAction,
  processReceiptAction,
  type ParsedReceiptData,
} from "./actions";
import { getBahanBakuList } from "./getBahanBaku";

export default function ScanReceiptPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loc, setLoc] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const [extractedData, setExtractedData] = useState<ParsedReceiptData | null>(
    null,
  );

  const [bahanBakuOptions, setBahanBakuOptions] = useState<
    { id: string; name: string; price: number; unit: string }[]
  >([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getBahanBakuList().then((data) => setBahanBakuOptions(data));
  }, []);

  useEffect(() => {
    void getCurrentLocation().then((data) => {
      if (data.latitude && data.longitude) {
        setLoc({ lat: data.latitude, lng: data.longitude });
      }
    });

    void startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
      setPreview(null);
      setCapturedBlob(null);
    } catch (error) {
      console.error("Camera error:", error);
      setCameraActive(false);
      setCameraError("Gagal mengakses kamera. Silakan gunakan opsi upload.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const takePhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context && video.videoWidth && video.videoHeight) {
        const MAX_DIM = 1200;
        let targetW = video.videoWidth;
        let targetH = video.videoHeight;

        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
          targetW = targetW * ratio;
          targetH = targetH * ratio;
        }

        canvas.width = targetW;
        canvas.height = targetH;
        context.drawImage(video, 0, 0, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCapturedBlob(blob);
              setPreview(URL.createObjectURL(blob));
              stopCamera();
            }
          },
          "image/jpeg",
          0.7,
        );
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Ukuran gambar terlalu besar. Maksimal 5MB untuk OCR.");
      } else {
        setErrorMessage(null);
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      setCapturedBlob(file);
      setExtractedData(null);
      stopCamera();
    }
  };

  const retakePhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPreview(null);
    setCapturedBlob(null);
    setExtractedData(null);
    void startCamera();
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    if (!extractedData) return;
    const items = [...extractedData.items];
    const item = items[index];
    if (!item) return;

    if (field === "name") item.name = value as string;
    if (field === "quantity") item.quantity = Math.max(1, Number(value));
    if (field === "price") item.price = Math.max(0, Number(value));

    // Auto update subtotal
    if (field === "quantity" || field === "price") {
      item.subtotal = item.quantity * item.price;
    }

    // Auto update total Amount
    const totalAmount = items.reduce((acc, curr) => acc + curr.subtotal, 0);

    setExtractedData({ ...extractedData, items, totalAmount });
  };

  const removeItem = (index: number) => {
    if (!extractedData) return;
    const items = extractedData.items.filter((_, i) => i !== index);
    const totalAmount = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    setExtractedData({ ...extractedData, items, totalAmount });
  };

  const addItem = () => {
    if (!extractedData) return;
    const items = [
      ...extractedData.items,
      { name: "", quantity: 1, price: 0, subtotal: 0 },
    ];
    setExtractedData({ ...extractedData, items });
  };

  const onConfirmSave = async () => {
    if (!extractedData) return;
    setIsSubmitting(true);
    try {
      await processReceiptAction(
        extractedData,
        loc.lat ? loc.lat.toString() : null,
        loc.lng ? loc.lng.toString() : null,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menyimpan receipt.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasUnmappedItems =
    extractedData?.items.some(
      (item) =>
        item.name && !bahanBakuOptions.some((b) => b.name === item.name),
    ) || false;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-5 shadow-sm sm:px-6">
        <div className="flex items-center space-x-3">
          <a
            href="/dashboard"
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </a>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Scan nota</h1>
            <p className="mt-1 text-base text-muted-foreground">
              Foto struk Anda agar AI otomatis mencatat
            </p>
          </div>
        </div>
        <Image
          src="/logo.png"
          alt="Ecofin Logo"
          width={32}
          height={32}
          className="object-contain"
        />
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24 sm:px-6">
        {extractedData ? (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Konfirmasi Data Nota</h2>
            {errorMessage ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex flex-1 flex-col">
                  <span className="mb-1 text-sm font-medium">
                    Tipe Transaksi
                  </span>
                  <div className="rounded-lg border border-border p-2 bg-muted text-muted-foreground outline-none font-medium cursor-not-allowed">
                    Belanja Bahan Baku (Pengeluaran)
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold border-b pb-2">Daftar Barang</h3>
                {extractedData.items.map((item, i) => {
                  const isError = item.name
                    ? !bahanBakuOptions.some((b) => b.name === item.name)
                    : false;

                  return (
                    <div
                      key={i}
                      className={`flex flex-wrap gap-2 items-end border-b pb-4 relative pr-10 transition-colors ${
                        isError
                          ? "bg-destructive/10 -mx-3 px-3 pt-3 rounded-lg border-destructive/30 border"
                          : "pt-1"
                      }`}
                    >
                      {isError && (
                        <div className="w-full text-xs font-semibold text-destructive flex items-center mb-1">
                          ⚠️ &quot;{item.name}&quot; belum terdaftar.
                        </div>
                      )}
                      <label className="flex w-full sm:flex-1 flex-col">
                        <span
                          className={`mb-1 text-[11px] font-medium uppercase tracking-wider ${isError ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          Bahan Baku
                        </span>
                        <select
                          className={`rounded-lg border p-2 text-sm bg-background outline-none transition-colors ${
                            isError
                              ? "border-destructive ring-1 ring-destructive/20 focus:border-destructive"
                              : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
                          }`}
                          value={
                            bahanBakuOptions.find((b) => b.name === item.name)
                              ?.name || ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__ADD_NEW__") {
                              setNewItemName(item.name || "");
                              setNewItemPrice(
                                item.price ? item.price.toString() : "",
                              );
                              setEditingItemIndex(i);
                              setIsAddModalOpen(true);
                            } else if (val) {
                              const selectedBahan = bahanBakuOptions.find(
                                (b) => b.name === val,
                              );
                              if (selectedBahan) {
                                setExtractedData((prev) => {
                                  if (!prev) return prev;
                                  const newItems = [...prev.items];
                                  const currentItem = newItems[i];
                                  if (currentItem) {
                                    currentItem.name = selectedBahan.name;
                                  }
                                  return { ...prev, items: newItems };
                                });
                              }
                            }
                          }}
                        >
                          <option value="" disabled>
                            -- Pilih dari daftar --
                          </option>
                          {bahanBakuOptions.map((bahan) => (
                            <option key={bahan.id} value={bahan.name}>
                              {bahan.name} {bahan.unit ? `(${bahan.unit})` : ""}
                            </option>
                          ))}
                          <option
                            value="__ADD_NEW__"
                            className="font-semibold text-primary"
                          >
                            + Tambah Bahan Baku Baru...
                          </option>
                        </select>
                      </label>
                      <label className="flex w-[90px] flex-col">
                        <span className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap overflow-visible">
                          Jml{" "}
                          {item.name &&
                          bahanBakuOptions.find((b) => b.name === item.name)
                            ?.unit
                            ? `(${bahanBakuOptions.find((b) => b.name === item.name)?.unit})`
                            : item.unit
                              ? `(${item.unit})`
                              : ""}
                        </span>
                        <input
                          type="number"
                          min="1"
                          className={`rounded-lg border p-2 text-sm bg-background outline-none transition-colors ${isError ? "border-destructive/30 focus:border-destructive" : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"}`}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(i, "quantity", e.target.value)
                          }
                        />
                      </label>
                      <label className="flex w-full sm:flex-[0.8] flex-col">
                        <span className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Harga Satuan
                        </span>
                        <input
                          type="number"
                          min="0"
                          className={`rounded-lg border p-2 text-sm bg-background outline-none transition-colors ${isError ? "border-destructive/30 focus:border-destructive" : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"}`}
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(i, "price", e.target.value)
                          }
                        />
                      </label>

                      {isError && (
                        <div className="w-full flex mt-2">
                          <button
                            type="button"
                            className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg shadow-sm hover:bg-destructive/90 text-xs font-semibold w-full transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              setNewItemName(item.name);
                              setNewItemPrice(
                                item.price ? item.price.toString() : "",
                              );
                              setEditingItemIndex(i);
                              setIsAddModalOpen(true);
                            }}
                          >
                            Daftarkan &quot;{item.name}&quot; Sekarang
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className={`absolute right-0 ${isError ? "top-10" : "top-6"} text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors border border-transparent hover:border-destructive/30`}
                        title="Hapus Item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full flex items-center justify-center p-3 rounded-lg border border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors gap-2 text-sm font-semibold opacity-80 hover:opacity-100"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Barang Lainnya
                </button>
              </div>

              <div className="pt-4 flex justify-between items-center bg-muted/50 p-4 rounded-xl border border-border">
                <span className="font-semibold">Total Subtotal Transaksi</span>
                <span className="font-bold text-lg">
                  Rp{extractedData.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={onConfirmSave}
                disabled={
                  isSubmitting ||
                  extractedData.items.length === 0 ||
                  hasUnmappedItems
                }
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : hasUnmappedItems
                    ? "Selesaikan Data Merah Dulu"
                    : "Konfirmasi & Simpan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExtractedData(null);
                  setPreview(null);
                  setCapturedBlob(null);
                  void startCamera();
                }}
                disabled={isSubmitting}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Batal & Scan Ulang
              </button>
            </div>
          </div>
        ) : (
          <form
            action={async (formData) => {
              setIsScanning(true);
              setErrorMessage(null);
              try {
                if (loc.lat) {
                  formData.append("latitude", loc.lat.toString());
                }
                if (loc.lng) {
                  formData.append("longitude", loc.lng.toString());
                }
                if (capturedBlob) {
                  formData.set("receipt", capturedBlob, "receipt-capture.jpg");
                }
                const result = await extractReceiptAction(formData);
                setExtractedData(result);
              } catch (error) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : "Terjadi kendala saat membaca nota.",
                );
              } finally {
                setIsScanning(false);
              }
            }}
            className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            {errorMessage ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            {cameraError && !preview ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {cameraError}
              </p>
            ) : null}

            <div className="space-y-4">
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                {/* Preview Result */}
                {preview && (
                  <div className="relative w-full">
                    <img
                      src={preview}
                      alt="Preview Nota"
                      className="h-72 w-full bg-black/5 object-contain"
                    />
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="absolute top-2 right-2 inline-flex items-center justify-center rounded-lg bg-black/60 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Ulangi
                    </button>
                  </div>
                )}

                {/* Camera Viewfinder */}
                <div
                  className={`relative flex w-full flex-col items-center ${preview ? "hidden" : "block"}`}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-72 w-full bg-black object-cover"
                  />

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute right-0 bottom-4 left-0 flex items-center justify-center gap-6">
                    {/* Upload button floating */}
                    <button
                      type="button"
                      onClick={triggerUpload}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                      title="Upload Foto"
                    >
                      <ImagePlus className="h-5 w-5" />
                    </button>
                    {/* Take photo button */}
                    <button
                      type="button"
                      onClick={takePhoto}
                      disabled={!cameraActive}
                      className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/60 bg-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                      title="Ambil Foto"
                    >
                      <Camera className="h-6 w-6 text-black" />
                    </button>
                    <div className="w-12" /> {/* Spacer for centering */}
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                id="receipt"
                name="receipt"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              {loc.lat && loc.lng
                ? "Lokasi tercatat otomatis untuk menambah kepercayaan data."
                : "Lokasi belum tersedia. Anda tetap bisa melanjutkan scan."}
            </p>

            <button
              type="submit"
              disabled={isScanning || !preview}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-primary bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-primary-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  AI Sedang Membaca...
                </>
              ) : (
                "Baca & Periksa Nota"
              )}
            </button>
          </form>
        )}
      </main>

      {/* Modal Tambah Bahan Baku Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold">
              Daftarkan Bahan Baku Baru
            </h3>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-muted-foreground">
                  Nama Bahan Baku
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border p-3 outline-none"
                  placeholder="Misal: Bawang Merah"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-muted-foreground">
                  Satuan
                </span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border p-3 outline-none"
                  placeholder="Misal: Kg, Liter, Ikat"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                />
              </label>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center rounded-xl bg-muted px-4 py-3 font-semibold text-muted-foreground transition-colors hover:bg-muted/80"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                  disabled={!newItemName.trim() || !newItemUnit.trim()}
                  onClick={() => {
                    const name = newItemName.trim();
                    const unit = newItemUnit.trim();
                    // Add to options so it can be selected
                    setBahanBakuOptions((prev) => [
                      ...prev,
                      {
                        id: `temp-${Date.now()}`,
                        name,
                        price: Number(newItemPrice) || 0,
                        unit: unit,
                      },
                    ]);

                    // Assign to the item that triggered it
                    if (editingItemIndex !== null && extractedData) {
                      const newItems = [...extractedData.items];
                      const currentItem = newItems[editingItemIndex];
                      if (currentItem) {
                        currentItem.name = name;
                        currentItem.unit = unit;
                        setExtractedData({ ...extractedData, items: newItems });
                      }
                    }

                    setIsAddModalOpen(false);
                    setNewItemName("");
                    setNewItemPrice("");
                    setNewItemUnit("");
                    setEditingItemIndex(null);
                  }}
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
