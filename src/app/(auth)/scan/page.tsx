"use client";

import { Camera, ImagePlus, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { getCurrentLocation } from "@/utils/Geolocation";
import { processReceiptAction } from "./actions";

export default function ScanReceiptPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loc, setLoc] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCapturedBlob(blob);
              setPreview(URL.createObjectURL(blob));
              stopCamera();
            }
          },
          "image/jpeg",
          0.9,
        );
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setCapturedBlob(file);
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
    void startCamera();
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
              "Simpan hasil scan"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
