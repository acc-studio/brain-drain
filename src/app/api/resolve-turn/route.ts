import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Disable caching for this route so it always runs fresh
export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("⚔️ STARTING TURN RESOLUTION...");

    // 1. Fetch all pending orders
    const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: true }); // First come, first served (for now)

    if (!orders || orders.length === 0) {
        return NextResponse.json({ message: "No orders to process" });
    }

    // 2. Process Transfers (Friendly Moves) first
    // We filter for "transfer" type
    const transfers = orders.filter(o => o.order_type === "transfer");

    for (const order of transfers) {
        // Get current state
        const { data: origin } = await supabase.from("map_state").select("*").eq("country_id", order.origin_country).single();
        const { data: target } = await supabase.from("map_state").select("*").eq("country_id", order.target_country).single();

        if (origin && target && origin.minds_count > order.minds_amount) {
            // Execute Move
            await supabase.from("map_state").update({ minds_count: origin.minds_count - order.minds_amount }).eq("country_id", order.origin_country);
            await supabase.from("map_state").update({ minds_count: target.minds_count + order.minds_amount }).eq("country_id", order.target_country);
            console.log(`🚚 Transferred ${order.minds_amount} from ${order.origin_country} to ${order.target_country}`);
        }
    }

    // 3. Process Attacks
    const attacks = orders.filter(o => o.order_type === "attack");

    for (const order of attacks) {
        const { data: origin } = await supabase.from("map_state").select("*").eq("country_id", order.origin_country).single();
        const { data: target } = await supabase.from("map_state").select("*").eq("country_id", order.target_country).single();

        // Validity Check: Does attacker still own the origin? Do they have troops?
        if (!origin || origin.minds_count <= 1) {
            console.log(`❌ Attack failed: ${order.origin_country} has no troops left.`);
            continue;
        }

        console.log(`⚔️ BATTLE: ${order.origin_country} attacks ${order.target_country}`);

        // BATTLE LOGIC (Simple Risk Style)
        // Attacker rolls 3 dice max, Defender rolls 2 dice max
        const attackDiceCount = Math.min(order.minds_amount, 3);
        const defendDiceCount = Math.min(target.minds_count, 2);

        const attackRolls = Array.from({ length: attackDiceCount }, () => Math.ceil(Math.random() * 6)).sort((a, b) => b - a);
        const defendRolls = Array.from({ length: defendDiceCount }, () => Math.ceil(Math.random() * 6)).sort((a, b) => b - a);

        let attackerLosses = 0;
        let defenderLosses = 0;

        // Compare highest die vs highest die
        for (let i = 0; i < Math.min(attackRolls.length, defendRolls.length); i++) {
            if (attackRolls[i] > defendRolls[i]) {
                defenderLosses++;
            } else {
                attackerLosses++;
            }
        }

        console.log(`🎲 Rolls: A[${attackRolls}] vs D[${defendRolls}] -> Losses: A-${attackerLosses}, D-${defenderLosses}`);

        // Apply Losses to Database
        const newOriginMinds = origin.minds_count - attackerLosses;
        let newTargetMinds = target.minds_count - defenderLosses;

        // Update Attacker
        await supabase.from("map_state").update({ minds_count: newOriginMinds }).eq("country_id", order.origin_country);

        // Update Defender
        if (newTargetMinds <= 0) {
            // CONQUEST! Attacker takes over.
            console.log(`🚩 VICTORY! ${order.target_country} conquered.`);
            const survivors = order.minds_amount - attackerLosses; // Troops that move in

            await supabase.from("map_state").update({
                owner_id: origin.owner_id, // Change Owner
                minds_count: survivors > 0 ? survivors : 1
            }).eq("country_id", order.target_country);
        } else {
            // Defender holds
            await supabase.from("map_state").update({ minds_count: newTargetMinds }).eq("country_id", order.target_country);
        }
    }

    // 4. Wipe Orders after processing
    await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all

    return NextResponse.json({ success: true, message: "Turn Resolved" });
}