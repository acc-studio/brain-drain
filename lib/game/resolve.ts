import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, LogType } from "@/lib/database.types";
import { REGION_BY_ID, areAdjacent } from "./regions";
import {
  PASSIVE_INCOME,
  FRONTLINE_DRAFT,
  ECONOMY_BONUS,
  COMBAT_BONUS_DICE,
  initiativeRank,
  type Tier,
} from "./constants";
import { resolveCombat } from "./combat";
import { generatePuzzle } from "./puzzles";

type Admin = SupabaseClient<Database>;

interface Cell {
  country_id: string;
  owner_id: string | null;
  minds: number;
}
interface Perf {
  word_tier: Tier;
  word_completed_at: string | null;
  numbers_tier: Tier;
  code_tier: Tier;
}

export interface ResolveReport {
  day: number;
  ordersProcessed: number;
  conquests: number;
  logs: number;
  nextDay: number;
}

export class ResolveError extends Error {}

/**
 * Resolve the current game day. Server-only, run with the service-role client.
 * Order of operations matters — see the plan's resolution pipeline.
 */
export async function resolveDay(admin: Admin): Promise<ResolveReport> {
  // ── 0. lock / guard ─────────────────────────────────────────
  const settings = await loadSettings(admin);
  const day = settings.current_day;
  if (settings.resolving) throw new ResolveError("Resolution already in progress.");
  if (settings.last_resolved_day >= day) throw new ResolveError(`Day ${day} already resolved.`);
  await setSetting(admin, "resolving", true);

  try {
    // ── load state ────────────────────────────────────────────
    const board = await loadBoard(admin);
    const cells = new Map(board.map((c) => [c.country_id, { ...c }]));
    const orders = await loadOrders(admin, day);
    const perf = await loadPerf(admin, day);
    const names = await loadNames(admin);
    const logs: { message: string; type: LogType; actor?: string | null; region?: string | null }[] = [];
    const log = (message: string, type: LogType = "info", actor?: string | null, region?: string | null) =>
      logs.push({ message, type, actor, region });
    const who = (id: string | null) => (id ? names.get(id) ?? "an operative" : "neutral forces");

    // ── 1. sort by initiative ─────────────────────────────────
    const rankOf = (uid: string) => initiativeRank((perf.get(uid)?.word_tier ?? 0) as Tier);
    const finishOf = (uid: string) => perf.get(uid)?.word_completed_at ?? "9999";
    orders.sort((a, b) => {
      const ra = rankOf(a.user_id);
      const rb = rankOf(b.user_id);
      if (ra !== rb) return ra - rb;
      const fa = finishOf(a.user_id);
      const fb = finishOf(b.user_id);
      if (fa !== fb) return fa < fb ? -1 : 1;
      return a.created_at < b.created_at ? -1 : 1;
    });

    // ── 2. process orders (attack / explore / transfer) ───────
    let conquests = 0;
    let processed = 0;
    for (const o of orders) {
      const src = cells.get(o.source_country_id);
      const tgt = cells.get(o.target_country_id);
      if (!src || !tgt) continue;
      if (src.owner_id !== o.user_id) continue; // lost the source before this order fired
      if (!areAdjacent(o.source_country_id, o.target_country_id)) continue;

      const sendable = Math.min(o.minds, src.minds - 1); // must leave ≥1 behind
      if (sendable < 1) continue;
      processed++;

      if (tgt.owner_id === o.user_id) {
        // ── transfer / reinforce ──
        src.minds -= sendable;
        tgt.minds += sendable;
        continue;
      }

      if (tgt.owner_id === null) {
        // ── explore / annex ──
        const pop = tgt.minds;
        if (sendable >= pop) {
          src.minds -= sendable;
          tgt.owner_id = o.user_id;
          tgt.minds = sendable + Math.floor(pop / 2);
          conquests++;
          log(
            `${who(o.user_id)} annexed ${REGION_BY_ID[tgt.country_id].name}, converting ${Math.floor(pop / 2)} locals.`,
            "conquest",
            o.user_id,
            tgt.country_id,
          );
        } else {
          log(
            `${who(o.user_id)}'s probe into ${REGION_BY_ID[tgt.country_id].name} was too weak and withdrew.`,
            "info",
            o.user_id,
            tgt.country_id,
          );
        }
        continue;
      }

      // ── attack (enemy-held) ──
      const bonus = COMBAT_BONUS_DICE[(perf.get(o.user_id)?.code_tier ?? 0) as Tier];
      const defenderId = tgt.owner_id;
      const result = resolveCombat(sendable, tgt.minds, bonus);
      src.minds -= sendable;
      if (result.attackerWon) {
        tgt.owner_id = o.user_id;
        tgt.minds = result.survivingAttackers;
        conquests++;
        log(
          `${who(o.user_id)} seized ${REGION_BY_ID[tgt.country_id].name} from ${who(defenderId)} ` +
            `(−${result.attackerLosses} attacking, defenders wiped out).`,
          "conquest",
          o.user_id,
          tgt.country_id,
        );
      } else {
        // survivors retreat to source
        src.minds += result.survivingAttackers;
        tgt.minds = result.survivingDefenders;
        log(
          `${who(o.user_id)}'s assault on ${REGION_BY_ID[tgt.country_id].name} was repelled by ${who(defenderId)} ` +
            `(−${result.attackerLosses} vs −${result.defenderLosses}).`,
          "combat",
          o.user_id,
          tgt.country_id,
        );
      }
    }

    // ── 3. economy phase ──────────────────────────────────────
    const ownedByPlayer = new Map<string, Cell[]>();
    for (const c of cells.values()) {
      if (!c.owner_id) continue;
      c.minds += PASSIVE_INCOME;
      const list = ownedByPlayer.get(c.owner_id) ?? [];
      list.push(c);
      ownedByPlayer.set(c.owner_id, list);
    }
    const isFrontline = (c: Cell) =>
      REGION_BY_ID[c.country_id].connections.some((n) => cells.get(n)?.owner_id !== c.owner_id);

    for (const [uid, owned] of ownedByPlayer) {
      const frontline = owned.filter(isFrontline);
      for (const c of frontline) c.minds += FRONTLINE_DRAFT;

      const bonus = ECONOMY_BONUS[(perf.get(uid)?.numbers_tier ?? 0) as Tier];
      if (bonus > 0) {
        const targets = frontline.length ? frontline : owned;
        for (let i = 0; i < bonus; i++) targets[i % targets.length].minds += 1;
        log(`${who(uid)} received ${bonus} bonus supply from a clean Supply Run.`, "economy", uid);
      }
    }

    // ── persist board ─────────────────────────────────────────
    const rows = Array.from(cells.values()).map((c) => ({
      country_id: c.country_id,
      owner_id: c.owner_id,
      minds: c.minds,
      updated_at: new Date().toISOString(),
    }));
    const { error: upErr } = await admin.from("map_state").upsert(rows, { onConflict: "country_id" });
    if (upErr) throw new ResolveError(`Board persist failed: ${upErr.message}`);

    // ── 4. advance day + seed next puzzles + logs ─────────────
    const nextDay = day + 1;
    await seedPuzzle(admin, nextDay);

    log(`Day ${day} resolved. ${processed} orders executed, ${conquests} regions changed hands.`, "info");
    if (logs.length) {
      await admin.from("game_logs").insert(
        logs.map((l) => ({
          day_number: day,
          message: l.message,
          type: l.type,
          actor_id: l.actor ?? null,
          region_id: l.region ?? null,
        })),
      );
    }

    await setSetting(admin, "current_day", nextDay);
    await setSetting(admin, "last_resolved_day", day);
    await setSetting(admin, "resolving", false);

    return { day, ordersProcessed: processed, conquests, logs: logs.length, nextDay };
  } catch (e) {
    await setSetting(admin, "resolving", false);
    throw e;
  }
}

