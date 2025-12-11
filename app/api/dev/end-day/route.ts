import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// STRATEGY WORD BANK (5-7 Letters)
const WORDS = [
    "ATOMIC", "BATTLE", "CANNON", "DEFEND", "EMPIRE", "FORCES", "GLOBAL",
    "HAVOC", "IMPACT", "JUNGLE", "KNIGHT", "LAUNCH", "MORTAR", "NUCLEAR",
    "ORBIT", "POWER", "QUEST", "RADAR", "SCOUT", "TACTIC", "UNITY",
    "VIRUS", "WORLD", "YIELD", "ZONES", "ARMOR", "BLITZ", "CLASH",
    "DRONE", "ELITE", "FLANK", "GUARD", "HEAVY", "INTEL", "JOINT",
    "KILLS", "LASER", "MAJOR", "NAVAL", "ORDER", "PEACE", "QUICK",
    "RECON", "SIEGE", "TANKS", "UNIT", "VITAL", "WATCH", "XRAY",
    "YOUTH", "ZEBRA", "ALPHA", "BRAVO", "DELTA", "ECHO", "FOXTROT",
    "SIERRA", "TANGO", "VICTOR", "WHISKEY", "ROGUE", "LEADER", "SNIPER"
];

export async function POST() {
    // 1. Get Current Day
    const { data: dayData } = await supabase.from('global_settings').select('value').eq('key', 'current_day').single();
    const currentDay = parseInt(dayData?.value || '1');

    // --- (EXISTING COMBAT LOGIC START) ---
    const { data: orders } = await supabase.from('orders').select('*').eq('day_number', currentDay);

    if (orders && orders.length > 0) {
        for (const order of orders) {
            const { source_country_id, target_country_id, minds, order_type, user_id } = order;
            const { data: source } = await supabase.from('map_state').select('*').eq('country_id', source_country_id).single();
            const { data: target } = await supabase.from('map_state').select('*').eq('country_id', target_country_id).single();

            if (source.owner_id !== user_id) {
                await log(currentDay, `Order failed: ${source_country_id} lost control.`);
                continue;
            }

            await supabase.from('map_state').update({ minds: source.minds - minds }).eq('country_id', source_country_id);

            if (order_type === 'transfer' && target.owner_id === user_id) {
                await supabase.from('map_state').update({ minds: target.minds + minds }).eq('country_id', target_country_id);
                await log(currentDay, `Reinforcements: ${minds} minds moved to ${target_country_id}.`, 'info');
            }
            else if (order_type === 'attack' || (order_type === 'transfer' && target.owner_id !== user_id)) {
                const attackPower = minds; // Simple logic for now
                const defensePower = target.minds;

                if (attackPower > defensePower) {
                    const remaining = attackPower - defensePower;
                    await supabase.from('map_state').update({ owner_id: user_id, minds: remaining }).eq('country_id', target_country_id);
                    await log(currentDay, `CONQUEST: ${target_country_id} captured by ${source_country_id}!`, 'conquest');
                } else {
                    const remainingDef = defensePower - attackPower;
                    await supabase.from('map_state').update({ minds: remainingDef }).eq('country_id', target_country_id);
                    await log(currentDay, `Defeat: Attack on ${target_country_id} failed.`, 'combat');
                }
            }
        }
        // Wipe processed orders
        await supabase.from('orders').delete().eq('day_number', currentDay);
    }
    // --- (EXISTING COMBAT LOGIC END) ---


    // ========================================================
    // NEW: ADVANCE THE DAY & GENERATE CONTENT
    // ========================================================

    const nextDay = currentDay + 1;

    // 1. Update Global Settings
    await supabase.from('global_settings').update({ value: nextDay.toString() }).eq('key', 'current_day');

    // 2. Generate Puzzle
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];

    await supabase.from('daily_puzzles').insert({
        day_number: nextDay,
        wordle_solution: randomWord,
        trivia_content: JSON.stringify([{ question: "Generated Question", answer: "A" }])
    });

    await log(nextDay, `Day ${nextDay} has begun. New protocols initialized.`, 'info');

    return NextResponse.json({ success: true, nextDay, word: randomWord });
}

async function log(day: number, msg: string, type: 'info' | 'combat' | 'conquest' = 'info') {
    await supabase.from('game_logs').insert({ day_number: day, message: msg, type });
}