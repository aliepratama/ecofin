export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Mode Offline</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Internet sedang tidak stabil. Anda tetap bisa membuka halaman yang
          sudah pernah diakses sebelumnya.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Saat koneksi kembali normal, data akan tersinkron otomatis.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Buka dashboard
          </a>
          <a
            href="/manual"
            className="inline-flex items-center justify-center rounded-lg border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90"
          >
            Catat manual
          </a>
        </div>
      </div>
    </main>
  );
}
