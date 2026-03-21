import { EnemyAttack, EnemyData } from "../../types/enemy";

/** Pick an attack based on weighted probabilities */
export function pickAttack(enemy: EnemyData): EnemyAttack {
  const r = Math.random();
  let cumulative = 0;
  for (const attack of enemy.attacks) {
    cumulative += attack.weight;
    if (r <= cumulative) return attack;
  }
  return enemy.attacks[enemy.attacks.length - 1];
}

/** Get attack interval accounting for boss phase */
export function getAttackInterval(attack: EnemyAttack, speedMultiplier: number): number {
  return Math.round(attack.interval * speedMultiplier);
}
