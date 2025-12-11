import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// A curated list of common 5-7 letter English words (Mix of nouns/verbs)
const WORD_BANK = [
    // 5 Letters
    "APPLE", "BEACH", "BRAIN", "BREAD", "BRUSH", "CHAIR", "CHEST", "CHORD", "CLICK", "CLOCK",
    "CLOUD", "DANCE", "DIARY", "DRINK", "DRIVE", "EARTH", "FEAST", "FIELD", "FRUIT", "GLASS",
    "GHOST", "GRAPE", "GRASS", "HEART", "HOUSE", "JUICE", "LIGHT", "LEMON", "MELON", "MONEY",
    "MUSIC", "NIGHT", "OCEAN", "PARTY", "PHONE", "PHOTO", "PIANO", "PILOT", "PLANE", "PLANT",
    "PLATE", "POWER", "RADIO", "RIVER", "ROBOT", "SHIRT", "SHOES", "SKIRT", "SNAKE", "SPACE",
    "SPOON", "STORM", "TABLE", "TOAST", "TIGER", "TOUCH", "TRAIN", "TRUCK", "VOICE", "WATCH",
    "WATER", "WHALE", "WORLD", "WRITE", "YOUTH", "ZEBRA", "ALIVE", "ANGRY", "BRAVE", "CALM",
    "CLEAN", "CRAZY", "DIRTY", "EARLY", "EMPTY", "EQUAL", "FALSE", "FRESH", "FUNNY", "GREAT",
    "GREEN", "HAPPY", "HARSH", "HEAVY", "HUMAN", "LARGE", "LATE", "LEGAL", "LEVEL", "LOCAL",
    "LUCKY", "METAL", "NOISY", "NORTH", "PAPER", "PROUD", "QUICK", "QUIET", "READY", "RIGHT",
    "ROUGH", "ROUND", "ROYAL", "SALTY", "SHARP", "SHORT", "SILLY", "SMALL", "SMART", "SOLID",
    "SOUTH", "SWEET", "THICK", "THING", "TIGHT", "TOTAL", "TOUGH", "UPPER", "USUAL", "WHITE",
    "WHOLE", "WRONG", "YOUNG",
    // 6 Letters
    "ANIMAL", "BANANA", "BASKET", "BOTTLE", "BRANCH", "BRIDGE", "BUTTON", "CAMERA", "CANDLE",
    "CARPET", "CASTLE", "CHEESE", "CHURCH", "CIRCLE", "CIRCUS", "CLOUDS", "COFFEE", "COOKIE",
    "COTTON", "COUSIN", "DOCTOR", "DOLLAR", "DONKEY", "DRIVER", "ENGINE", "FAMILY", "FARMER",
    "FATHER", "FINGER", "FLOWER", "FOREST", "FRIDGE", "FRIEND", "GARDEN", "GARLIC", "GENTLE",
    "GLOVES", "GRAPES", "GUITAR", "HAMMER", "HEAVEN", "ISLAND", "JACKET", "JUNGLE", "KITTEN",
    "LADDER", "LAWYER", "LESSON", "LETTER", "LIBRARY", "MAGNET", "MARKET", "MEMORY", "MIRROR",
    "MONKEY", "MOTHER", "MOUNTAIN", "MUSEUM", "NATURE", "NEEDLE", "NUMBER", "OFFICE", "ORANGE",
    "PALACE", "PARADE", "PARENT", "PEANUT", "PENCIL", "PEPPER", "PERSON", "PICKLE", "PICNIC",
    "PLANET", "POCKET", "POLICE", "POTATO", "PRISON", "PUPPET", "PURPLE", "RABBIT", "RADISH",
    "ROCKET", "SADDLE", "SCHOOL", "SEASON", "SECOND", "SHADOW", "SHOWER", "SIGNAL", "SILVER",
    "SISTER", "SOCCER", "SPIDER", "SPIRIT", "SQUARE", "STREET", "SUMMER", "SUNDAY", "SUPPER",
    "SYMBOL", "TARGET", "TENNIS", "TICKET", "TOMATO", "TRAVEL", "TUNNEL", "TURKEY", "TURTLE",
    "VALLEY", "VIOLET", "WAITER", "WALLET", "WEALTH", "WEAPON", "WINDOW", "WINTER", "WIZARD",
    "WONDER", "WRITER", "YELLOW", "ZOMBIE",
    // 7 Letters
    "ADDRESS", "AIRPORT", "ALCOHOL", "BALLOON", "BATTERY", "BEDROOM", "BENEFIT", "BICYCLE",
    "BLANKET", "BLOSSOM", "CABINET", "CAPTAIN", "CENTURY", "CHAPTER", "CHICKEN", "CHIMNEY",
    "CLOTHES", "COLLEGE", "COMFORT", "COMPANY", "COMPASS", "CONCERT", "CONTEXT", "COUNTRY",
    "COURAGE", "CRYSTAL", "CULTURE", "CUPBOARD", "CURTAIN", "DENTIST", "DESSERT", "DIAMOND",
    "DINNER", "DISEASE", "DISPLAY", "DOLPHIN", "DRAWER", "DRAWING", "ECONOMY", "EDITION",
    "ELEMENT", "EMOTION", "EPISODE", "EVENING", "EXAMPLE", "FACTORY", "FEATHER", "FEATURE",
    "FESTIVAL", "FICTION", "FITNESS", "FLAVOR", "FOREVER", "FORTUNE", "FREEDOM", "GALLERY",
    "GARBAGE", "GESTURE", "GIRAFFE", "GLASSES", "GORILLA", "GRAVITY", "GROCERY", "HABITAT",
    "HAIRCUT", "HARVEST", "HISTORY", "HOLIDAY", "HUSBAND", "ILLNESS", "IMAGINE", "JOURNEY",
    "JUSTICE", "KITCHEN", "LANGUAGE", "LAUNDRY", "LEATHER", "LEOPARD", "LIBERTY", "LIBRARY",
    "LICENSE", "LUGGAGE", "MACHINE", "MAGAZINE", "MANAGER", "MASSAGE", "MESSAGE", "MILLION",
    "MINERAL", "MIRACLE", "MISSION", "MISTAKE", "MIXTURE", "MONSTER", "MORNING", "MUSICAL",
    "MYSTERY", "NATURAL", "NOTHING", "OFFICER", "OPINION", "ORGANIC", "OUTSIDE", "PACKAGE",
    "PAINTING", "PASSAGE", "PASSION", "PATIENT", "PATTERN", "PENGUIN", "PERFECT", "PICTURE",
    "PLASTIC", "POPCORN", "POPULAR", "PRESENT", "PRIVATE", "PROBLEM", "PROCESS", "PRODUCE",
    "PROFILE", "PROGRAM", "PROJECT", "PROMISE", "PROTECT", "PROTEIN", "PUMPKIN", "PURPOSE",
    "PYRAMID", "QUALITY", "QUARTER", "RACCOON", "REALITY", "RECEIPT", "RECIPE", "REGULAR",
    "REQUEST", "RESPECT", "ROUTINE", "SANDWICH", "SCIENCE", "SECTION", "SEGMENT", "SERVICE",
    "SESSION", "SHADOW", "SHELTER", "SHOULDER", "SILENCE", "SOCIETY", "SOLDIER", "SPEAKER",
    "SPECIAL", "SPECIES", "SPINACH", "SQUIRREL", "STADIUM", "STATION", "STOMACH", "STRANGE",
    "STUDENT", "SUCCESS", "SUGGEST", "SUPPORT", "SURFACE", "SURVIVE", "SWEATER", "TEACHER",
    "TEXTURE", "THEATER", "THOUGHT", "TOBACCO", "TRAFFIC", "TROUBLE", "UNICORN", "UNIFORM",
    "VACATION", "VANILLA", "VEHICLE", "VILLAGE", "VINEGAR", "VIOLIN", "VISITOR", "VOLCANO",
    "WEATHER", "WEDDING", "WEEKEND", "WHISPER", "WITNESS", "WRITING"
];

