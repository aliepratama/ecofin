"use client";

import { useState, useEffect } from "react";
import { processReceiptAction } from "./actions";
import { getCurrentLocation } from "@/utils/Geolocation";

export default function ScanReceiptPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loc, setLoc] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  useEffect(() => {
    getCurrentLocation().then((data) => {
      if (data.latitude && data.longitude) {
        setLoc({ lat: data.latitude, lng: data.longitude });
      }
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center space-x-3 border-b border-border bg-card px-4 py-5 shadow-sm sm:px-6">
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
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <form
          action={async (formData) => {
            setIsScanning(true);
            setErrorMessage(null);
            try {
              if (loc.lat) formData.append("latitude", loc.lat.toString());
              if (loc.lng) formData.append("longitude", loc.lng.toString());
              await processReceiptAction(formData);
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

          <div className="space-y-4">
            <div className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 transition-colors focus-within:border-foreground hover:bg-muted">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview Nota"
                  className="h-64 w-full rounded-lg object-contain"
                />
              ) : (
                <>
                  <svg
                    className="mb-4 h-12 w-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-center text-sm font-medium text-foreground">
                    Tekan untuk memfoto struk / Pilih file
                  </p>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    Gunakan format gambar (JPEG, PNG, JPG)
                  </p>
                </>
              )}
              <input
                id="receipt"
                name="receipt"
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleImageChange}
                required
              />
            </div>
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
              "Simpan hasil scan"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
