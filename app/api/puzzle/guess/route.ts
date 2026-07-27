import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitWord, submitCode, submitNumbers } from "@/lib/game/puzzle-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { kind } = (body ?? {}) as { kind?: string };
  const admin = createAdminClient();

  try {
    let outcome;
    if (kind === "word") {
      const { guess } = body as { guess: string };
      outcome = await submitWord(admin, user.id, guess);
    } else if (kind === "code") {
      const { guess } = body as { guess: string[] };
      outcome = await submitCode(admin, user.id, guess);
    } else if (kind === "numbers") {
      const { expression } = body as { expression: string[] };
      outcome = await submitNumbers(admin, user.id, expression);
    } else {
      return NextResponse.json({ error: "Unknown puzzle kind" }, { status: 400 });
    }

    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: 400 });
    return NextResponse.json(outcome.status);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Guess failed" },
      { status: 500 },
    );
  }
}