export async function POST() {
    // 1. Get Current Day
    const { data: dayData } = await supabase.from('global_settings').select('value').eq('key', 'current_day').single();
    const currentDay = parseInt(dayData?.value || '1');

    // --- (EXISTING COMBAT LOGIC) ---
    // We keep this exactly the same, processing orders for 'currentDay'
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

            // 1. TRANSFER (Reinforce own territory)
            if (order_type === 'transfer' && target.owner_id === user_id) {
                await supabase.from('map_state').update({ minds: target.minds + minds }).eq('country_id', target_country_id);
                await log(currentDay, `Reinforcements: ${minds} minds moved to ${target_country_id}.`, 'info');
            }

            // 2. EXPLORE (Convert Neutral)
            else if (order_type === 'explore') {
                if (target.owner_id) {
                    // Explored into owned territory? Treat as failed or bounce.
                    // Refund.
                    await supabase.from('map_state').update({ minds: source.minds + minds }).eq('country_id', source_country_id);
                    await log(currentDay, `Exploration Failed: ${target_country_id} is already inhabited by another civilization. Troops returned.`, 'info');
                    continue;
                }

                const population = target.minds;
                if (minds >= population) {
                    // SUCCESS: Convert
                    const converted = Math.floor(population / 2);
                    const newArmy = minds + converted;
                    await supabase.from('map_state').update({ owner_id: user_id, minds: newArmy }).eq('country_id', target_country_id);
                    await log(currentDay, `EXPLORATION: ${source_country_id} annexed ${target_country_id}. +${converted} locals joined.`, 'conquest');
                } else {
                    // FAILURE: Bounce
                    const { data: currentSource } = await supabase.from('map_state').select('minds').eq('country_id', source_country_id).single();
                    if (currentSource) {
                        await supabase.from('map_state').update({ minds: currentSource.minds + minds }).eq('country_id', source_country_id);
                    }
                    await log(currentDay, `EXPLORATION FAILED: Expedition to ${target_country_id} (Pop: ${population}) retreated. (Sent: ${minds})`, 'info');
                }
            }

            // 3. ATTACK (Combat vs Player or "Aggressive" vs Neutral if user bypassed explore)
            else if (order_type === 'attack' || (order_type === 'transfer' && target.owner_id !== user_id)) {

                // (Existing Risk Combat Logic)
                // Note: If user attacks a neutral with 'attack' order, it triggers combat logic (dice).
                // This is fine, effectively "Aggressive Expansion".
                // But the UI will encourage 'explore'.

                // RISK COMBAT SIMULATION
                let att = minds;
                let def = target.minds;
                const battleLog: string[] = [];

                while (att > 0 && def > 0) {
                    // 1. Determine Dice Count (TOTAL WAR: All troops roll)
                    const attDiceCount = att;
                    const defDiceCount = def;

                    // 2. Roll Dice
                    const attRolls = Array.from({ length: attDiceCount }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
                    const defRolls = Array.from({ length: defDiceCount }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);

                    // 3. Compare Results
                    const comparisons = Math.min(attRolls.length, defRolls.length);
                    for (let i = 0; i < comparisons; i++) {
                        if (attRolls[i] > defRolls[i]) {
                            def--; // Defender loses
                        } else {
                            att--; // Attacker loses (ties go to defender)
                        }
                    }
                }

                if (att > 0) {
                    // VICTORY
                    await supabase.from('map_state').update({ owner_id: user_id, minds: att }).eq('country_id', target_country_id);
                    await log(currentDay, `CONQUEST: ${source_country_id} captures ${target_country_id}! (Sent: ${minds}, Lost: ${minds - att}, Killed: ${target.minds})`, 'conquest');
                } else {
                    // DEFEAT
                    await supabase.from('map_state').update({ minds: def }).eq('country_id', target_country_id);
                    await log(currentDay, `DEFEAT: Attack on ${target_country_id} repelled. (Sent: ${minds}, Died: ${minds}, Defenders Remaining: ${def})`, 'combat');
                }
            }
        }
        await supabase.from('orders').delete().eq('day_number', currentDay);
    }

    // ========================================================
    // ECONOMY PHASE (Automatic)
    // ========================================================
    // 1. Fetch Fresh Map State & Adjacency Data
    const { data: allCountries } = await supabase.from('countries').select('id, connections');
    const { data: mapState } = await supabase.from('map_state').select('*');

    if (allCountries && mapState) {
        const economyLogs: string[] = [];
        const updates: Record<string, number> = {}; // country_id -> new_minds

        // Helper to get current minds (checking updates first, then DB state)
        const getMinds = (id: string) => (updates[id] !== undefined ? updates[id] : (mapState.find(c => c.country_id === id)?.minds || 0));
        const getOwner = (id: string) => mapState.find(c => c.country_id === id)?.owner_id;

        // Group by Player
        const playerTerritories: Record<string, string[]> = {};
        mapState.forEach(region => {
            if (region.owner_id) {
                if (!playerTerritories[region.owner_id]) playerTerritories[region.owner_id] = [];
                playerTerritories[region.owner_id].push(region.country_id);
            }
        });

        // Apply Logic Per Player
        for (const [userId, territories] of Object.entries(playerTerritories)) {
            // A. PASSIVE INCOME: +1 to every territory
            territories.forEach(tid => {
                updates[tid] = getMinds(tid) + 1;
            });

            // B. DRAFT BONUS: +3 to Frontlines
            // Identify Frontlines
            const frontlines = territories.filter(tid => {
                const countryRef = allCountries.find(c => c.id === tid);
                if (!countryRef) return false;
                // Check neighbors
                return countryRef.connections.some((neighborId: string) => {
                    const neighborOwner = getOwner(neighborId);
                    return neighborOwner !== userId; // Enemy or Neutral
                });
            });

            const draftPool = frontlines.length > 0 ? frontlines : territories; // Fallback to anywhere if safe

            // Distribute 3 minds randomly
            const drafted = [];
            for (let i = 0; i < 3; i++) {
                const target = draftPool[Math.floor(Math.random() * draftPool.length)];
                updates[target] = getMinds(target) + 1;
                drafted.push(target);
            }
            economyLogs.push(`Player ...${userId.slice(-4)} drafted to: ${drafted.join(', ')}`);
        }

        // Commit Updates
        const upsertData = Object.entries(updates).map(([id, minds]) => ({
            country_id: id,
            minds: minds
        }));

        if (upsertData.length > 0) {
            const { error } = await supabase.from('map_state').upsert(upsertData);
            if (error) console.error("Economy Update Error:", error);
            else await log(currentDay, `Economy Resolved: Global passive growth + Drafts completed.`, 'info');
        }
    }

    // ========================================================
    // NEW: ADVANCE THE DAY & GENERATE CONTENT
    // ========================================================
    const nextDay = currentDay + 1;

    // 1. Update Global Settings
    await supabase.from('global_settings').upsert({ key: 'current_day', value: nextDay.toString() }, { onConflict: 'key' });

    // 2. Generate Puzzle from the NEW Word Bank
    const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];

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