import "server-only";
import {createClient} from "@/lib/supabase/server";

export type PlatformAdmin = Readonly<{id: string; email: string | null}>;

export async function getPlatformAdmin(): Promise<PlatformAdmin | null> {
  const supabase = await createClient();
  const {data: {user}, error: userError} = await supabase.auth.getUser();
  if (userError || !user) return null;

  const {data: membership, error: accessError} = await supabase.from("platform_skill_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (accessError || !membership) return null;
  return {id: user.id, email: user.email ?? null};
}

export async function requirePlatformAdmin() {
  const admin = await getPlatformAdmin();
  if (!admin) throw new Error("platform_admin_required");
  return admin;
}
