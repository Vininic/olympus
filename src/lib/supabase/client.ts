import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY = "olympus.supabase.config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function envConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export function loadSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SupabaseConfig;
  } catch {
    /* ignore */
  }
  return envConfig();
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const config = loadSupabaseConfig();
  if (!config) return null;
  cachedClient = createClient(config.url, config.anonKey, {
    auth: { persistSession: true, storageKey: "olympus.supabase.auth" },
  });
  return cachedClient;
}
