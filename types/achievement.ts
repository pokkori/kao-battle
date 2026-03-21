/** 実績カテゴリ */
export type AchievementCategory =
  | "battle"
  | "expression"
  | "collection"
  | "challenge"
  | "social";

/** 実績定義 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconId: string;
  coinReward: number;
  conditionKey: string;
  conditionValue: number;
  hidden: boolean;
}
