import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Env } from "@/libs/Env";
import { createClient } from "@/libs/supabase/server";
import {
  getStakeholderPortfolioAnalyticsAction,
  updateInstitutionNameAction,
  updateTrustScoreSettingsAction,
} from "@/app/(stakeholder)/analytics/actions";
import { createStakeholderInviteCodeAction } from "@/app/(stakeholder)/link/actions";
import { QrCodeModal } from "./QrCodeModal";

export default async function StakeholderSettingsPage(props: {
  readonly searchParams: Promise<{
    code?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const [{ code }, analytics] = await Promise.all([
    props.searchParams,
    getStakeholderPortfolioAnalyticsAction(),
  ]);

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost || requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProto || "https";
  const fallbackAppUrl = host ? `${protocol}://${host}` : "";
  const appUrl = Env.NEXT_PUBLIC_APP_URL || fallbackAppUrl;

  const inviteLink = code
    ? `${appUrl}/stakeholder-link?inviteCode=${encodeURIComponent(code)}`
    : "";

  const inviteQrDataUrl = code
    ? await QRCode.toDataURL(inviteLink || code, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: "M",
      })
    : null;

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 md:px-6">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Pengaturan
        </h1>
        <p className="text-base text-muted-foreground">
          Kelola profil institusi dan pengaturan konfigurasi skor kepercayaan
          serta undangan merchant.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil Institusi</CardTitle>
            <CardDescription>
              Ubah nama institusi Anda yang akan terlihat oleh UMKM ketika
              mereka mendaftar di tautan undangan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await updateInstitutionNameAction(formData);
                const currentCode =
                  formData.get("currentCode")?.toString() || "";
                redirect(
                  `/stakeholder/settings${currentCode ? `?code=${currentCode}` : ""}`,
                );
              }}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="currentCode" value={code || ""} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="institutionName">Nama institusi</Label>
                <Input
                  id="institutionName"
                  name="institutionName"
                  defaultValue={analytics.institutionName}
                  placeholder="Contoh: Koperasi Mitra UMKM"
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="w-full md:w-fit"
                  variant="outline"
                >
                  Simpan Profil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Undangan Merchant</CardTitle>
            <CardDescription>
              Buat kode undangan sekali pakai agar UMKM bisa terhubung dan
              membagikan datanya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                const result =
                  await createStakeholderInviteCodeAction(formData);
                redirect(`/stakeholder/settings?code=${result.code}`);
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex justify-start">
                <Button type="submit" className="w-full md:w-fit">
                  Generate Kode Undangan Baru
                </Button>
              </div>
            </form>

            {code ? (
              <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-5">
                <div className="mb-4 text-sm font-semibold text-primary">
                  Undangan Berhasil Dibuat! Bagikan ke merchant.
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Metode 1: Kode Undangan */}
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Metode 1: Kode
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-wide text-foreground">
                      {code}
                    </p>
                    <p className="mt-auto text-xs text-muted-foreground">
                      Merchant dapat memasukkan kode ini secara manual.
                    </p>
                  </div>

                  {/* Metode 2: Share Link */}
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Metode 2: Link
                    </p>
                    <p className="mt-1 break-all rounded-md bg-muted p-2 font-mono text-xs text-foreground">
                      {inviteLink || code}
                    </p>
                    <p className="mt-auto text-xs text-muted-foreground">
                      Kirimkan link ini langsung ke perangkat merchant.
                    </p>
                  </div>

                  {/* Metode 3: QR Code */}
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Metode 3: QR Code
                    </p>
                    <div className="mt-1 flex justify-start">
                      {inviteQrDataUrl ? (
                        <QrCodeModal qrDataUrl={inviteQrDataUrl} />
                      ) : null}
                    </div>
                    <p className="mt-auto text-xs text-muted-foreground">
                      Minta merchant memindai QR code ini.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengaturan klasifikasi trust score</CardTitle>
            <CardDescription>
              Tentukan batas nilai untuk kategori trust score merchant.
              Perubahan berdampak pada warna label trust score di semua daftar
              UMKM.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await updateTrustScoreSettingsAction(formData);
                redirect("/stakeholder/settings");
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="minMedium">Batas Bawah (Menengah)</Label>
                  <Input
                    id="minMedium"
                    name="minMedium"
                    type="number"
                    min="1"
                    max="99"
                    defaultValue={analytics.minMediumTrustScore}
                    placeholder="Contoh: 40"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    UMKM dengan skor di atas batas ini namun di bawah batas
                    atas, akan dialokasikan ke "Menengah".
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="minHigh">Batas Atas (Dapat dipercaya)</Label>
                  <Input
                    id="minHigh"
                    name="minHigh"
                    type="number"
                    min="2"
                    max="100"
                    defaultValue={analytics.minHighTrustScore}
                    placeholder="Contoh: 70"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    UMKM dengan skor sama dengan atau di atas batas ini akan
                    dikategorikan "Dapat dipercaya".
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full md:w-fit"
                >
                  Simpan pengaturan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
