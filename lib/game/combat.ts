/**
 * Total War dice combat (Risk-style, bloody variant).
 *
 * Each round both sides roll one d6 per unit; the attacker rolls `bonusDice`
 * EXTRA dice (from their Combat-puzzle tier). Dice are sorted descending and
 * paired off: higher wins, ties go to the defender. One casualty per pair.
 * Rounds repeat until one side is annihilated.
 */

export type Rng = () => number;

const d6 = (rng: Rng) => 1 + Math.floor(rng() * 6);

function rollSortedDesc(count: number, rng: Rng): number[] {
  const dice: number[] = [];
  for (let i = 0; i < count; i++) dice.push(d6(rng));
  return dice.sort((a, b) => b - a);
}

export interface CombatResult {
  attackerWon: boolean;
  attackerLosses: number;
  defenderLosses: number;
  survivingAttackers: number;
  survivingDefenders: number;
  rounds: number;
}

/**
 * @param attackers  attacking units committed
 * @param defenders  defending units
 * @param bonusDice  extra attacker dice per round (Combat tier: T1=2, T2=1, T3=0)
 */
export function resolveCombat(
  attackers: number,
  defenders: number,
  bonusDice = 0,
  rng: Rng = Math.random,
): CombatResult {
  let att = Math.max(0, Math.floor(attackers));
  let def = Math.max(0, Math.floor(defenders));
  const att0 = att;
  const def0 = def;
  let rounds = 0;

  while (att > 0 && def > 0 && rounds < 1000) {
    rounds++;
    const aDice = rollSortedDesc(att + bonusDice, rng);
    const dDice = rollSortedDesc(def, rng);
    const pairs = Math.min(aDice.length, dDice.length);
    for (let i = 0; i < pairs; i++) {
      if (att <= 0 || def <= 0) break;
      if (aDice[i] > dDice[i]) def--; // attacker die strictly higher wins
      else att--; // tie or lower → defender wins
    }
  }

  return {
    attackerWon: def === 0 && att > 0,
    attackerLosses: att0 - att,
    defenderLosses: def0 - def,
    survivingAttackers: att,
    survivingDefenders: def,
    rounds,
  };
}

/**
 * Monte-Carlo attacker win probability — used for the client-side odds preview
 * on the order modal.
 */
export function estimateWinChance(
  attackers: number,
  defenders: number,
  bonusDice = 0,
  runs = 400,
  rng: Rng = Math.random,
): number {
  if (attackers <= 0) return 0;
  if (defenders <= 0) return 1;
  let wins = 0;
  for (let i = 0; i < runs; i++) {
    if (resolveCombat(attackers, defenders, bonusDice, rng).attackerWon) wins++;
  }
  return wins / runs;
}
