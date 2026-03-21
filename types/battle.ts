import { ExpressionType } from "./expression";
import { EnemyInstance } from "./enemy";

/** プレイヤースキル種別 */
export type SkillType = "punch" | "barrier" | "beam" | "heal" | "idle";

/** 表情→スキルのマッピング */
export const EXPRESSION_SKILL_MAP: Record<ExpressionType, SkillType> = {
  angry: "punch",
  happy: "barrier",
  surprise: "beam",
  sad: "heal",
  neutral: "idle",
};

/** スキル定義 */
export interface Skill {
  type: SkillType;
  basePower: number;
  cooldown: number;
  chargeTime: number;
  effectId: string;
  soundId: string;
}

/** スキルデータ定数 */
export const SKILLS: Record<SkillType, Skill> = {
  punch: {
    type: "punch",
    basePower: 30,
    cooldown: 800,
    chargeTime: 300,
    effectId: "effect_punch",
    soundId: "se_punch",
  },
  barrier: {
    type: "barrier",
    basePower: 70,
    cooldown: 1500,
    chargeTime: 200,
    effectId: "effect_barrier",
    soundId: "se_barrier",
  },
  beam: {
    type: "beam",
    basePower: 60,
    cooldown: 2000,
    chargeTime: 500,
    effectId: "effect_beam",
    soundId: "se_beam",
  },
  heal: {
    type: "heal",
    basePower: 15,
    cooldown: 3000,
    chargeTime: 800,
    effectId: "effect_heal",
    soundId: "se_heal",
  },
  idle: {
    type: "idle",
    basePower: 0,
    cooldown: 0,
    chargeTime: 0,
    effectId: "",
    soundId: "",
  },
};

/** バトル状態 */
export type BattlePhase =
  | "intro"
  | "ready"
  | "fight"
  | "boss_warning"
  | "boss_fight"
  | "win"
  | "lose"
  | "paused";

/** バトルの全状態 */
export interface BattleState {
  phase: BattlePhase;
  playerHP: number;
  playerMaxHP: number;
  currentEnemy: EnemyInstance | null;
  enemyHP: number;
  score: number;
  combo: number;
  maxCombo: number;
  defeatedCount: number;
  totalEnemies: number;
  elapsedTime: number;
  totalDamageTaken: number;
  totalDamageDealt: number;
  skillUseCounts: Record<SkillType, number>;
  cooldowns: Record<SkillType, number>;
  barrierActive: boolean;
  barrierRemaining: number;
  enemyAttackTimer: number;
  requestedExpression: ExpressionType | null;
  snapshots: string[];
  enragedKillCount: number;
}

/** コンボボーナス係数 */
export const COMBO_MULTIPLIER = (combo: number): number => {
  if (combo < 3) return 1.0;
  if (combo < 5) return 1.2;
  if (combo < 10) return 1.5;
  if (combo < 20) return 2.0;
  return 2.5;
};

/** ダメージ計算結果 */
export interface DamageResult {
  damage: number;
  critical: boolean;
  comboMultiplier: number;
}
