import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeScoreboard } from "@/lib/game/gii";
import Console from "@/components/console/Console";

export const dynamic = "force-dynamic";

export interface ProfileLite {
  id: string;
  username: string;
  color_hue: number;
}
export interface OrderLite {
  id: string;
  source_country_id: string;
  target_country_id: string;
  minds: number;
  order_type: "transfer" | "explore" | "attack";
}
export interface LogLite {
  id: string;
  day_number: number;
  message: string;
  type: "info" | "combat" | "conquest" | "economy";
  actor_id: string | null;
  created_at: string;
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profiles },
    { data: board },
    { data: orders },
    { data: logs },
    { data: day },
  ] = await Promise.all([
    supabase.from("profiles").select("id,username,color_hue"),
    supabase.from("map_state").select("country_id,owner_id,minds"),
    supabase
      .from("orders")
      .select("id,source_country_id,target_country_id,minds,order_type")
      .eq("user_id", user.id)
      .eq("day_number", (await supabase.rpc("current_day")).data ?? 1),
    supabase
      .from("game_logs")
      .select("id,day_number,message,type,actor_id,created_at")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase.rpc("current_day"),
  ]);

  const boardCells = board ?? [];
  const profileList = (profiles ?? []) as ProfileLite[];
  const nameById: Record<string, string> = {};
  const hueById: Record<string, number> = {};
  for (const p of profileList) {
    nameById[p.id] = p.username;
    hueById[p.id] = p.color_hue;
  }

  const scoreboard = computeScoreboard(boardCells).map((row) => ({
    ...row,
    username: nameById[row.playerId] ?? "unknown",
    isMe: row.playerId === user.id,
  }));

  const enlisted = boardCells.some((c) => c.owner_id === user.id);

  return (
    <Console
      currentUserId={user.id}
      username={nameById[user.id] ?? "operative"}
      day={(day as number) ?? 1}
      board={boardCells}
      orders={(orders ?? []) as OrderLite[]}
      logs={(logs ?? []) as LogLite[]}
      ownerHue={hueById}
      nameById={nameById}
      scoreboard={scoreboard}
      enlisted={enlisted}
    />
  );
}
