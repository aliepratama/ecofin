"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/libs/DB";
import { createClient } from "@/libs/supabase/server";
import {
  businesses,
  stakeholderBusinesses,
  stakeholderInvites,
  stakeholders,
  users,
} from "@/models/Schema";

const INVITE_EXPIRY_DAYS = 7;

function generateInviteCode() {
  const raw = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
  return raw.toUpperCase();
}

async function ensureUserExists() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!existingUser) {
    await db.insert(users).values({
      id: user.id,
      email: user.email ?? null,
      fullName: user.user_metadata?.full_name ?? user.email,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    });
  }

  return user;
}

async function ensureStakeholder(userId: string, institutionName: string) {
  const existingStakeholder = await db.query.stakeholders.findFirst({
    where: eq(stakeholders.userId, userId),
  });

  if (existingStakeholder) {
    return existingStakeholder;
  }

  const [newStakeholder] = await db
    .insert(stakeholders)
    .values({
      userId,
      institutionName,
    })
    .returning();

  if (!newStakeholder) {
    throw new Error("Gagal membuat profil stakeholder");
  }

  return newStakeholder;
}

export async function createStakeholderInviteCodeAction(formData: FormData) {
  const user = await ensureUserExists();
  const institutionNameRaw = formData.get("institutionName") as string | null;
  const institutionName = institutionNameRaw?.trim() || "Lender Partner";

  const stakeholder = await ensureStakeholder(user.id, institutionName);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const code = generateInviteCode();

  await db.insert(stakeholderInvites).values({
    stakeholderId: stakeholder.id,
    code,
    expiresAt,
    status: "ACTIVE",
  });

  revalidatePath("/stakeholder/dashboard");

  return {
    code,
    institutionName: stakeholder.institutionName,
    expiresAt,
  };
}

export async function claimStakeholderInviteAction(formData: FormData) {
  const user = await ensureUserExists();
  const rawCode = formData.get("inviteCode") as string | null;

  if (!rawCode) {
    throw new Error("Kode undangan wajib diisi");
  }

  const inviteCode = rawCode.trim().toUpperCase();

  const invite = await db.query.stakeholderInvites.findFirst({
    where: eq(stakeholderInvites.code, inviteCode),
    orderBy: [desc(stakeholderInvites.createdAt)],
  });

  if (!invite) {
    throw new Error("Kode tidak ditemukan");
  }

  if (invite.status !== "ACTIVE") {
    throw new Error("Kode sudah tidak aktif");
  }

  if (invite.expiresAt < new Date()) {
    await db
      .update(stakeholderInvites)
      .set({ status: "EXPIRED" })
      .where(eq(stakeholderInvites.id, invite.id));

    throw new Error("Kode sudah kedaluwarsa");
  }

  const ownedBusinesses = await db.query.businesses.findMany({
    where: eq(businesses.ownerId, user.id),
  });

  if (ownedBusinesses.length === 0) {
    throw new Error("Buat profil usaha dulu sebelum menghubungkan lender");
  }

  const businessIds = ownedBusinesses.map((business) => business.id);

  const existingLinks = await db.query.stakeholderBusinesses.findMany({
    where: and(
      eq(stakeholderBusinesses.stakeholderId, invite.stakeholderId),
      inArray(stakeholderBusinesses.businessId, businessIds),
    ),
  });

  const linkedBusinessSet = new Set(
    existingLinks.map((existingLink) => existingLink.businessId),
  );

  const newLinks = ownedBusinesses
    .filter((business) => !linkedBusinessSet.has(business.id))
    .map((business) => ({
      stakeholderId: invite.stakeholderId,
      businessId: business.id,
    }));

  if (newLinks.length > 0) {
    await db.insert(stakeholderBusinesses).values(newLinks);
  }

  await db
    .update(stakeholderInvites)
    .set({
      status: "CLAIMED",
      claimedBusinessId: ownedBusinesses[0]?.id,
      claimedAt: new Date(),
    })
    .where(eq(stakeholderInvites.id, invite.id));

  revalidatePath("/dashboard");
  revalidatePath("/stakeholder/dashboard");

  return {
    linkedCount: ownedBusinesses.length,
  };
}
