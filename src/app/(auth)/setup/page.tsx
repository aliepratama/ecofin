import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/libs/supabase/server";
import { createOrganizationAction } from "./actions";

export default function SetupPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 p-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <a
          href="/dashboard"
          className="inline-flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          Kembali ke home
        </a>
        <ModeToggle />
      </div>

      <div className="w-full space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Profil usaha</h1>
          <p className="text-base text-muted-foreground">
            Lengkapi data usaha agar pencatatan dan analisis semakin akurat.
          </p>
        </div>

        <form action={createOrganizationAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Warung / UMKM</Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Kopi Kenangan, Ayam Geprek Juara"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Simpan profil usaha
          </Button>
        </form>

        <form
          action={async () => {
            "use server";
            const supabase = await createClient();
            await supabase.auth.signOut();
            redirect("/login");
          }}
        >
          <Button type="submit" variant="outline" className="h-12 w-full">
            Keluar akun
          </Button>
        </form>
      </div>
    </div>
  );
}
