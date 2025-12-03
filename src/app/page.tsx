import GameMap from "@/components/GameMap";
import { supabase } from "@/lib/supabaseClient";
import { CombinedCountryData } from "@/types/game";

export const dynamic = 'force-dynamic';

export default async function Home() {
    // Fetch countries and map state
    const { data: countries } = await supabase.from("countries").select("*");
    const { data: mapState } = await supabase.from("map_state").select("*");

    if (!countries || !mapState) {
        return <div className="text-white p-10">Loading Game Data...</div>;
    }

    // Combine data
    const combinedData: CombinedCountryData[] = countries.map((country) => {
        const state = mapState.find((s) => s.country_id === country.id);
        return {
            ...country,
            country_id: country.id,
            owner_id: state?.owner_id || null,
            minds_count: state?.minds_count || 0,
        };
    });

    return (
        <main className="min-h-screen p-4">
            <GameMap countries={combinedData} />
        </main>
    );
}
