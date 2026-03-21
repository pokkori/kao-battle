/** プレイヤー永続データ */
export interface PlayerData {
  totalCoins: number;
  coins: number;
  unlockedStages: string[];
  stageScores: Record<string, number>;
  stageRanks: Record<string, RankGrade>;
  purchasedItems: string[];
  equippedPunchEffect: string;
  equippedBarrierSkin: string;
  equippedBeamEffect: string;
  equippedTitle: string;
  unlockedAchievements: string[];
  lastDailyDate: string;
  dailyStreak: number;
  totalPlays: number;
  totalPlayTime: number;
  totalEnemiesDefeated: number;
  overallMaxCombo: number;
  adFree: boolean;
  dataVersion: number;
  firstPlayDate: string;
  lastPlayDate: string;
}

/** ランク評価 */
export type RankGrade = "S" | "A" | "B" | "C" | "D";

/** ランク評価基準 */
export interface RankThreshold {
  grade: RankGrade;
  scorePercent: number;
  maxDamagePercent: number;
  minCombo: number;
}

/** ランク閾値定数 */
export const RANK_THRESHOLDS: RankThreshold[] = [
  { grade: "S", scorePercent: 90, maxDamagePercent: 10, minCombo: 15 },
  { grade: "A", scorePercent: 75, maxDamagePercent: 30, minCombo: 10 },
  { grade: "B", scorePercent: 55, maxDamagePercent: 50, minCombo: 5 },
  { grade: "C", scorePercent: 35, maxDamagePercent: 75, minCombo: 2 },
  { grade: "D", scorePercent: 0, maxDamagePercent: 100, minCombo: 0 },
];
