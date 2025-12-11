const SIMULATIONS = 10000;

function runBattle(attackerStart, defenderStart, maxAttDice, maxDefDice) {
    let att = attackerStart;
    let def = defenderStart;

    while (att > 0 && def > 0) {
        const attDiceCount = Math.min(maxAttDice, att);
        const defDiceCount = Math.min(maxDefDice, def);

        const attRolls = Array.from({ length: attDiceCount }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
        const defRolls = Array.from({ length: defDiceCount }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);

        const comparisons = Math.min(attRolls.length, defRolls.length);
        for (let i = 0; i < comparisons; i++) {
            if (attRolls[i] > defRolls[i]) {
                def--;
            } else {
                att--;
            }
        }
    }
    return { attackerWon: att > 0, survivors: Math.max(att, def) };
}

function simulate(label, att, def, maxAtt, maxDef) {
    let attackerWins = 0;
    let totalSurvivors = 0;

    for (let i = 0; i < SIMULATIONS; i++) {
        const result = runBattle(att, def, maxAtt, maxDef);
        if (result.attackerWon) attackerWins++;
        totalSurvivors += result.survivors;
    }

    const winRate = ((attackerWins / SIMULATIONS) * 100).toFixed(1);
    const avgSurvivors = (totalSurvivors / SIMULATIONS).toFixed(1);

    console.log(`[${label}] ${att}v${def}: Attacker Wins ${winRate}% (Avg Survivors: ${avgSurvivors})`);
}

console.log("--- COMBAT BALANCE SIMULATION (10,000 Runs) ---");

console.log("\n1. STANDARD RISK (Att 3 vs Def 2)");
simulate("Std", 10, 10, 3, 2);
simulate("Std", 50, 50, 3, 2);

console.log("\n2. STRONG DEFENSE (Att 3 vs Def 3)");
simulate("Def3", 10, 10, 3, 3);
simulate("Def3", 50, 50, 3, 3);
simulate("Def3", 60, 50, 3, 3); // Attacker advantage needed?

console.log("\n3. LOW INTENSITY (Att 2 vs Def 2)");
simulate("Low2", 10, 10, 2, 2);
simulate("Low2", 50, 50, 2, 2);

console.log("\n4. TOTAL WAR (Unlimited Dice)");
// Passing 9999 effectively acts as "All troops roll"
simulate("Total", 10, 10, 9999, 9999);
simulate("Total", 50, 50, 9999, 9999);
simulate("Total", 10, 8, 9999, 9999);
simulate("Total", 20, 10, 9999, 9999);
simulate("Total", 6, 3, 9999, 9999);
simulate("Total", 6, 5, 9999, 9999);
simulate("Total", 9, 8, 9999, 9999); // <--- Added this

console.log("-----------------------------------------------");
