import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDay, ResolveError } from "@/lib/game/resolve";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The real daily tick. Vercel Cron calls this with
 *   Authorization: Bearer <CRON_SECRET>
 * (see vercel.json). No user session — service role only.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const report = await resolveDay(createAdminClient());
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    const status = e instanceof ResolveError ? 409 : 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Resolution failed" },
      { status },
    );
  }
}

export const GET = handle;
export const POST = handle;