// ── helpers ───────────────────────────────────────────────────
async function loadSettings(admin: Admin) {
  const { data } = await admin.from("global_settings").select("key,value");
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  const num = (k: string, d: number) => {
    const v = map.get(k);
    const n = typeof v === "number" ? v : parseInt(String(v ?? d), 10);
    return Number.isFinite(n) ? n : d;
  };
  return {
    current_day: num("current_day", 1),
    last_resolved_day: num("last_resolved_day", 0),
    resolving: map.get("resolving") === true,
  };
}

async function setSetting(admin: Admin, key: string, value: number | boolean) {
  await admin
    .from("global_settings")
    .upsert(
      { key, value: value as unknown as Database["public"]["Tables"]["global_settings"]["Insert"]["value"], updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
}

async function loadBoard(admin: Admin): Promise<Cell[]> {
  const { data, error } = await admin.from("map_state").select("country_id,owner_id,minds");
  if (error) throw new ResolveError(error.message);
  return data ?? [];
}

async function loadOrders(admin: Admin, day: number) {
  const { data } = await admin
    .from("orders")
    .select("id,user_id,source_country_id,target_country_id,minds,order_type,created_at")
    .eq("day_number", day);
  return data ?? [];
}

async function loadPerf(admin: Admin, day: number): Promise<Map<string, Perf>> {
  const { data } = await admin
    .from("daily_performance")
    .select("user_id,word_tier,word_completed_at,numbers_tier,code_tier")
    .eq("day_number", day);
  return new Map(
    (data ?? []).map((r) => [
      r.user_id,
      {
        word_tier: r.word_tier as Tier,
        word_completed_at: r.word_completed_at,
        numbers_tier: r.numbers_tier as Tier,
        code_tier: r.code_tier as Tier,
      },
    ]),
  );
}

async function loadNames(admin: Admin): Promise<Map<string, string>> {
  const { data } = await admin.from("profiles").select("id,username");
  return new Map((data ?? []).map((r) => [r.id, r.username]));
}

/** Insert a generated puzzle for `day` if one doesn't already exist. */
async function seedPuzzle(admin: Admin, day: number) {
  const { data: existing } = await admin
    .from("daily_puzzles")
    .select("day_number")
    .eq("day_number", day)
    .maybeSingle();
  if (existing) return;
  const p = generatePuzzle(day);
  await admin.from("daily_puzzles").insert({ day_number: day, ...p });
}
