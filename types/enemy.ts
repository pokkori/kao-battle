import { ExpressionType } from "./expression";

/** 敵の攻撃パターン */
export type EnemyAttackType =
  | "normal"
  | "heavy"
  | "rapid"
  | "charge"
  | "heal"
  | "debuff";

/** 敵の攻撃定義 */
export interface EnemyAttack {
  type: EnemyAttackType;
  damage: number;
  interval: number;
  weight: number;
  warningDuration?: number;
  hitCount?: number;
  healAmount?: number;
  weakness?: ExpressionType;
}

/** 敵データ定義 */
export interface EnemyData {
  id: string;
  name: string;
  description: string;
  hp: number;
  spriteId: string;
  scale: number;
  attacks: EnemyAttack[];
  isBoss: boolean;
  coinReward: number;
  scoreReward: number;
  weakness: ExpressionType;
  resistance: ExpressionType;
  enterLine: string;
  defeatLine: string;
}

/** バトル中の敵インスタンス */
export interface EnemyInstance extends EnemyData {
  currentHP: number;
  nextAttack: EnemyAttack | null;
  isCharging: boolean;
}
