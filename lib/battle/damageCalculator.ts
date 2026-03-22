import { Skill, EXPRESSION_SKILL_MAP, COMBO_MULTIPLIER, DamageResult } from "../../types/battle";
import { ExpressionType } from "../../types/expression";
import { EnemyData, EnemyAttack } from "../../types/enemy";

export function getComboMultiplier(combo: number): number {
  if (combo >= 20) return 2.0;
  if (combo >= 10) return 1.5;
  if (combo >= 5)  return 1.2;
  return 1.0;
}

const EFFECT_BONUS_MAP: Record<string, number> = {
  default_punch: 1.0,
  fire_punch: 1.05,
  thunder_punch: 1.05,
  ice_punch: 1.05,
  galaxy_punch: 1.10,
  dragon_punch: 1.15,
  default_beam: 1.0,
  laser_beam: 1.05,
  plasma_beam: 1.05,
  rainbow_beam: 1.10,
  blackhole_beam: 1.15,
};

export function getEffectBonus(effectId: string): number {
  return EFFECT_BONUS_MAP[effectId] ?? 1.0;
}

export function getBarrierBonus(skinId: string): { durationBonus: number; reductionBonus: number } {
  const map: Record<string, { durationBonus: number; reductionBonus: number }> = {
    default_barrier: { durationBonus: 0, reductionBonus: 0 },
    flower_barrier: { durationBonus: 200, reductionBonus: 0 },
    crystal_barrier: { durationBonus: 200, reductionBonus: 0 },
    rainbow_barrier: { durationBonus: 400, reductionBonus: 0 },
    cosmos_barrier: { durationBonus: 500, reductionBonus: 5 },
  };
  return map[skinId] ?? { durationBonus: 0, reductionBonus: 0 };
}

export function calculatePlayerDamage(
  skill: Skill,
  expressionScore: number,
  combo: number,
  enemy: EnemyData,
  equippedEffect: string
): DamageResult {
  const baseDamage = skill.basePower;
  const expressionMultiplier = 0.7 + (expressionScore * 0.6);
  const comboMult = COMBO_MULTIPLIER(combo);

  let weaknessMultiplier = 1.0;
  const skillExpression = (Object.entries(EXPRESSION_SKILL_MAP) as [ExpressionType, string][])
    .find(([, s]) => s === skill.type)?.[0] as ExpressionType | undefined;
  if (skillExpression === enemy.weakness) {
    weaknessMultiplier = 2.0;
  } else if (skillExpression === enemy.resistance) {
    weaknessMultiplier = 0.5;
  }

  const criticalChance = expressionScore >= 0.8 ? 0.20 : 0.05;
  const critical = Math.random() < criticalChance;
  const criticalMultiplier = critical ? 1.5 : 1.0;
  const effectBonus = getEffectBonus(equippedEffect);

  const finalDamage = Math.round(
    baseDamage * expressionMultiplier * comboMult * weaknessMultiplier * criticalMultiplier * effectBonus
  );

  return {
    damage: Math.max(1, finalDamage),
    critical,
    comboMultiplier: comboMult,
  };
}

export function calculateEnemyDamage(
  attack: EnemyAttack,
  barrierActive: boolean,
  barrierBasePower: number
): number {
  let damage = attack.damage;

  if (barrierActive) {
    if (attack.type === "charge") {
      damage = 0;
    } else if (attack.type === "heavy") {
      damage = Math.round(damage * 0.5);
    } else if (attack.type === "normal" || attack.type === "rapid") {
      damage = Math.round(damage * (1 - barrierBasePower / 100));
    } else if (attack.type === "debuff") {
      damage = 0;
    }
  }

  return Math.max(0, damage);
}
