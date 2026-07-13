/** Olympus desk sync — reads sibling user_data rows from Supabase.
 *  Unlike per-app sync engines, Olympus only READS sibling data. No writing,
 *  no echo guard needed (but we still use version for freshness). */

import { useEffect } from "react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/I18nProvider";

const TABLE = "user_data";

export const DESK_DOMAINS = [
  { key: "schedule", storageKey: "olympus.view.chronos" },
  { key: "kairos-board", storageKey: "olympus.view.kairos" },
  { key: "pluto-ledger", storageKey: "olympus.view.pluto" },
  { key: "hermes-outbox", storageKey: "olympus.view.hermes" },
  { key: "chiron-index", storageKey: "olympus.view.chiron" },
] as const;

export const DESK_PULLED_EVENT = "olympus-desk-pulled";

async function currentUserId(): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session?.user?.id ?? null;
}

export async function pullDesk(): Promise<boolean> {
  const sb = getSupabaseClient();
  const userId = await currentUserId();
  if (!sb || !userId) return false;

  let anyChanged = false;

  for (const domain of DESK_DOMAINS) {
    const { data, error } = await sb
      .from(TABLE)
      .select("value, version")
      .eq("user_id", userId)
      .eq("key", domain.key)
      .maybeSingle();

    if (error || !data) continue;

    const localRaw = localStorage.getItem(domain.storageKey);
    const next = JSON.stringify({ value: data.value, version: data.version });
    if (next !== localRaw) {
      localStorage.setItem(domain.storageKey, next);
      anyChanged = true;
    }
  }

  return anyChanged;
}

async function subscribeForeignChanges(userId: string, onForeign: () => void): Promise<() => void> {
  const sb = getSupabaseClient();
  if (!sb) return () => {};

  const domainKeys = DESK_DOMAINS.map((d) => d.key);

  const channel = sb
    .channel("olympus_desk_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as { key?: string } | undefined;
        if (!row?.key) return;
        if (!(domainKeys as readonly string[]).includes(row.key)) return;
        onForeign();
      },
    )
    .subscribe();

  return () => { sb.removeChannel(channel); };
}

/** Mount once at the app root. Pulls sibling data on cloud login. */
export function useDeskSync(): void {
  const { session, isCloud } = useAuth();
  const t = useT();

  useEffect(() => {
    if (!isCloud || !session?.email) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const changed = await pullDesk();
      if (cancelled) return;
      if (changed) window.dispatchEvent(new Event(DESK_PULLED_EVENT));

      interval = setInterval(() => {
        void pullDesk().then((pulled) => {
          if (pulled) window.dispatchEvent(new Event(DESK_PULLED_EVENT));
        });
      }, 15000);

      const userId = await currentUserId();
      if (userId && !cancelled) {
        unsubscribe = await subscribeForeignChanges(userId, () => {
          void pullDesk().then((pulled) => {
            if (!pulled) return;
            window.dispatchEvent(new Event(DESK_PULLED_EVENT));
            toast(t.common.updatedElsewhere);
          });
        });
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      unsubscribe?.();
    };
  }, [isCloud, session?.email]);
}
