"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDay, ResolveError } from "@/lib/game/resolve";

function isAdmin(userId: string): boolean {
  if (process.env.NODE_ENV !== "production") return true; // dev hatch
  const ids = (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim());
  return ids.includes(userId);
}

/** Admin-guarded manual resolution — the dev test hatch. */
export async function resolveNow(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  if (!isAdmin(user.id)) return { ok: false, error: "Not authorized to force resolution." };

  try {
    await resolveDay(createAdminClient());
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof ResolveError) return { ok: false, error: e.message };
    return { ok: false, error: e instanceof Error ? e.message : "Resolution failed" };
  }
}

type OrderType = "transfer" | "explore" | "attack";

/**
 * Queue an order. RLS already guarantees the player owns the source; here we
 * also enforce the mind budget (a source can't commit more than minds−1 across
 * all its queued orders) and adjacency.
 */
export async function queueOrder(input: {
  source: string;
  target: string;
  minds: number;
  orderType: OrderType;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const minds = Math.floor(input.minds);
  if (!Number.isFinite(minds) || minds < 1) return { ok: false, error: "Commit at least 1 Mind." };

  const { data: day } = await supabase.rpc("current_day");
  const dayNumber = (day as number) ?? 1;

  const { data: src } = await supabase
    .from("map_state")
    .select("owner_id,minds")
    .eq("country_id", input.source)
    .maybeSingle();
  if (!src || src.owner_id !== user.id) return { ok: false, error: "You don't control that region." };

  const { data: srcRegion } = await supabase
    .from("countries")
    .select("connections")
    .eq("id", input.source)
    .maybeSingle();
  if (!srcRegion?.connections?.includes(input.target)) {
    return { ok: false, error: "Those regions aren't connected." };
  }

  // budget: existing queued commitments from this source today
  const { data: existing } = await supabase
    .from("orders")
    .select("minds")
    .eq("user_id", user.id)
    .eq("day_number", dayNumber)
    .eq("source_country_id", input.source);
  const committed = (existing ?? []).reduce((s, o) => s + o.minds, 0);
  if (committed + minds > src.minds - 1) {
    return {
      ok: false,
      error: `Only ${Math.max(0, src.minds - 1 - committed)} Minds free from that region (1 must stay behind).`,
    };
  }

  const { error } = await supabase.from("orders").insert({
    user_id: user.id,
    day_number: dayNumber,
    source_country_id: input.source,
    target_country_id: input.target,
    minds,
    order_type: input.orderType,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function cancelOrder(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const { error } = await supabase.from("orders").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

/** Claim a starting region (idempotent). Wraps the enlist() RPC. */
export async function enlist(): Promise<{ ok: boolean; region?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase.rpc("enlist");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true, region: data as string };
}
