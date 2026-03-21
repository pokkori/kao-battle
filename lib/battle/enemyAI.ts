import { EnemyAttack, EnemyData } from "../../types/enemy";

/** Pick an attack based on weighted probabilities */
export function pickAttack(
  enemy: EnemyData,
  enemyHpRatio: number = 1,
  turnCount: number = 0,
): EnemyAttack {
  // 激怒モード: HP50%以下で攻撃ウェイトを2倍に強化
  const enraged = enemyHpRatio <= 0.5;
  // パターン攻撃: 3ターンごとに最大ダメージ攻撃を強制
  if (turnCount > 0 && turnCount % 3 === 0 && enemy.attacks.length >= 2) {
    const heaviestAttack = [...enemy.attacks].sort((a, b) => b.damage - a.damage)[0];
    return heaviestAttack;
  }
  const r = Math.random();
  let cumulative = 0;
  for (const attack of enemy.attacks) {
    const w = enraged ? attack.weight * (attack.damage > 20 ? 2.0 : 0.5) : attack.weight;
    cumulative += w;
    if (r * (enraged ? enemy.attacks.reduce((s, a) => s + a.weight * (a.damage > 20 ? 2 : 0.5), 0) : 1) <= cumulative) {
      return attack;
    }
  }
  return enemy.attacks[enemy.attacks.length - 1];
}

/** Get attack interval accounting for boss phase */
export function getAttackInterval(attack: EnemyAttack, speedMultiplier: number): number {
  return Math.round(attack.interval * speedMultiplier);
}
