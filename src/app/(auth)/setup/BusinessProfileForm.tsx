"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Check, X } from "lucide-react";
import { updateOrganizationAction } from "./actions";

export function BusinessProfileForm({ initialName }: { initialName?: string }) {
  const [isEditing, setIsEditing] = useState(!initialName);

  if (!isEditing && initialName) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        <h2 className="text-xl font-bold text-center">{initialName}</h2>
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Nama Usaha
        </Button>
      </div>
    );
  }

  return (
    <form action={updateOrganizationAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Warung / UMKM</Label>
        <Input
          id="name"
          name="name"
          placeholder="Contoh: Kopi Kenangan, Ayam Geprek Juara"
          defaultValue={initialName}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          <Check className="mr-2 h-4 w-4" />
          Simpan profil usaha
        </Button>
        {initialName && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
          >
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
