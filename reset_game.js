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
const TARGET_EMAIL = "oyun@kurucu.com";

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("--- BRAIN DRAIN RESET PROTOCOL ---");

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const targetUser = users.find(u => u.email === TARGET_EMAIL);
    if (!targetUser) {
        console.error(`User ${TARGET_EMAIL} not found!`);
        process.exit(1);
    }
    const userId = targetUser.id;
    console.log(`Found USER: ${TARGET_EMAIL} (${userId})`);

    // 2. Wipe Dynamic Tables
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All
    console.log("Deleted: orders");

    await supabase.from('game_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete All
    console.log("Deleted: game_logs");

    await supabase.from('daily_performance').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    console.log("Deleted: daily_performance");

    // 3. Reset Map State
    // Set everyone to Neutral (NULL owner), 3 Minds Default
    await supabase.from('map_state').update({ owner_id: null, minds: 3 }).neq('country_id', 'XXX');
    console.log("Reset: map_state to Neutral/3");

    // 4. Assign Turkey
    await supabase.from('map_state').update({ owner_id: userId, minds: 6 }).eq('country_id', 'turkey');
    console.log(`Assigned: TURKEY to ${TARGET_EMAIL} with 6 Minds`);

    // 5. Reset Day
    await supabase.from('global_settings').upsert({ key: 'current_day', value: '1' });
    console.log("Reset: Day to 1");

    console.log("--- RESET COMPLETE ---");
}

main().catch(console.error);
