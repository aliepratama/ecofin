"use client";

import { useEffect, useState, useActionState } from "react";
import { getCurrentLocation } from "@/utils/Geolocation";

export function ManualTransactionForm(
  props: Readonly<{
    action: (prevState: any, formData: FormData) => Promise<any>;
  }>,
) {
  const [state, formAction] = useActionState(props.action, { error: null });
  const [loc, setLoc] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  useEffect(() => {
    void getCurrentLocation().then((data) => {
      if (data.latitude && data.longitude) {
        setLoc({ lat: data.latitude, lng: data.longitude });
      }
    });
  }, []);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}
      <fieldset className="space-y-2">
        <legend className="text-base font-semibold text-foreground">
          Jenis Transaksi
        </legend>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-border p-3 text-foreground focus-within:ring-2 focus-within:ring-primary hover:bg-muted has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
            <input
              type="radio"
              name="type"
              value="INCOME"
              className="sr-only"
              required
            />
            <span className="w-full rounded-lg px-3 py-2 text-center text-base font-semibold transition-colors">
              Pemasukan
            </span>
          </label>
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-border p-3 text-foreground focus-within:ring-2 focus-within:ring-primary hover:bg-muted has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
            <input
              type="radio"
              name="type"
              value="EXPENSE"
              className="sr-only"
              required
            />
            <span className="w-full rounded-lg px-3 py-2 text-center text-base font-semibold transition-colors">
              Pengeluaran
            </span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <label
          htmlFor="amount"
          className="text-base font-semibold text-foreground"
        >
          Nominal (Rp)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="0"
          placeholder="0"
          className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          required
        />
      </div>

      <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
        {loc.lat && loc.lng
          ? "Lokasi tercatat otomatis untuk validasi data usaha."
          : "Lokasi belum tersedia. Transaksi tetap bisa disimpan."}
      </p>

      <input type="hidden" name="latitude" value={loc.lat?.toString() ?? ""} />
      <input type="hidden" name="longitude" value={loc.lng?.toString() ?? ""} />

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  return (
    <button
      type="submit"
      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      Simpan Data
    </button>
  );
}
