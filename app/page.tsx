import { supabase } from "@/lib/supabaseClient";
import GameMap from "@/components/GameMap";
import { CombinedCountryData } from "@/types/game";

export const revalidate = 0; // Disable caching so we see real-time DB updates

export default async function Home() {
  // 1. Fetch static country data
  const { data: countries } = await supabase.from("countries").select("*") as { data: CombinedCountryData[] | null };

  // 2. Fetch dynamic state
  const { data: mapState } = await supabase.from("map_state").select("*") as { data: CombinedCountryData[] | null };

  // 3. Merge them together
  // This gives us one array with Name, ID, AND Owner/Minds
  const combinedData: CombinedCountryData[] = countries?.map((country) => {
    const state = mapState?.find((s) => s.country_id === country.id);
    return {
      ...country,
      owner_id: state?.owner_id || null,
      minds_count: state?.minds_count || 0,
      country_id: country.id
    };
  }) || [];

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">BRAIN DRAIN</h1>
      <p className="text-slate-400 mb-8">Season 0: Alpha</p>

      {/* Render the Map */}
      <GameMap countries={combinedData} />
    </main>
  );
}