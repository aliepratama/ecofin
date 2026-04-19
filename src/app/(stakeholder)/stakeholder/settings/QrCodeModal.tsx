'use client';

import { Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function QrCodeModal({ qrDataUrl }: { readonly qrDataUrl: string }) {
  return (
    <Dialog>
      <DialogTrigger className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <img
          src={qrDataUrl}
          alt="QR code undangan stakeholder"
          className="size-full object-cover p-1 transition-opacity group-hover:opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="size-6 text-primary shadow-sm" />
        </div>
      </DialogTrigger>
      <DialogContent className="flex w-full flex-col gap-6 rounded-2xl p-6 sm:max-w-sm">
        <DialogHeader className="w-full text-center">
          <DialogTitle className="text-center text-xl font-bold tracking-tight">
            QR Code Undangan
          </DialogTitle>
        </DialogHeader>
        <div className="mx-auto flex size-[250px] items-center justify-center rounded-xl bg-white p-4 shadow-sm ring-1 ring-border">
          <img
            src={qrDataUrl}
            alt="QR Code Besar"
            className="size-[220px] object-cover"
          />
        </div>
        <Button
          type="button"
          className="w-full gap-2 rounded-xl py-6 font-semibold"
          onClick={() => {
            const a = document.createElement('a');
            a.href = qrDataUrl;
            a.download = 'stakeholder-invite-qr.png';
            document.body.append(a);
            a.click();
            document.body.removeChild(a);
          }}
        >
          <Download className="size-5" />
          Unduh QR Code
        </Button>
      </DialogContent>
    </Dialog>
  );
}
