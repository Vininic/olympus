import { getSupabaseClient } from "@/lib/supabase/client";
import { USER_DATA_KEY, type SuitePrefs } from "./types";

const TABLE = "user_data";

async function currentUserId(): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session?.user?.id ?? null;
}

export async function pullPrefs(): Promise<SuitePrefs | null> {
  const sb = getSupabaseClient();
  const userId = await currentUserId();
  if (!sb || !userId) return null;

  const { data, error } = await sb
    .from(TABLE)
    .select("value")
    .eq("user_id", userId)
    .eq("key", USER_DATA_KEY)
    .maybeSingle();

  if (error || !data) return null;
  return data.value as SuitePrefs;
}

export async function pushPrefs(prefs: SuitePrefs): Promise<boolean> {
  const sb = getSupabaseClient();
  const userId = await currentUserId();
  if (!sb || !userId) return false;

  const version = Date.now();
  const { error } = await sb
    .from(TABLE)
    .upsert({ user_id: userId, key: USER_DATA_KEY, value: prefs, version }, { onConflict: "user_id,key" });

  return !error;
}
