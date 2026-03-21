import { ExpressionType } from "../../types/expression";

export interface DailyChallenge {
  id: string;
  description: string;
  type: "expression_only" | "combo_min" | "no_damage" | "time_limit" | "defeat_count" | "skill_count";
  targetExpression?: ExpressionType;
  targetValue: number;
  coinReward: number;
}

export const CHALLENGE_POOL: DailyChallenge[] = [
  { id: "dc_smile_3", description: "笑顔だけで敵を3体倒せ", type: "expression_only", targetExpression: "happy", targetValue: 3, coinReward: 100 },
  { id: "dc_angry_5", description: "怒りパンチを5回使え", type: "skill_count", targetExpression: "angry", targetValue: 5, coinReward: 80 },
  { id: "dc_combo_10", description: "コンボ10以上を達成", type: "combo_min", targetValue: 10, coinReward: 150 },
  { id: "dc_combo_20", description: "コンボ20以上を達成", type: "combo_min", targetValue: 20, coinReward: 300 },
  { id: "dc_no_damage", description: "ステージをノーダメージクリア", type: "no_damage", targetValue: 1, coinReward: 200 },
  { id: "dc_time_60", description: "60秒以内にステージクリア", type: "time_limit", targetValue: 60, coinReward: 120 },
  { id: "dc_defeat_10", description: "敵を合計10体倒せ", type: "defeat_count", targetValue: 10, coinReward: 100 },
  { id: "dc_surprise_3", description: "驚きビームで敵を3体倒せ", type: "expression_only", targetExpression: "surprise", targetValue: 3, coinReward: 120 },
  { id: "dc_heal_5", description: "悲しみヒールを5回使え", type: "skill_count", targetExpression: "sad", targetValue: 5, coinReward: 100 },
  { id: "dc_all_expression", description: "1バトルで全4表情を使え", type: "skill_count", targetValue: 4, coinReward: 150 },
  { id: "dc_boss_defeat", description: "ボスを1体撃破", type: "defeat_count", targetValue: 1, coinReward: 200 },
  { id: "dc_time_90", description: "90秒以内にステージクリア", type: "time_limit", targetValue: 90, coinReward: 80 },
];

export function getDailyChallenges(dateString: string): DailyChallenge[] {
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed = ((seed << 5) - seed + dateString.charCodeAt(i)) | 0;
  }
  const shuffled = [...CHALLENGE_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) | 0;
    const j = Math.abs(seed) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

export const LOGIN_BONUSES = [50, 75, 100, 125, 150, 200, 500];
