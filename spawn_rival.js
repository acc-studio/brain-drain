const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually load .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("--- SPAWNING RIVAL PLAYER (ATTEMPT 2) ---");

    const RIVAL_EMAIL = "rival_v2@cpu.com";
    const RIVAL_PASS = "SuperSecur3P@ssw0rd!";
    let rivalId = null;

    // 1. Try to fetch existing candidates
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) console.error("List Error:", listError);

    if (listData && listData.users) {
        console.log(`Found ${listData.users.length} users.`);
        // Try to find any user that looks like a CPU or just isn't the main player
        const cpuUser = listData.users.find(u => u.email.includes("cpu") || u.email.includes("rival"));
        if (cpuUser) {
            rivalId = cpuUser.id;
            console.log(`Found existing CPU user: ${rivalId} (${cpuUser.email})`);
        } else {
            // Just grab any user that isn't connected to the main email if possible
            const other = listData.users.find(u => !u.email.includes("oyun") && !u.email.includes("aziz"));
            if (other) {
                rivalId = other.id;
                console.log(`Found alternate user: ${rivalId} (${other.email})`);
            }
        }
    }

    // 2. Create if not found
    if (!rivalId) {
        console.log(`Creating new rival user: ${RIVAL_EMAIL}...`);
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: RIVAL_EMAIL,
            password: RIVAL_PASS,
            email_confirm: true,
            user_metadata: {
                username: "RivalBot",
                full_name: "CPU Rival",
                avatar_url: ""
            }
        });

        if (createError) {
            console.error("Failed to create user:", createError);
        } else {
            rivalId = createData.user.id;
            console.log(`Created new rival: ${rivalId}`);
            // Wait a moment for triggers to populate public tables
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // 3. Assign Territory
    if (rivalId) {
        const TARGET_COUNTRY = "southern_europe";
        const MINDS = 7;

        console.log(`Assigning ${TARGET_COUNTRY} to ${rivalId}...`);
        const { error } = await supabase
            .from('map_state')
            .update({ owner_id: rivalId, minds: MINDS })
            .eq('country_id', TARGET_COUNTRY);

        if (error) {
            console.error("Error assigning territory:", error);
        } else {
            console.log(`SUCCESS: ${TARGET_COUNTRY} is now owned by Rival (ID: ${rivalId}) with ${MINDS} troops.`);
        }
    } else {
        console.error("Could not obtain a Rival ID.");
    }
}

main();
