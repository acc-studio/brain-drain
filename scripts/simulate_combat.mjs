// Monte-Carlo balance harness for Total War dice combat.
// Verifies attacker win% across force ratios and the Combat-tier bonus dice.
// Run: npm run simulate
const RUNS = 20000;

function resolveCombat(attackers, defenders, bonusDice, rng) {
  let att = attackers;
  let def = defenders;
  let rounds = 0;
  while (att > 0 && def > 0 && rounds < 1000) {
    rounds++;
    const a = Array.from({ length: att + bonusDice }, () => 1 + Math.floor(rng() * 6)).sort((x, y) => y - x);
    const d = Array.from({ length: def }, () => 1 + Math.floor(rng() * 6)).sort((x, y) => y - x);
    const pairs = Math.min(a.length, d.length);
    for (let i = 0; i < pairs; i++) {
      if (att <= 0 || def <= 0) break;
      if (a[i] > d[i]) def--;
      else att--;
    }
  }
  return def === 0 && att > 0 ? att : 0; // surviving attackers if won, else 0
}

function winRate(att, def, bonus) {
  let wins = 0;
  let survSum = 0;
  for (let i = 0; i < RUNS; i++) {
    const s = resolveCombat(att, def, bonus, Math.random);
    if (s > 0) {
      wins++;
      survSum += s;
    }
  }
  return { win: wins / RUNS, avgSurv: wins ? survSum / wins : 0 };
}

const ratios = [
  [5, 5], [8, 5], [10, 5], [10, 8], [12, 8], [15, 10], [20, 10],
];
const bonuses = [
  { label: "T3/none (+0)", b: 0 },
  { label: "T2 (+1)", b: 1 },
  { label: "T1 (+2)", b: 2 },
];

console.log(`\nTotal War combat — attacker win% over ${RUNS} runs\n`);
console.log("att  def | " + bonuses.map((x) => x.label.padEnd(14)).join(""));
console.log("-".repeat(60));
for (const [att, def] of ratios) {
  const cells = bonuses.map(({ b }) => {
    const { win, avgSurv } = winRate(att, def, b);
    return `${(win * 100).toFixed(0)}% (${avgSurv.toFixed(1)})`.padEnd(14);
  });
  console.log(`${String(att).padStart(3)}  ${String(def).padStart(3)} | ${cells.join("")}`);
}
console.log("\n(value in parens = avg surviving attackers when the attack succeeds)\n");
