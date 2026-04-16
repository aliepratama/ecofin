"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/libs/DB";
import { createClient } from "@/libs/supabase/server";
import { businesses, users } from "@/models/Schema";

export async function createOrganizationAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Ensure user is in our public.users table or we get foreign key error
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

  const name = formData.get("name") as string;
  if (!name || name.trim() === "") {
    throw new Error("Store name is required");
  }

  try {
    // Insert business
    const [business] = await db
      .insert(businesses)
      .values({
        name: name.trim(),
        ownerId: user.id,
        category: "F&B",
      })
      .returning();

    if (!business) {
      throw new Error("Failed to insert business");
    }
  } catch (error) {
    console.error("Error creating business:", error);
    throw new Error("Failed to create store. Please try again.", {
      cause: error,
    });
  }

  redirect("/dashboard");
}
